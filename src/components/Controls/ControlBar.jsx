import React from 'react';
import { motion } from 'framer-motion';
import { STEP_TYPES } from '../../hooks/useAlgorithm.js';

/**
 * Bottom control bar with playback controls
 */
export default function ControlBar({ algorithmState, hmmState, onStart, onReset }) {
    const {
        currentStep, stepIndex, stepHistory, iteration, isPlaying,
        stepForward, stepBack, rewind, fastForward, togglePlay,
    } = algorithmState;

    const isIdle = currentStep.type === STEP_TYPES.IDLE;
    const isConverged = currentStep.type === STEP_TYPES.CONVERGED;
    const totalSteps = stepHistory.length;
    const showTotal = hmmState?.hasConvergedOnce;

    return (
        <div className="control-bar">
            {/* Step info */}
            <div className="control-info">
                <span className="step-counter">
                    {isIdle ? 'Ready' : (showTotal ? `Step ${stepIndex + 1} / ${totalSteps}` : `Step ${stepIndex + 1}`)}
                </span>
                {!isIdle && (
                    <span className="step-label">
                        {getShortLabel(currentStep)}
                    </span>
                )}
            </div>

            {/* Controls */}
            <div className="control-buttons">
                {isIdle ? (
                    <motion.button
                        className="btn btn-play btn-start"
                        onClick={onStart}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="btn-inner">▶ Start Baum-Welch</span>
                    </motion.button>
                ) : (
                    <>
                        <motion.button
                            className="btn btn-control"
                            onClick={rewind}
                            disabled={isConverged}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Rewind to start"
                        >
                            ⏮
                        </motion.button>

                        <motion.button
                            className="btn btn-control"
                            onClick={stepBack}
                            disabled={stepIndex <= 0}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Step Back"
                        >
                            ◀
                        </motion.button>

                        <motion.button
                            className="btn btn-play"
                            onClick={togglePlay}
                            disabled={isConverged}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isPlaying ? '⏸' : '▶'}
                        </motion.button>

                        <motion.button
                            className="btn btn-control"
                            onClick={stepForward}
                            disabled={isConverged}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Step Forward"
                        >
                            ▶
                        </motion.button>

                        <motion.button
                            className="btn btn-control"
                            onClick={fastForward}
                            disabled={isConverged}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Fast Forward (5 steps)"
                        >
                            ⏭
                        </motion.button>

                        <motion.button
                            className="btn btn-reset"
                            onClick={onReset}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Reset"
                        >
                            ↺ Reset
                        </motion.button>
                    </>
                )}
            </div>
        </div>
    );
}

function getShortLabel(step) {
    switch (step.type) {
        case STEP_TYPES.INIT: return 'Initialization';
        case STEP_TYPES.FORWARD: return `Forward Pass (t=${step.data?.t})`;
        case STEP_TYPES.BACKWARD: return `Backward Pass (t=${step.data?.t})`;
        case STEP_TYPES.GAMMA: return 'Gamma (γ)';
        case STEP_TYPES.XI: return 'Xi (ξ)';
        case STEP_TYPES.M_STEP: return 'M-Step Update';
        case STEP_TYPES.LIKELIHOOD: return 'Log-Likelihood';
        case STEP_TYPES.CONVERGE_CHECK: return 'Convergence Check';
        case STEP_TYPES.CONVERGED: return '✅ Converged!';
        default: return '';
    }
}
