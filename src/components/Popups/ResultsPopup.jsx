import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ResultsPopup — glassmorphic modal showing convergence results
 * Appears after first convergence; re-openable via ℹ️ button
 */
export default function ResultsPopup({ convergenceData, onClose, hmmState }) {
    if (!convergenceData) return null;

    const {
        totalIterations,
        finalLogLik,
        converged,
        transitionMatrix,
        emissionMatrix,
        logLikelihoods,
    } = convergenceData;

    const hiddenLabels = hmmState.hiddenStates.map(s => s.label);
    const symLabels = hmmState.symbols;

    // Compute P(O|λ) from log-likelihoods
    const pValues = logLikelihoods.map(ll => Math.exp(ll));
    const oneMinusP = pValues.map(p => 1 - Math.min(p, 1));

    // Mini chart renderer
    const renderMiniChart = (data, label, color) => {
        if (data.length < 2) return null;
        const filtered = data.filter(v => isFinite(v) && !isNaN(v));
        if (filtered.length < 2) return null;

        const w = 340;
        const h = 130;
        const pad = 35;
        const min = Math.min(...filtered);
        const max = Math.max(...filtered);
        const range = max - min || 1;

        const points = filtered.map((val, i) => {
            const x = pad + (i / (filtered.length - 1)) * (w - 2 * pad);
            const y = h - pad - ((val - min) / range) * (h - 2 * pad);
            return `${x},${y}`;
        }).join(' ');

        const areaPoints = `${pad},${h - pad} ${points} ${pad + ((filtered.length - 1) / (filtered.length - 1)) * (w - 2 * pad)},${h - pad}`;
        const safeId = `grad-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

        return (
            <div className="popup-chart">
                <h4>{label}</h4>
                <svg width={w} height={h}>
                    <defs>
                        <linearGradient id={safeId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid */}
                    {[0, 0.5, 1].map(frac => {
                        const y2 = pad + frac * (h - 2 * pad);
                        return (
                            <line key={frac} x1={pad} y1={y2} x2={w - pad} y2={y2}
                                stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 2" opacity="0.4" />
                        );
                    })}

                    {/* Axes */}
                    <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--text-muted)" strokeWidth="1" />
                    <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="var(--text-muted)" strokeWidth="1" />

                    {/* Area */}
                    <polygon points={areaPoints} fill={`url(#${safeId})`} />

                    {/* Line */}
                    <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

                    {/* Dots */}
                    {filtered.map((val, i) => {
                        const x = pad + (i / (filtered.length - 1)) * (w - 2 * pad);
                        const y = h - pad - ((val - min) / range) * (h - 2 * pad);
                        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
                    })}

                    {/* Y labels */}
                    <text x={pad - 5} y={pad - 2} textAnchor="end" fontSize="8" fill="var(--text-secondary)">{max.toExponential(1)}</text>
                    <text x={pad - 5} y={h - pad + 12} textAnchor="end" fontSize="8" fill="var(--text-secondary)">{min.toExponential(1)}</text>

                    {/* X label */}
                    <text x={w / 2} y={h - 4} textAnchor="middle" fontSize="9" fill="var(--text-secondary)">Iteration</text>
                </svg>
                <div style={{ paddingBottom: '20px' }} />
            </div>
        );
    };

    // Matrix renderer
    const renderMatrix = (matrix, rowLabels, colLabels, title) => {
        if (!matrix || matrix.length === 0) return null;
        return (
            <div className="popup-matrix">
                <h4>{title}</h4>
                <div className="popup-matrix-scroll">
                    <table className="popup-matrix-table">
                        <thead>
                            <tr>
                                <th></th>
                                {colLabels.map(c => <th key={c}>{c}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row, i) => (
                                <tr key={i}>
                                    <td className="row-label">{rowLabels[i]}</td>
                                    {row.map((val, j) => (
                                        <td key={j}>{typeof val === 'number' ? val.toFixed(3) : val}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                className="popup-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="popup-card"
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.85, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="popup-header">
                        <h2>📊 Algorithm Results</h2>
                        <button className="popup-close-btn" onClick={onClose} title="Close">✕</button>
                    </div>

                    <div className="popup-body">
                        {/* Summary badges */}
                        <div className="popup-summary">
                            <div className="popup-stat">
                                <span className="popup-stat-label">Total Iterations</span>
                                <span className="popup-stat-value">{totalIterations}</span>
                            </div>
                            <div className="popup-stat">
                                <span className="popup-stat-label">Final log P(O|λ)</span>
                                <span className="popup-stat-value">{finalLogLik?.toFixed(6)}</span>
                            </div>
                            <div className="popup-stat">
                                <span className="popup-stat-label">Converged</span>
                                <span className={`popup-stat-badge ${converged ? 'yes' : 'no'}`}>
                                    {converged ? '✅ Yes' : '❌ No'}
                                </span>
                            </div>
                        </div>

                        {/* Graphs */}
                        <div className="popup-charts">
                            {renderMiniChart(logLikelihoods, 'P(O|λ) over Iterations', 'var(--accent-blue)')}
                            {renderMiniChart(oneMinusP, '1 − P(O|λ) over Iterations', 'var(--accent-red)')}
                        </div>

                        {/* Matrices */}
                        <div className="popup-matrices">
                            {renderMatrix(transitionMatrix, hiddenLabels, hiddenLabels, 'Final Transition Matrix (A)')}
                            {renderMatrix(emissionMatrix, hiddenLabels, symLabels, 'Final Emission Matrix (B)')}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
