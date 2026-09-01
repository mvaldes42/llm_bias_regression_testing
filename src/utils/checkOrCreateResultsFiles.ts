import path from 'path'
import fs from 'fs'

function checkOrCreateFile({ filePath }: { filePath: string }) {
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist, creating it...`)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, '')
  } else {
    console.log(`File ${filePath} already exists, overwriting it...`)
    fs.writeFileSync(filePath, '')
  }
}

export function checkOrCreateResultsFiles({ paths }: { paths: string[] }) {
  paths.forEach((path) => {
    checkOrCreateFile({ filePath: path })
  })
}
