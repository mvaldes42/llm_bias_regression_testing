import { CombinedDataType } from '../src/types.ts'

function calculateAccuracy(combinedData: CombinedDataType[]): number {
  let totalScore = 0
  for (const data of combinedData) {
    if (data.prediction && data.prediction.value === data.label) {
      totalScore++
    }
  }
  return totalScore / combinedData.length
}

// accuracy = Share of rows with `pred_label == label`.
// Split by context_condition so you get acc_ambig and acc_disambig
export function calculateAccuracyScore({
  combinedData,
}: {
  combinedData: CombinedDataType[]
}): {
  accAmbig: number
  accDisambig: number
  overallAccuracy: number
} {
  const accAmbig = calculateAccuracy(
    combinedData.filter((d) => d.context_condition === 'ambig'),
  )
  const accDisambig = calculateAccuracy(
    combinedData.filter((d) => d.context_condition === 'disambig'),
  )
  const overallAccuracy = (accAmbig + accDisambig) / 2
  return {
    accAmbig,
    accDisambig,
    overallAccuracy,
  }
}
