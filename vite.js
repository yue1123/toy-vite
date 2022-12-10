const express = require('express')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
// 编译 SFC
const compilerSFC = require('@vue/compiler-sfc')
const compilerDOM = require('@vue/compiler-dom')

const root = process.cwd()
const app = express()
const entryFilePath = path.resolve(root, './index.html')
const absolutePathReg = /from\s+[\'\"]([^\.\/].+)[\'\"]/g

/**
 * 获取npm 包的 package.json 文件内容
 * @param {String} module
 */
function getTargetDepModuleEntry(module) {
  return require(path.resolve(root, './node_modules/' + module + '/package.json')).module
}
/**
 * 替换依赖引入路径为 node_modules
 * import vue from 'vue'
 * 变成
 * import vue from '/node_modules/vue/xxx'
 * @param {String} content
 */
function rewriteImport(content) {
  return content.replace(absolutePathReg, (_, dep) => {
    const module = getTargetDepModuleEntry(dep)
    return 'from "' + ['/node_modules', dep, module].join('/') + '"'
  })
}

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.end(fs.readFileSync(entryFilePath))
})

app.get('*', (req, res) => {
  const url = req._parsedUrl.pathname
  try {
    // 处理 js 文件
    const filePath = path.resolve(root, '.' + url)
    // 读取文件
    const content = fs.readFileSync(filePath).toString()
    if (url.endsWith('.js')) {
      // 告诉浏览器当做 js 处理
      res.setHeader('Content-Type', 'application/javascript')
      // 重写 import
      res.end(rewriteImport(content))
    } else if (url.endsWith('.vue')) {
      res.setHeader('Content-Type', 'application/javascript')
      // 处理 vue 文件
      // 先编译 vue
      const query = req.query
      const ast = compilerSFC.parse(content)
      const { script, scriptSetup, template } = ast.descriptor
      if (!query.type) {
        const _script = script ? script.content.replace('export default', 'const __script = ') : null
        const sfc = `import { render as _render } from '${url}?type=template&d=${Date.now()}'
          ${_script}
          __script.render = _render
          export default __script`
        res.end(rewriteImport(sfc))
      } else if (query.type === 'template') {
        // 编译 template
        const render = compilerDOM.compile(template.content, { mode: 'module' }).code
        res.end(rewriteImport(render))
      }
    }
  } catch (error) {
    console.error(chalk.red('[vite error]', error.message))
    console.log(error)
    res.status(404)
    res.end()
  }
})

app.listen(5137, () => {
  console.log(chalk.cyan('vite is running at: http://127.0.0.1:5137'))
})
