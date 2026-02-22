import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MiniLineChart from '../Charts/MiniLineChart.jsx';

/**
 * ResultsPopup — glassmorphic modal showing convergence results.
 * Uses the shared MiniLineChart component for both convergence graphs.
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

    const pValues = logLikelihoods.map(ll => Math.exp(ll));
    const oneMinusP = pValues.map(p => 1 - Math.min(p, 1));
    const finalP = finalLogLik != null ? Math.exp(finalLogLik) : null;

    const [expanded, setExpanded] = useState(null);

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

    // Chart wrapper with expand/collapse toggle
    const ChartPanel = ({ chartKey, data, color, label, asymptoteDesc }) => {
        const isExp = expanded === chartKey;
        return (
            <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                    <button
                        onClick={() => setExpanded(isExp ? null : chartKey)}
                        style={{
                            background: 'none', border: '1px solid var(--border-color)',
                            borderRadius: 4, color: 'var(--text-secondary)',
                            cursor: 'pointer', padding: '1px 7px', fontSize: '11px',
                        }}
                    >
                        {isExp ? '⊖ Collapse' : '⊕ Expand'}
                    </button>
                </div>
                <MiniLineChart
                    data={data}
                    color={color}
                    height={isExp ? 200 : 120}
                    showGlowDot={true}
                    asymptoteDesc={asymptoteDesc}
                    expandable={false}
                />
            </div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                className="popup-overlay"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="popup-card"
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.85, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="popup-header">
                        <h2>📊 Algorithm Results</h2>
                        <button className="popup-close-btn" onClick={onClose} title="Close">✕</button>
                    </div>

                    <div className="popup-body">
                        {/* Summary badges */}
                        <div className="popup-summary">
                            <div className="popup-stat">
                                <span className="popup-stat-label">Total Iterations</span>
                                <span className="popup-stat-value">{logLikelihoods.length}</span>
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

                        {/* Charts stacked, full popup width */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
                            <ChartPanel
                                chartKey="loglik"
                                data={logLikelihoods}
                                color="var(--accent-blue)"
                                label="log P(O|λ) over Iterations"
                                asymptoteDesc={`Converged at ${finalLogLik?.toFixed(4)} — log-likelihood stops improving here`}
                            />
                            <ChartPanel
                                chartKey="oneminus"
                                data={oneMinusP}
                                color="var(--accent-red)"
                                label="1 − P(O|λ) over Iterations"
                                asymptoteDesc={`Residual ≈ ${finalP != null ? (1 - Math.min(finalP, 1)).toExponential(3) : '?'} — unexplained probability`}
                            />
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
