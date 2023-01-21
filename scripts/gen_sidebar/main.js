// copy from texttl-electron

const path = require('path')
const fs = require('fs/promises')
const {encode} = require('html-entities')

const g_TEXTTL_DIR = "../../TextTL"
const g_OUTPUT_PATH = "../../_includes/mysidebar.html"

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
  return files
      .filter( fname => fname.match(/^[0-9]+\.txt$/) )
      .sort( (a, b) => a < b ? 1 : -1)
      .map(fname => { return {fullPath: path.join(targetPath, fname), fname: fname} })
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
  let encoded = encode(json.content)
  let dtstr = json.date.getTime().toString()

  return `<div class="box" dt="${dtstr}">
            ${encoded}
            <div class="content is-small">${json.date}</div>
          </div>`
}

const contents2html = (contents) => {
  return contents.map( p => para2html(p) ).join("\n")
}

const loadDirToHtml = async (dirPath) => {
  const paths = await readFilePaths(dirPath, g_ITEM_LIMIT)
  const limited = paths.length <= g_ITEM_LIMIT ? paths : paths.slice(0, g_ITEM_LIMIT)
  limited.reverse()
  const contents = await Promise.all(
      limited
      .map( async pathpair => {
          const date = new Date(parseInt(pathpair.fname.substring(0, pathpair.fname.length - 4)))
          const content = await fs.readFile(pathpair.fullPath)
          return {fullPath: pathpair.fullPath, date: date, content: content}
      })
  )

  const html = contents2html(contents)
  return `<div class="karino2-sidebar">
            ${html}
</div>`
}

(async function(){
  const res = await loadDirToHtml(g_TEXTTL_DIR)
  fs.writeFile(g_OUTPUT_PATH, res)
})()
