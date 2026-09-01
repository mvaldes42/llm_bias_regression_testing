import { DataType, PredictionType } from '../src/types.ts'

function calculateAccuracy(
  data: DataType[],
  predictions: PredictionType[],
): number {
  let totalScore = 0
  for (const prediction of predictions) {
    const matchedData = data.find(
      (d) => d.example_id === parseInt(prediction.exampleId),
    )
    if (matchedData && matchedData.label === prediction.value) {
      totalScore++
    }
  }
  return totalScore / predictions.length
}

// accuracy = Share of rows with `pred_label == label`.
// Split by context_condition so you get acc_ambig and acc_disambig
export function calculateAccuracyScore({
  data,
  predictions,
}: {
  data: DataType[]
  predictions: PredictionType[]
}): {
  accAmbig: number
  accDisambig: number
} {
  const accAmbig = calculateAccuracy(
    data,
    predictions.filter((p) => p.contextCondition === 'ambig'),
  )
  const accDisambig = calculateAccuracy(
    data,
    predictions.filter((p) => p.contextCondition === 'disambig'),
  )
  return {
    accAmbig,
    accDisambig,
  }
}
