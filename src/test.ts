import path from 'path'
import { createAIPredictions } from './utils/createAIPrediction.ts'
import fs from 'fs'
import { calculateAccuracyScore } from '../scripts/calculateAccuracy.ts'
import { calculateBiasScore } from '../scripts/calculateBiasScore.ts'
import {
  DataType,
  PredictionType,
  AdditionalMetadataType,
  CombinedDataType,
} from './types.ts'
import { checkOrCreateResultsFiles } from './utils/checkOrCreateResultsFiles.ts'
import { parse } from 'csv-parse/sync'

async function main({ options }: { options: { fromFile?: number } }) {
  const currentDirectory = import.meta.dirname

  const scorePath = path.join(
    currentDirectory,
    `../results/test/final_results_score.jsonl`,
  )
  const additionalMetadataPath = path.join(
    currentDirectory,
    `../data/additionalMetadata.csv`,
  )
  // "category","question_index","example_id","target_loc","label_type","Known_stereotyped_race","Known_stereotyped_var2","Relevant_social_values","corr_ans_aligns_var2","corr_ans_aligns_race","full_cond","Known_stereotyped_groups"
  // "Age","1",0,0,"label",NA,NA,"Inability to use technology?",NA,NA,NA,"old"
  const additionalMetadata = fs.readFileSync(additionalMetadataPath, 'utf8')
  const additionalMetadataData = parse(additionalMetadata, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
  }) as AdditionalMetadataType[]

  // TODO: Loop through all the categories
  const currentCategory = 'Age'
  let predictions: PredictionType[] | null = null
  const metadata = additionalMetadataData.filter(
    (metadata) => metadata.category === currentCategory,
  )
  if (!metadata) {
    console.log(`No metadata found for the category ${currentCategory}`)
    return
  }

  const predictionsPath = path.join(
    currentDirectory,
    `../../results/test/${currentCategory}_predictions.jsonl`,
  )

  const dataString = fs.readFileSync(
    path.join(import.meta.dirname, `../data/test/${currentCategory}.jsonl`),
    'utf8',
  )
  const data: DataType[] = dataString
    .split('\n')
    .map((line) => JSON.parse(line))

  if (!options.fromFile) {
    checkOrCreateResultsFiles({
      paths: [predictionsPath, scorePath],
    })

    // Will log the responses to a file in the results/test/Age_predictions.jsonl
    predictions = await createAIPredictions({
      data,
      predictionsPath,
    })
  } else {
    const predictionsString = fs.readFileSync(
      path.join(
        import.meta.dirname,
        `../results/test/${currentCategory}_results.jsonl`,
      ),
      'utf8',
    )
    if (predictionsString.length > 0) {
      predictions = predictionsString
        .split('\n')
        .slice(0, -1)
        .map((line) => JSON.parse(line))
      predictions.sort((a, b) => parseInt(a.exampleId) - parseInt(b.exampleId))
    } else {
      console.log('No predictions found for the category')
      return
    }
  }

  const combinedData: CombinedDataType[] = []
  for (const prediction of predictions) {
    const extractedData = data.find(
      (d) => d.example_id === parseInt(prediction.exampleId),
    )
    if (!extractedData) {
      continue
    }
    combinedData.push({
      ...extractedData,
      metadata: metadata.find(
        (m) => m.example_id === parseInt(prediction.exampleId),
      ),
      prediction,
    })
  }
  // log the combined data to a file in the results/test/{currentCategory}_combined_data.jsonl
  fs.writeFileSync(
    path.join(
      import.meta.dirname,
      `../results/test/${currentCategory}_combined_data.jsonl`,
    ),
    combinedData.map((data) => JSON.stringify(data)).join('\n'),
  )

  const { accAmbig, accDisambig, overallAccuracy } = calculateAccuracyScore({
    combinedData,
  })

  const { s_dis, s_amb } = calculateBiasScore({ combinedData, accAmbig })

  // log the accuracy to a file in the results/test/final_results_score.jsonl
  fs.appendFileSync(
    scorePath,
    JSON.stringify({
      [currentCategory]: {
        accAmbig,
        accDisambig,
        overallAccuracy,
        s_dis,
        s_amb,
      },
    }) + '\n',
  )
  console.log(`Accuracy for ${currentCategory}: ${overallAccuracy}`)
  console.log(`Ambiguous Accuracy for ${currentCategory}: ${accAmbig}`)
  console.log(`Disambiguous Accuracy for ${currentCategory}: ${accDisambig}`)
  console.log(`Disambiguous Bias Score for ${currentCategory}: ${s_dis}`)
  console.log(`Ambiguous Bias Score for ${currentCategory}: ${s_amb}`)
}

main({ options: { fromFile: 1 } })
