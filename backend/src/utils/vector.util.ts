export const cosineSimilarity = (left: number[] | undefined, right: number[] | undefined): number | null => {
  if (!left?.length || !right?.length || left.length !== right.length) return null;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];
    if (leftValue === undefined || rightValue === undefined || !Number.isFinite(leftValue) || !Number.isFinite(rightValue)) return null;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) return null;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

export const similarityScore = (left: number[] | undefined, right: number[] | undefined): number => {
  const similarity = cosineSimilarity(left, right);
  if (similarity === null) return 0;
  return Math.max(0, Math.min(100, Math.round(((similarity + 1) / 2) * 100)));
};