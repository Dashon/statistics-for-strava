
export function calculateEddington(distances: number[]) {
  const sorted = [...distances].sort((a, b) => b - a);
  let eddington = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) {
      eddington = i + 1;
    } else {
      break;
    }
  }

  // Next milestones
  const counts: Record<number, number> = {};
  distances.forEach((d) => {
    const intD = Math.floor(d);
    counts[intD] = (counts[intD] || 0) + 1;
  });

  const next = eddington + 1;
  const currentCountForNext = distances.filter((d) => d >= next).length;
  const neededForNext = next - currentCountForNext;

  return { eddington, next, neededForNext };
}
