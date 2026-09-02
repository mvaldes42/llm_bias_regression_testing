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
  CATEGORIES,
  FinalScoreType,
} from './types.ts'
import { checkOrCreateResultsFiles } from './utils/checkOrCreateResultsFiles.ts'
import { parse } from 'csv-parse/sync'
import { generalPaths, getCategoryPaths } from './utils/getPaths.ts'

async function main({ options }: { options: { fromFile?: number } }) {
  const currentDirectory = import.meta.dirname
  const finalScores: Record<string, FinalScoreType> = {}
  const { finalScorePath, additionalMetadataPath } =
    generalPaths(currentDirectory)

  // "category","question_index","example_id","target_loc","label_type","Known_stereotyped_race","Known_stereotyped_var2","Relevant_social_values","corr_ans_aligns_var2","corr_ans_aligns_race","full_cond","Known_stereotyped_groups"
  const additionalMetadata = fs.readFileSync(additionalMetadataPath, 'utf8')
  const additionalMetadataData = parse(additionalMetadata, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
  }) as AdditionalMetadataType[]

  for (const currentCategory of CATEGORIES) {
    const { currentCategoryDataPath, combinedDataPath, predictionsPath } =
      getCategoryPaths({
        category: currentCategory,
        directory: currentDirectory,
      })

    const metadata = additionalMetadataData.filter(
      (metadata) => metadata.category === currentCategory,
    )
    if (!metadata) {
      console.log(`No metadata found for the category ${currentCategory}`)
      continue
    }

    //// Create predictions with AI ////

    let predictions: PredictionType[] = []

    const dataString = fs.readFileSync(currentCategoryDataPath, 'utf8')
    const data: DataType[] = dataString
      .split('\n')
      .map((line) => JSON.parse(line))

    if (!options.fromFile) {
      checkOrCreateResultsFiles({
        paths: [predictionsPath, finalScorePath],
      })

      predictions = await createAIPredictions({
        data,
        predictionsPath,
      })

      console.log(`Predictions of ${currentCategory} created.`)
    } else {
      const predictionsString = fs.readFileSync(
        path.join(
          import.meta.dirname,
          `../results/test/${currentCategory}_predictions.jsonl`,
        ),
        'utf8',
      )
      if (predictionsString.length > 0) {
        predictions = predictionsString
          .split('\n')
          .slice(0, -1)
          .map((line) => JSON.parse(line))
        predictions.sort(
          (a, b) => parseInt(a.exampleId) - parseInt(b.exampleId),
        )
      } else {
        console.log('No predictions found for the category')
        continue
      }

      console.log(`Predictions of ${currentCategory} loaded from file.`)
    }

    //// Combine metadata and predictions ////

    let combinedData: CombinedDataType[] = []

    if (!options.fromFile) {
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

      fs.writeFileSync(
        path.join(
          import.meta.dirname,
          `../results/test/${currentCategory}_combined_data.jsonl`,
        ),
        combinedData.map((data) => JSON.stringify(data)).join('\n'),
      )

      console.log(`Combined data of ${currentCategory} created.`)
    } else {
      const combinedDataString = fs.readFileSync(combinedDataPath, 'utf8')
      combinedData = combinedDataString
        .split('\n')
        .map((line) => JSON.parse(line))

      console.log(`Combined data of ${currentCategory} loaded from file.`)
    }

    //// Score calculations ////

    const { accAmbig, accDisambig, accTotal } = calculateAccuracyScore({
      combinedData,
    })
    const { scoreDisambig, scoreAmbig } = calculateBiasScore({
      combinedData,
      accAmbig,
    })
    const currentScore: FinalScoreType = {
      accAmbig,
      accDisambig,
      accTotal,
      scoreDisambig,
      scoreAmbig,
    }

    console.log(currentScore)
    finalScores[currentCategory] = currentScore
  }

  // log all the final scores
  fs.writeFileSync(finalScorePath, JSON.stringify(finalScores, null, 2))

  console.log('End of testing')
}

main({ options: { fromFile: 1 } })
