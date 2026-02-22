import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { explanations } from './explanations.js';
import { STEP_TYPES } from '../../hooks/useAlgorithm.js';

/**
 * Jerome mascot — floating character with contextual speech bubbles
 */
export default function Jerome({ currentStep, enabled }) {
    const [collapsed, setCollapsed] = useState(false);

    if (!enabled) return null;

    // Map step type to explanation
    const getExplanation = () => {
        const stepType = currentStep.type;
        if (stepType === STEP_TYPES.IDLE) return null;
        if (stepType === STEP_TYPES.FORWARD) return explanations.FORWARD;
        if (stepType === STEP_TYPES.BACKWARD) return explanations.BACKWARD;
        return explanations[stepType] || null;
    };

    const explanation = getExplanation();

    return (
        <AnimatePresence>
            <motion.div
                className="jerome-container"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
                {/* Collapse controls */}
                <div className="jerome-controls">
                    <button
                        className="toolbar-btn"
                        style={{ padding: '4px', width: '28px', height: '28px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {collapsed ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
                        </svg>
                    </button>
                </div>

                {/* Jerome character */}
                <motion.div
                    className="jerome-character"
                    animate={{
                        y: [0, -5, 0],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: 'easeInOut'
                    }}
                >
                    <div className="jerome-avatar">🧑‍🏫</div>
                    <div className="jerome-name">Jerome</div>
                </motion.div>

                {/* Speech bubble */}
                <AnimatePresence mode="wait">
                    {!collapsed && explanation && (
                        <motion.div
                            key={currentStep.type}
                            className="jerome-speech"
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h4 className="speech-title">{explanation.title}</h4>
                            <div className="speech-text">
                                {explanation.text.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Idle message */}
                {!collapsed && !explanation && currentStep.type === STEP_TYPES.IDLE && (
                    <motion.div
                        className="jerome-speech"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p className="speech-text">
                            👋 Hi! I'm Jerome. Click <strong>Start Baum-Welch</strong> and I'll guide you through each step!
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
