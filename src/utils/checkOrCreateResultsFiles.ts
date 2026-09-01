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

export function checkOrCreateResultsFiles({ category }: { category: string }) {
  const currentDirectory = import.meta.dirname

  const resultsPath = path.join(
    currentDirectory,
    `../../results/test/${category}_results.jsonl`,
  )
  const scorePath = path.join(
    currentDirectory,
    `../../results/test/final_results_score.jsonl`,
  )
  checkOrCreateFile({ filePath: resultsPath })
  checkOrCreateFile({ filePath: scorePath })
  return { resultsPath, scorePath }
}
