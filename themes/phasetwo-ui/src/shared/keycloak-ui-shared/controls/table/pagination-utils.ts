export function getPaginationPage(first: number, max: number) {
  return Math.floor(first / max) + 1;
}

export function getPaginationFirstOnPerPageSelect(
  newPerPage: number,
  newPage: number,
  startIdx?: number,
) {
  return startIdx ?? Math.max(newPage - 1, 0) * newPerPage;
}

export function getPaginatedItemCount(
  first: number,
  max: number,
  loadedRowCount: number,
) {
  return loadedRowCount > max ? undefined : first + loadedRowCount;
}
