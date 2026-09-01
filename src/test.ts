import path from 'path'
import { createAIPredictions } from './utils/createAIPrediction.ts'
import fs from 'fs'
import { calculateAccuracyScore } from '../scripts/calculateAccuracy.ts'
import { DataType } from './types.ts'
import { checkOrCreateResultsFiles } from './utils/checkOrCreateResultsFiles.ts'

async function main() {
  // TODO: Loop through all the categories
  const currentCategory = 'Age'
  const { resultsPath, scorePath } = checkOrCreateResultsFiles({
    category: currentCategory,
  })

  const ageDataString = fs.readFileSync(
    path.join(import.meta.dirname, `../data/test/${currentCategory}.jsonl`),
    'utf8',
  )

  const ageData: DataType[] = ageDataString
    .split('\n')
    .map((line) => JSON.parse(line))

  // Will log the responses to a file in the results/test/Age_results.jsonl
  const predictions = await createAIPredictions({
    data: ageData,
    resultsPath,
  })
  const { accAmbig, accDisambig } = calculateAccuracyScore({
    data: ageData,
    predictions,
  })

  //log the accuracy to a file in the results/test/final_results_score.jsonl
  fs.appendFileSync(
    scorePath,
    JSON.stringify({
      [currentCategory]: {
        accAmbig,
        accDisambig,
        overallAccuracy: (accAmbig + accDisambig) / 2,
      },
    }) + '\n',
  )
}

main()
