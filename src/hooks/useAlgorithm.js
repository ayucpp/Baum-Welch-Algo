import { useState, useCallback, useRef, useEffect } from 'react';
import { forward, backward, computeGamma, computeXi, reestimate, logLikelihood } from '../engine/hmm.js';

/**
 * Algorithm step types
 */
export const STEP_TYPES = {
    IDLE: 'IDLE',
    INIT: 'INIT',
    FORWARD: 'FORWARD',
    BACKWARD: 'BACKWARD',
    GAMMA: 'GAMMA',
    XI: 'XI',
    M_STEP: 'M_STEP',
    LIKELIHOOD: 'LIKELIHOOD',
    CONVERGE_CHECK: 'CONVERGE_CHECK',
    CONVERGED: 'CONVERGED',
};

/**
 * Step sequencer hook for the Baum-Welch algorithm
 */
export function useAlgorithm(hmmState) {
    const [currentStep, setCurrentStep] = useState({ type: STEP_TYPES.IDLE, data: null });
    const [stepHistory, setStepHistory] = useState([]);
    const [stepIndex, setStepIndex] = useState(-1);
    const [iteration, setIteration] = useState(0);
    const [logLikelihoods, setLogLikelihoods] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const playIntervalRef = useRef(null);

    // Algorithm results cache
    const [alphaResult, setAlphaResult] = useState(null);
    const [betaResult, setBetaResult] = useState(null);
    const [gammaResult, setGammaResult] = useState(null);
    const [xiResult, setXiResult] = useState(null);
    const [scalingResult, setScalingResult] = useState(null);

    // Convergence results (for popup)
    const [convergenceData, setConvergenceData] = useState(null);

    const convergenceThreshold = 1e-6;

    // Build all steps for one iteration
    const buildIterationSteps = useCallback((params, obsIndices, numSymbols, iterNum) => {
        const steps = [];

        if (iterNum === 0) {
            steps.push({ type: STEP_TYPES.INIT, data: { A: params.A, B: params.B, pi: params.pi } });
        }

        const { alpha, scalingFactors } = forward(params.A, params.B, params.pi, obsIndices);
        for (let t = 0; t < obsIndices.length; t++) {
            steps.push({
                type: STEP_TYPES.FORWARD,
                data: { t, alpha, scalingFactors, alphaT: alpha[t] }
            });
        }

        const beta = backward(params.A, params.B, obsIndices, scalingFactors);
        for (let t = obsIndices.length - 1; t >= 0; t--) {
            steps.push({
                type: STEP_TYPES.BACKWARD,
                data: { t, beta, betaT: beta[t] }
            });
        }

        const gamma = computeGamma(alpha, beta);
        steps.push({
            type: STEP_TYPES.GAMMA,
            data: { gamma, alpha, beta }
        });

        const xi = computeXi(params.A, params.B, alpha, beta, obsIndices);
        steps.push({
            type: STEP_TYPES.XI,
            data: { xi }
        });

        const newParams = reestimate(gamma, xi, obsIndices, numSymbols);
        steps.push({
            type: STEP_TYPES.M_STEP,
            data: { oldParams: params, newParams }
        });

        const logLik = logLikelihood(scalingFactors);
        steps.push({
            type: STEP_TYPES.LIKELIHOOD,
            data: { logLik, iteration: iterNum }
        });

        steps.push({
            type: STEP_TYPES.CONVERGE_CHECK,
            data: { logLik, newParams, iteration: iterNum }
        });

        return {
            steps,
            computedData: { alpha, beta, gamma, xi, scalingFactors, newParams, logLik }
        };
    }, []);

    // Initialize and start algorithm
    const startAlgorithm = useCallback(() => {
        const obsIndices = hmmState.getObsIndices();
        if (obsIndices.length === 0 || hmmState.hiddenStates.length === 0) return;

        const N = hmmState.hiddenStates.length;
        const M = hmmState.symbols.length;

        let B = hmmState.emissionMatrix;
        if (!B || B.length !== N || (B[0] && B[0].length !== M)) {
            B = [];
            for (let i = 0; i < N; i++) {
                const row = [];
                for (let j = 0; j < M; j++) row.push(Math.random() + 0.1);
                const sum = row.reduce((a, b) => a + b, 0);
                B.push(row.map(v => v / sum));
            }
            hmmState.setEmissionMatrix(B);
        }

        let currentParams = {
            A: hmmState.transitionMatrix,
            B: B,
            pi: hmmState.initialDist,
        };

        const maxIter = hmmState.maxIterations || 100;
        let allSteps = [];
        let lls = [];
        let convergedOnce = false;
        let finalLogLik = 0;
        let finalIter = 0;

        for (let iterNum = 0; iterNum < maxIter; iterNum++) {
            const { steps, computedData } = buildIterationSteps(currentParams, obsIndices, M, iterNum);

            // Filter out the CONVERGE_CHECK step from being pushed directly yet, we will process it
            const nonCheckSteps = steps.filter(s => s.type !== STEP_TYPES.CONVERGE_CHECK);
            allSteps.push(...nonCheckSteps);

            const { logLik, newParams } = computedData;
            lls.push(logLik);
            finalLogLik = logLik;
            finalIter = iterNum + 1;

            if (lls.length >= 2) {
                const diff = Math.abs(lls[lls.length - 1] - lls[lls.length - 2]);
                if (diff < convergenceThreshold || iterNum === maxIter - 1) {
                    convergedOnce = diff < convergenceThreshold;
                    allSteps.push({
                        type: STEP_TYPES.CONVERGED,
                        data: { iteration: iterNum + 1, logLik, converged: convergedOnce, newParams }
                    });
                    break;
                }
            }

            currentParams = newParams;
        }

        setStepHistory(allSteps);
        setStepIndex(0);
        setCurrentStep(allSteps[0]);
        setIteration(0);
        setLogLikelihoods([]);
        setConvergenceData(null);
        hmmState.setAlgorithmMode(true);
    }, [hmmState, buildIterationSteps, convergenceThreshold]);

    // Step forward (just advances the precomputed array)
    const stepForward = useCallback(() => {
        setStepIndex(prev => {
            const next = prev + 1;
            if (next < stepHistory.length) {
                const step = stepHistory[next];
                setCurrentStep(step);

                if (step.type === STEP_TYPES.M_STEP) {
                    hmmState.setParams(step.data.newParams);
                }

                if (step.type === STEP_TYPES.LIKELIHOOD) {
                    setLogLikelihoods(prevLls => [...prevLls, step.data.logLik]);
                    setIteration(step.data.iteration + 1);
                }

                if (step.type === STEP_TYPES.CONVERGED) {
                    const { logLik, newParams, iteration: finalI, converged } = step.data;
                    setConvergenceData({
                        totalIterations: finalI,
                        finalLogLik: logLik,
                        converged,
                        transitionMatrix: newParams.A,
                        emissionMatrix: newParams.B,
                        logLikelihoods: [...logLikelihoods, logLik],
                    });
                    hmmState.setHasConvergedOnce(true);
                    hmmState.setShowResultsPopup(true);
                }

                return next;
            }
            return prev;
        });
    }, [stepHistory, hmmState, logLikelihoods]);

    // Step backward
    const stepBack = useCallback(() => {
        setStepIndex(prev => {
            const next = Math.max(0, prev - 1);
            if (next < stepHistory.length) {
                setCurrentStep(stepHistory[next]);
            }
            return next;
        });
    }, [stepHistory]);

    // Rewind to start
    const rewind = useCallback(() => {
        if (stepHistory.length > 0) {
            setStepIndex(0);
            setCurrentStep(stepHistory[0]);
        }
    }, [stepHistory]);

    // Fast forward (jump ahead 5 steps)
    const fastForward = useCallback(() => {
        for (let i = 0; i < 5; i++) {
            stepForward();
        }
    }, [stepForward]);

    // Auto-play with variable speed
    const togglePlay = useCallback(() => {
        if (isPlaying) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
        } else {
            const speed = hmmState.playbackSpeed || 1;
            const delay = Math.round(800 / speed);
            setIsPlaying(true);

            // Snap back to layout if distorted while paused
            if (typeof hmmState.realignNodes === 'function') {
                hmmState.realignNodes();
            }

            playIntervalRef.current = setInterval(() => {
                setStepIndex(prev => {
                    const next = prev + 1;
                    if (next >= stepHistory.length) {
                        clearInterval(playIntervalRef.current);
                        setIsPlaying(false);
                        return prev;
                    }
                    const step = stepHistory[next];
                    setCurrentStep(step);

                    if (step.type === STEP_TYPES.M_STEP) {
                        hmmState.setParams(step.data.newParams);
                    }
                    if (step.type === STEP_TYPES.LIKELIHOOD) {
                        setLogLikelihoods(p => [...p, step.data.logLik]);
                        setIteration(step.data.iteration + 1);
                    }

                    // Stop at convergence
                    if (step.type === STEP_TYPES.CONVERGED) {
                        clearInterval(playIntervalRef.current);
                        setIsPlaying(false);

                        const { logLik, newParams, iteration: finalI, converged } = step.data;
                        setConvergenceData({
                            totalIterations: finalI,
                            finalLogLik: logLik,
                            converged,
                            transitionMatrix: newParams.A,
                            emissionMatrix: newParams.B,
                            logLikelihoods: [...logLikelihoods, logLik],
                        });
                        hmmState.setHasConvergedOnce(true);
                        hmmState.setShowResultsPopup(true);
                    }

                    return next;
                });
            }, delay);
        }
    }, [isPlaying, stepHistory, hmmState, logLikelihoods]);

    // Update play speed if speed changes mid-play
    useEffect(() => {
        if (isPlaying) {
            clearInterval(playIntervalRef.current);
            const speed = hmmState.playbackSpeed || 1;
            const delay = Math.round(800 / speed);
            playIntervalRef.current = setInterval(() => {
                setStepIndex(prev => {
                    const next = prev + 1;
                    if (next >= stepHistory.length) {
                        clearInterval(playIntervalRef.current);
                        setIsPlaying(false);
                        return prev;
                    }
                    const step = stepHistory[next];
                    setCurrentStep(step);
                    if (step.type === STEP_TYPES.M_STEP) {
                        hmmState.setParams(step.data.newParams);
                    }
                    if (step.type === STEP_TYPES.LIKELIHOOD) {
                        setLogLikelihoods(p => [...p, step.data.logLik]);
                        setIteration(step.data.iteration + 1);
                    }
                    if (step.type === STEP_TYPES.CONVERGED) {
                        clearInterval(playIntervalRef.current);
                        setIsPlaying(false);

                        const { logLik, newParams, iteration: finalI, converged } = step.data;
                        setConvergenceData({
                            totalIterations: finalI,
                            finalLogLik: logLik,
                            converged,
                            transitionMatrix: newParams.A,
                            emissionMatrix: newParams.B,
                            logLikelihoods: [...logLikelihoods, logLik],
                        });
                        hmmState.setHasConvergedOnce(true);
                        hmmState.setShowResultsPopup(true);
                    }
                    return next;
                });
            }, delay);
        }
        return () => clearInterval(playIntervalRef.current);
    }, [hmmState.playbackSpeed, isPlaying, stepHistory, hmmState, logLikelihoods]);

    // Reset
    const resetAlgorithm = useCallback(() => {
        clearInterval(playIntervalRef.current);
        setIsPlaying(false);
        setCurrentStep({ type: STEP_TYPES.IDLE, data: null });
        setStepHistory([]);
        setStepIndex(-1);
        setIteration(0);
        setLogLikelihoods([]);
        setAlphaResult(null);
        setBetaResult(null);
        setGammaResult(null);
        setXiResult(null);
        setScalingResult(null);
        setConvergenceData(null);
        hmmState.setAlgorithmMode(false);
    }, [hmmState]);

    return {
        currentStep,
        stepIndex,
        stepHistory,
        iteration,
        logLikelihoods,
        isPlaying,
        alphaResult,
        betaResult,
        gammaResult,
        xiResult,
        convergenceData,
        startAlgorithm,
        stepForward,
        stepBack,
        rewind,
        fastForward,
        togglePlay,
        resetAlgorithm,
    };
}
