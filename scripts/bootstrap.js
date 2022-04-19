const args = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')
const { version, name, keywords, author, license, bugs, homepage } = require('../package.json')

const packageDir = path.resolve(__dirname, '../packages')
const files = fs.readdirSync(packageDir)

files.forEach(shortName => {
  // 排除非文件夹
  if(!fs.statSync(path.join(packageDir, shortName)).isDirectory()) {
    return
  }

  const subName = `@${name}/${shortName}`
  const pkgPath = path.join(packageDir, shortName, 'package.json')
  const pkgExists = fs.existsSync(pkgPath)

  if (pkgExists) {
    const pkg = require(pkgPath)
    // 排除私包
    if(pkg.private) {
      return 
    }
  }

  if(args.force || !pkgExists) {
    const json = {
      name: subName,
      version,
      description: subName,
      main: 'index.js',
      module: `dist/${shortName}.esm-boundler.js`,
      files: [`index.js`, `dist`],
      types: `dist/${shortName}.d.ts`,
      repository: {
        type: 'git',
        url: 'git+https://github.com/fzxiang/animate-canvas-lib.git'
      },
      keywords,
      author,
      license,
      bugs,
      homepage,
    }
    fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2))
  }
  
  const readmePath = path.join(packageDir, shortName, 'README.md')

  const srcDir = path.join(packageDir, shortName, 'index.js')
  const indexPath = path.join(packagesDir, shortName, `src/index.ts`)
  if (args.force || !fs.existsSync(indexPath)) {
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir)
    }
    fs.writeFileSync(indexPath, ``)
  }

  const nodeIndexPath = path.join(packagesDir, shortName, 'index.js')
  if(args.force || !fs.existsSync(nodeIndexPath)) {
    fs.writeFileSync(
      nodeIndexPath,
      `
'use strict'


if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/${shortName}.cjs.prod.js')
} else {
  module.exports = require('./dist/${shortName}.cjs.js')
}
    `.trim() + '\n'
    )
  }
})