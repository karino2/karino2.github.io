// copy from texttl-electron

const path = require('path')
const fs = require('fs/promises')
const {encode} = require('html-entities')


if (process.argv.length != 3) {
  console.log("Usage: main.js <TextTL path>")
  console.log(process.argv.length)
  process.exit(1)
}

const g_TEXTTL_DIR = process.argv[2]
const g_OUTPUT_PATH = "../../_includes/mysidebar.html"
const g_RELATIVE_PERM_ROOT = "TextTL_site/md"

// const g_ITEM_LIMIT = 5
const g_ITEM_LIMIT = 30


/*
    patに従うファイル名（0パディングの数字）を数字的に新しい順にsortした配列として返す。
*/
const readDirs = async(dirPath, pat) => {
  const dirs = await fs.readdir(dirPath)

  return await Promise.all(
      dirs
      .filter(fname => fname.match(pat))
      .filter( async fname => {
          const full = path.join(dirPath, fname)
          return (await fs.stat(full)).isDirectory()
      } )
      .sort( (a, b) => a < b ? 1 : -1)
      )
}

/*
4桁の数字のdirを数字的にあたらしい順にsortした配列として返す。
*/
const readYears = async(dirPath) => {
  return await readDirs( dirPath, /^[0-9][0-9][0-9][0-9]$/)
}

/*
2桁の数字のdirを数字的に新しい順にsortした配列として返す
*/
const readMonths = async(dirPath, yearstr) => {
  const targetDir = path.join(dirPath, yearstr)
  return await readDirs( targetDir, /^[0-9][0-9]$/)
} 

const readDays = async(dirPath, yearstr, monthstr) => {
  const targetDir = path.join(dirPath, yearstr, monthstr)
  return await readDirs( targetDir, /^[0-9][0-9]$/)
}

const readFilePathsAt = async(dirPath, yearstr, monthstr, daystr) => {
  const targetPath = path.join(dirPath, yearstr, monthstr, daystr)
  const files = await fs.readdir(targetPath)
  const permDir = path.join(g_RELATIVE_PERM_ROOT, yearstr, monthstr, daystr)
  return files
      .filter( fname => fname.match(/^[0-9]+\.txt$/) )
      .sort( (a, b) => a < b ? 1 : -1)
      .map(fname => { return {fullPath: path.join(targetPath, fname), permDir: permDir, fname: fname} })
}

const readFilePaths = async(dirPath, count) => {
  const years = await readYears(dirPath)
  let ret = []
  for (const year of years) {
      const months = await readMonths(dirPath, year)
      for (const month of months) {
          const days = await readDays(dirPath, year, month)
          for (const day of days) {
              const cur = await readFilePathsAt(dirPath, year, month, day)
              ret = ret.concat(cur)
              if (ret.length > count)
                  return ret
          }
      }
  }
  return ret
}

const para2html = (json) => {
  let encoded = encode(json.content.toString())
  let dtstr = json.date.getTime().toString()
  let permlink = json.permlink

  return `<div class="box" dt="${dtstr}">
            ${encoded}
            <div class="content is-small">${json.date} <a href="${permlink}">permlink</a></div>
          </div>`
}

const contents2html = (contents) => {
  return contents.map( p => para2html(p) ).join("\n")
}

const loadDirToHtml = async (dirPath) => {
  const paths = await readFilePaths(dirPath, g_ITEM_LIMIT)
  const limited = paths.length <= g_ITEM_LIMIT ? paths : paths.slice(0, g_ITEM_LIMIT)
  const contents = await Promise.all(
      limited
      .map( async pathtuple => {
          const basename = pathtuple.fname.substring(0, pathtuple.fname.length - 4)
          const date = new Date(parseInt(basename))
          const content = await fs.readFile(pathtuple.fullPath)
          let permPath = path.join(pathtuple.permDir, `${basename}.html`)

          return {fullPath: pathtuple.fullPath, date: date, permlink: permPath, content: content}
      })
  )

  const html = contents2html(contents)
  return `<div class="karino2-sidebar">
            <h2>てきすとTL</h2>
            ${html}
</div>`
}

(async function(){
  const res = await loadDirToHtml(g_TEXTTL_DIR)
  fs.writeFile(g_OUTPUT_PATH, res)
})()
