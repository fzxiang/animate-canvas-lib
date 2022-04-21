const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const execa = require('execa')
const { gzipSync } = require('zlib')
const { compress } = require('brotli')

const { targets: allTargets } = require('./utils')
// cpu 核心数
const cpuCores = require('os').cpus().length

const args = require('minimist')(process.argv.slice(2))
const targets = args._
const formats = args.formats || args.f
const devOnly = args.devOnly || args.d
const sourceMap = args.sourceMap || args.s
const isRelease = args.release
const buildType = args.t || args.types || isRelease
const buildAllMatching = args.all || args.a
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)

run().catch(e => console.error(e))

async function run()  {
  if(isRelease) {
    // 如果打包正式版事先清除缓存
    await fs.remove(path.resolve(__dirname, '../node_modules/.rts2_cache'))
  }
  if(!targets.length) {
    await buildAll(allTargets)
    checkAllSize(allTargets)
  } else {
    // await buildAll()
  }
}

async function buildAll(targets) {
  await runParallel(cpuCores, targets, build)
}
// 同步执行器
async function runParallel(maxConcurrency, source, iteratorFn) {
  const ret = []
  const executing = []
  for (const item of source) {
    // 异步器
    const p = Promise.resolve().then(()=>iteratorFn(item, source))
    ret.push(p)

    if(maxConcurrency <= source.length) {
      // 执行结束后 从事件堆excuting移出
      const e = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)

      // 事件堆满员后 同步执行
      if( executing.length >= maxConcurrency) {
        await Promise.race(executing)
      }
    }
  }

  return Promise.all(ret)
}
async function build(target) {
  const pkgDir = path.resolve(`packages/${target}`)
  const pkg = require(`${pkgDir/package.json}`)

  if ((isRelease || !targets.length) && pkg.private) {
    return
  }

  // 如果打包特定的格式， 不需要清除原有的包
  if (!formats) {
    await fs.remove(`${pkgDir}/dist`)
  }

  const env = (pkg.buildOptions && pkg.buildOptions.env) || (devOnly ? 'development' : 'production')

  const command = [
    `COMMIT: ${commit}`,
    `NODE_ENV: ${env}`,
    `TARGET: ${target}`,
    formats ? `FORMATS: ${formats}` : ``,
    buildType ? `TYPES: true` : ``,
    prodOnly ? `PROD_ONLY: true` : ``,
    sourceMap ? `SOURCE_MAP:true` : ``
  ]
    .filter(Boolean)
    .join(',')
  await execa(
    'rollup', 
    [
      '--config',
      '--environment',
      [
        `COMMIT: ${commit}`,
        `NODE_ENV: ${env}`,
        `TARGET: ${target}`,
        formats ? `FORMATS: ${formats}` : ``,
        buildType ? `TYPES: true` : ``,
        prodOnly ? `PROD_ONLY: true` : ``,
        sourceMap ? `SOURCE_MAP:true` : ``
      ]
        .filter(Boolean)
        .join(',')
    ],
    { stdio: 'inherit' }
  )
}

function checkAllSize(targets) {
  // dev 环境下和自定义格式不检测包体大小
  if (devOnly || (formats && !formats.includes('global'))) {
    return
  }
  console.time('包体大小检测')
  for (const target of targets) {
    checkSize(target)
  }
  console.timeEnd('包体大小检测')
}

function checkSize(target) {
  const pkgDir = path.resolve(`packages/${target}`)
  checkFileSize(`${pkgDir}/dist/${target}.global.prod.js`)
  if (!formats || formats.includes('global-runtime')) {
    checkFileSize(`${pkgDir}/dist/${target}.runtime.global.prod.js`)
  }
}

function checkFileSize(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }
  // 计算打包后文件大小和 两个压缩方式zip brotli的包体大小
  const file = fs.readFileSync(filePath)
  const minSize = (file.length / 1024).toFixed(2) + 'kb'
  const gzipped = gzipSync(file)
  const gzippedSize =(gzippedSize / 1024).toFixed(2) + 'kb'
  const compressed = compress(file)
  const compressedSize = (compressed / 1024).toFixed(2) + 'kb'
  console.log(
    `${chalk.gray(
      chalk.bold(path.basename(filePath))
    )} min:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`
  )
}