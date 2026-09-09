import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { calculateAccuracyScore } from '../scripts/calculateAccuracy.ts'
import { calculateBiasScore } from '../scripts/calculateBiasScore.ts'
import {
  AdditionalMetadataType,
  CATEGORIES,
  CategoryScoreType,
  CombinedDataType,
  DataType,
  FinalScoreType,
  ModeType,
  PredictionType,
  PromptBiasType,
} from './types.ts'
import { checkOrCreateResultsFiles } from './utils/checkOrCreateResultsFiles.ts'
import { createAIPredictions } from './utils/createAIPrediction.ts'
import { delAIObjects } from './utils/delAIObjects.ts'
import { getAIInputs } from './utils/getAIInputs.ts'
import { generalPaths, getCategoryPaths } from './utils/getPaths.ts'

function scoreCombinedData({
  combinedData,
}: {
  combinedData: CombinedDataType[]
}): FinalScoreType | null {
  if (combinedData.length === 0) {
    console.error('No combined data to score')
    return null
  }
  const { accAmbig, accDisambig, accTotal } = calculateAccuracyScore({
    combinedData,
  })
  const { scoreDisambig, scoreAmbig } = calculateBiasScore({
    combinedData,
    accAmbig,
  })
  return {
    accAmbig,
    accDisambig,
    accTotal,
    scoreDisambig,
    scoreAmbig,
    nScored: combinedData.length,
  }
}

export async function testingScript({
  fromFile,
  mode,
  promptBias,
}: {
  fromFile?: boolean
  mode: ModeType
  promptBias: PromptBiasType
}) {
  const currentDirectory = import.meta.dirname
  const finalScores: Record<string, CategoryScoreType> = {}
  const outputDir =
    mode === 'real' ? `talentlens_${promptBias}` : `test_${promptBias}`
  let vectorStoreId: string | null = null
  let filesIds: string[] = []

  try {
    const {
      instructions,
      vectorStoreId: vectorStoreIdTemp,
      filesIds: filesIdsTemp,
    } = await getAIInputs({
      mode,
      promptBias,
    })
    vectorStoreId = vectorStoreIdTemp
    filesIds = filesIdsTemp

    process.once('SIGINT', async () => {
      process.on('SIGINT', () => {})
      await delAIObjects({ vectorStoreId, filesIds })
      console.log(
        'Control + C signal received, deleting AI objects and exiting...',
      )
      process.exit(130)
    })

    const { finalScorePath, additionalMetadataPath } = generalPaths({
      directory: currentDirectory,
      outputDir,
    })

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
          outputDir,
          mode,
        })

      const metadata = additionalMetadataData.filter(
        (metadata) => metadata.category === currentCategory,
      )
      if (!metadata) {
        console.error(`No metadata found for the category ${currentCategory}`)
        continue
      }

      //// Create predictions with AI ////

      let predictions: PredictionType[] = []

      const dataString = fs.readFileSync(currentCategoryDataPath, 'utf8')
      const data: DataType[] = dataString
        .split('\n')
        .map((line) => JSON.parse(line))

      if (!fromFile) {
        checkOrCreateResultsFiles({
          paths: [predictionsPath, finalScorePath],
        })

        predictions = await createAIPredictions({
          data,
          predictionsPath,
          instructions,
          vectorStoreId,
          mode,
        })

        console.log(`Predictions of ${currentCategory} created.`)
      } else {
        const predictionsString = fs.readFileSync(
          path.join(
            import.meta.dirname,
            `../results/${outputDir}/${currentCategory}_predictions.jsonl`,
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
          console.error('No predictions found for the category')
          continue
        }

        console.log(`Predictions of ${currentCategory} loaded from file.`)
      }

      //// Combine metadata and predictions ////

      let combinedData: CombinedDataType[] = []

      if (!fromFile) {
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
            `../results/${outputDir}/${currentCategory}_combined_data.jsonl`,
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

      const ragData = combinedData.filter((d) => d.prediction?.measuresRag)
      const withoutRagData = combinedData.filter(
        (d) => !d.prediction?.measuresRag,
      )
      const currentScore: CategoryScoreType = {
        all: scoreCombinedData({ combinedData }),
        rag: scoreCombinedData({ combinedData: ragData }),
        withoutRag: scoreCombinedData({ combinedData: withoutRagData }),
      }

      console.log(
        `${currentCategory}: all=${combinedData.length} rag=${ragData.length} withoutRag=${withoutRagData.length}`,
      )

      console.log('currentScore: ', currentScore)
      finalScores[currentCategory] = currentScore
    }

    // log all the final scores
    fs.writeFileSync(finalScorePath, JSON.stringify(finalScores, null, 2))
    await delAIObjects({ vectorStoreId, filesIds })
    console.log('End of testing')
  } catch (error) {
    await delAIObjects({ vectorStoreId, filesIds })
    console.error('Error: ', error)
    process.exit(1)
  }
}
