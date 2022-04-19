const fs = require('fs')
const chalk = require('chalk')

const targets = (exports.targets = fs.readdirSync('packages').filter(f => {
  if(!fs.statSync(`packages/${f}`).isDirectory()) {
    return false
  }
  const pkg = require(`../packages/${f}/package.json`)
  if( pkg.private && !pkg.buildOptions ) {
    return false
  }
  return true
}))


exports.fuzzyMatchTarget = (partialTargets, inclueAllMatching) => {
  const matched= []
  partialTargets.forEach(partialTarget => {
    
  });

}