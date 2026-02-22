/**
 * HMM Utility Functions
 * Normalization and random initialization helpers
 */

/**
 * Normalize a 1D array so values sum to 1
 */
export function normalizeArray(arr) {
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum === 0) return arr.map(() => 1 / arr.length);
  return arr.map(v => v / sum);
}

/**
 * Normalize each row of a 2D matrix so rows sum to 1
 */
export function normalizeRows(matrix) {
  return matrix.map(row => normalizeArray(row));
}

/**
 * Generate a random row-stochastic matrix (rows, cols)
 */
export function randomStochastic(rows, cols) {
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(Math.random() + 0.1);
    }
    matrix.push(normalizeArray(row));
  }
  return matrix;
}

/**
 * Generate a random initial distribution vector of length n
 */
export function randomPi(n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push(Math.random() + 0.1);
  }
  return normalizeArray(arr);
}

/**
 * Deep clone a 2D matrix
 */
export function cloneMatrix(m) {
  return m.map(row => [...row]);
}

/**
 * Deep clone a 1D array
 */
export function cloneArray(a) {
  return [...a];
}
