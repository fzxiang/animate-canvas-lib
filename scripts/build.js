const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const execa = require('execa')
const { gzipSync } = require('zlib')
const { targets: allTargets } = require('./utils')
// cpu 核心数
const cpuCores = require('os').cpus().length

const args = require('minimist')(process.argv.slice(2))
const targets = args._
const formats = args.formats || args.format
const devOnly = args.devOnly || args.d
const sourceMap = args.sourceMap || args.s
const isRelease = args.release
const buildType = args.t || args.types || isRelease
const buildAllMatching = args.all || args.a
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)

console.log(commit)
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
  const pkg = require(`${pkgDir}`)
}
