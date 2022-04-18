const args = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const semver = require('semver')
const currentVersion = require('../package.json').version
const { prompt } = require('enquirer')
const execa = require('execa')

console.log(args);
// 先行版本
const preId =
  args.preid ||
  (semver.prerelease(currentVersion) && semver.prerelease(currentVersion)[0])

const { 
  dry: isDryRun,
  skipTests,
  skipBuild
} = args

const packages = fs.readdirSync(path.resolve(__dirname, '../packages')).filter(p => !p.endsWith('.ts') && !p.startsWith('.'))

const skippedPackages = []

const VERSION_MAP = {
  patch: "打补丁",
  minor: "小版本",
  major: "大版本",
  prepatch: "先行补丁",
  preminor: "先行小版本",
  premajor: "先行大版本",
  prerelease: "先行正式版本",
}
const versionIncrements = [
  'patch',
  'minor',
  'major',
  ...(preId ? ['prepatch', 'preminor', 'premajor', 'prerelease'] : [])
]

const inc = i => semver.inc(currentVersion, i, preId)
const bin = name =>path.resolve(__dirname, '../node_modules/.bin/' + name )

const run = (bin, args, opts={}) => execa(bin, args, { stdio: 'inherit', ...opts })
const dryRun = (bin, args, opts = {}) => console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts)
const runIfNotDry = isDryRun ? dryRun : run
const getPkgRoot = pkg => path.resolve(__dirname, '../packages/' + pkg)
const step = msg => console.log(chalk.cyan(msg))

async function main () {
  let targetVersion = args._[0]
  if (!targetVersion) {
    const { release } = await prompt({
      type: 'select',
      name: 'release',
      message: '选择要发布的版本号',
      choices: versionIncrements.map(i => `${VERSION_MAP[i]} (${inc(i)})`).concat(['custom'])
    })

    // 自定版本发布
    if (release === 'custom') {
      targetVersion = await prompt({
        type: 'input',
        name: 'version',
        message: '请输入自定版本号',
        initial: currentVersion
      }).version
    } else {
      targetVersion = release.match(/\((.*)\)/)[1]
    }
  }

  // 校验输入版本是否正确 ✅
  if(!semver.valid(targetVersion)) {
    throw new Error('输入的版本请遵循规范: 查看 https://semver.org/lang/zh-CN/')
  }

  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `确认发布版本号: ${targetVersion}`
  })

  if (!yes) {
    return
  }

  step('\n 更新所有包版本号')
  updateVersions(targetVersion)

  step('\n 打包')
  if(!skipBuild && !isDryRun) {
    await run('pnpm', ['run', 'build', '--', '--release'])
  } else {
    console.log('(跳过打包)')
  }

  step('\n打卡更改记录')
  await run('pnpm', ['run', 'changelog'])

  step('\n更新锁包')
  await run('pnpm', ['install', '--prefer-offline'])

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\nCommitting changes...')
    await runIfNotDry('git', ['add', '-A'])
    await runIfNotDry('git', ['commit', '-m', `release: v${targetVersion}`])
  } else {
    console.log('No changes to commit.')
  }

  // 发布
  step('\n发包')
  for (const pkg of packages) {
    await publishPackage(pkg, targetVersion, runIfNotDry)
  }

  // 打标签推代码
  step('\nPushing to GitHub...')
  await runIfNotDry('git', ['tag', `v${targetVersion}`])
  await runIfNotDry('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
  await runIfNotDry('git', ['push'])
  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`)
  }

  if (skippedPackages.length) {
    console.log(
      chalk.yellow(
        `The following packages are skipped and NOT published:\n- ${skippedPackages.join(
          '\n- '
        )}`
      )
    )
  }
}

main().catch(e => console.error(e))


function updateVersions(version) {
  // 主包更新依赖
  updatePackge(path.resolve(__dirname, '..'), version)
  // 子包更新依赖
  packages.forEach(p => updatePackge(getPkgRoot(p), version))
}

function updatePackge(pkgRoot, version){
  const pkgPath = path.resolve(pkgRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = version

  // 子包中相互依赖包的版本修改为最新
  // updateDeps(pkg, 'dependencies', version)
  // updateDeps(pkg, 'peerDependecies', version)
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
}

async function publishPackage(pkgName, version, runIfNotDry){
  if(skippedPackages.includes(pkgName)) {
    return
  }
  const pkgRoot = getPkgRoot(pkgName)
  const pkgPath = path.resolve(pkgRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  if (pkg.private) {
    return
  }

  let releaseTag = null
  if (args.tag) {
    releaseTag = args.tag
  } else if (version.includes('alpha')) {
    releaseTag = 'alpha'
  } else if (version.includes('beta')) {
    releaseTag = 'beta'
  } else if (version.includes('rc')) {
    releaseTag = 'rc'
  }

  step(`Publishing ${pkgName}...`)
  try {
    await runIfNotDry(
      'pnpm', 
      ['publish', '--new-version', version, ...(releaseTag? ['--tag', releaseTag]:[]), '--access', 'public'], 
      {
        cwd: pkgRoot,
        stdio: 'pipe'
      }
    )
    console.log(chalk.green('发布成功版本', pkgName, version));
  } catch (e) {
    if (e.stderr.match(/previously published/)) {
      console.log(chalk.red(`Skipping already published: ${pkgName}`))
    } else {
      throw e
    }
  }

}