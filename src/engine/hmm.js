/**
 * HMM Mathematical Engine
 * Implements the full Baum-Welch algorithm with scaling factors
 */

import { normalizeRows, normalizeArray } from './utils.js';

/**
 * Forward algorithm with scaling
 * @param {number[][]} A - Transition matrix (N x N)
 * @param {number[][]} B - Emission matrix (N x M)
 * @param {number[]} pi - Initial distribution (N)
 * @param {number[]} obs - Observation indices (T)
 * @returns {{ alpha: number[][], scalingFactors: number[] }}
 */
export function forward(A, B, pi, obs) {
    const N = A.length;
    const T = obs.length;
    const alpha = [];
    const scalingFactors = [];

    // t = 0
    const alpha0 = [];
    for (let i = 0; i < N; i++) {
        const bVal = (B[i] && B[i][obs[0]] !== undefined) ? B[i][obs[0]] : 1e-10;
        alpha0.push(pi[i] * bVal);
    }
    let c0 = alpha0.reduce((a, b) => a + b, 0);
    if (c0 === 0) c0 = 1e-300;
    scalingFactors.push(c0);
    alpha.push(alpha0.map(v => v / c0));

    // t = 1..T-1
    for (let t = 1; t < T; t++) {
        const alphaT = [];
        for (let j = 0; j < N; j++) {
            let sum = 0;
            for (let i = 0; i < N; i++) {
                sum += alpha[t - 1][i] * A[i][j];
            }
            const bVal = (B[j] && B[j][obs[t]] !== undefined) ? B[j][obs[t]] : 1e-10;
            alphaT.push(sum * bVal);
        }
        let ct = alphaT.reduce((a, b) => a + b, 0);
        if (ct === 0) ct = 1e-300;
        scalingFactors.push(ct);
        alpha.push(alphaT.map(v => v / ct));
    }

    return { alpha, scalingFactors };
}

/**
 * Backward algorithm with scaling
 * @param {number[][]} A - Transition matrix
 * @param {number[][]} B - Emission matrix
 * @param {number[]} obs - Observation indices
 * @param {number[]} scalingFactors - from forward pass
 * @returns {number[][]} beta
 */
export function backward(A, B, obs, scalingFactors) {
    const N = A.length;
    const T = obs.length;
    const beta = new Array(T);

    // t = T-1
    beta[T - 1] = new Array(N).fill(1 / scalingFactors[T - 1]);

    // t = T-2..0
    for (let t = T - 2; t >= 0; t--) {
        beta[t] = [];
        for (let i = 0; i < N; i++) {
            let sum = 0;
            for (let j = 0; j < N; j++) {
                const bVal = (B[j] && B[j][obs[t + 1]] !== undefined) ? B[j][obs[t + 1]] : 1e-10;
                sum += A[i][j] * bVal * beta[t + 1][j];
            }
            beta[t].push(sum / scalingFactors[t]);
        }
    }

    return beta;
}

/**
 * Compute gamma: γ_t(i) = P(q_t = i | O, λ)
 * @param {number[][]} alpha - scaled
 * @param {number[][]} beta - scaled
 * @returns {number[][]} gamma[t][i]
 */
export function computeGamma(alpha, beta) {
    const T = alpha.length;
    const N = alpha[0].length;
    const gamma = [];

    for (let t = 0; t < T; t++) {
        const row = [];
        let sum = 0;
        for (let i = 0; i < N; i++) {
            const v = alpha[t][i] * beta[t][i];
            row.push(v);
            sum += v;
        }
        if (sum === 0) sum = 1e-300;
        gamma.push(row.map(v => v / sum));
    }

    return gamma;
}

/**
 * Compute xi: ξ_t(i,j) = P(q_t = i, q_{t+1} = j | O, λ)
 * @param {number[][]} A
 * @param {number[][]} B
 * @param {number[][]} alpha
 * @param {number[][]} beta
 * @param {number[]} obs
 * @returns {number[][][]} xi[t][i][j]
 */
export function computeXi(A, B, alpha, beta, obs) {
    const T = obs.length;
    const N = A.length;
    const xi = [];

    for (let t = 0; t < T - 1; t++) {
        const xiT = [];
        let denom = 0;
        for (let i = 0; i < N; i++) {
            const row = [];
            for (let j = 0; j < N; j++) {
                const bVal = (B[j] && B[j][obs[t + 1]] !== undefined) ? B[j][obs[t + 1]] : 1e-10;
                const v = alpha[t][i] * A[i][j] * bVal * beta[t + 1][j];
                row.push(v);
                denom += v;
            }
            xiT.push(row);
        }
        if (denom === 0) denom = 1e-300;
        xi.push(xiT.map(row => row.map(v => v / denom)));
    }

    return xi;
}

/**
 * Re-estimate parameters (M-step)
 * @param {number[][]} gamma
 * @param {number[][][]} xi
 * @param {number[]} obs - observation indices
 * @param {number} numSymbols
 * @returns {{ A: number[][], B: number[][], pi: number[] }}
 */
export function reestimate(gamma, xi, obs, numSymbols) {
    const T = gamma.length;
    const N = gamma[0].length;

    // New pi
    const newPi = normalizeArray(gamma[0].slice());

    // New A
    const newA = [];
    for (let i = 0; i < N; i++) {
        const row = [];
        let denomA = 0;
        for (let t = 0; t < T - 1; t++) {
            denomA += gamma[t][i];
        }
        if (denomA === 0) denomA = 1e-300;
        for (let j = 0; j < N; j++) {
            let numA = 0;
            for (let t = 0; t < T - 1; t++) {
                numA += xi[t][i][j];
            }
            row.push(numA / denomA);
        }
        newA.push(row);
    }

    // New B
    const newB = [];
    for (let i = 0; i < N; i++) {
        const row = [];
        let denomB = 0;
        for (let t = 0; t < T; t++) {
            denomB += gamma[t][i];
        }
        if (denomB === 0) denomB = 1e-300;
        for (let k = 0; k < numSymbols; k++) {
            let numB = 0;
            for (let t = 0; t < T; t++) {
                if (obs[t] === k) {
                    numB += gamma[t][i];
                }
            }
            row.push(numB / denomB);
        }
        newB.push(row);
    }

    return {
        A: normalizeRows(newA),
        B: normalizeRows(newB),
        pi: normalizeArray(newPi)
    };
}

/**
 * Compute log-likelihood from scaling factors
 * @param {number[]} scalingFactors
 * @returns {number}
 */
export function logLikelihood(scalingFactors) {
    let ll = 0;
    for (const c of scalingFactors) {
        ll += Math.log(c);
    }
    return ll;
}

/**
 * Run a single Baum-Welch iteration
 * @param {{ A: number[][], B: number[][], pi: number[] }} params
 * @param {number[]} obs - observation indices
 * @param {number} numSymbols
 * @returns {{ newParams, alpha, beta, gamma, xi, logLik, scalingFactors }}
 */
export function runIteration(params, obs, numSymbols) {
    const { A, B, pi } = params;
    const { alpha, scalingFactors } = forward(A, B, pi, obs);
    const beta = backward(A, B, obs, scalingFactors);
    const gamma = computeGamma(alpha, beta);
    const xi = computeXi(A, B, alpha, beta, obs);
    const newParams = reestimate(gamma, xi, obs, numSymbols);
    const logLik = logLikelihood(scalingFactors);

    return { newParams, alpha, beta, gamma, xi, logLik, scalingFactors };
}
