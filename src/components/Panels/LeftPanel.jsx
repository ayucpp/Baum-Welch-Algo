import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Left Panel — model setup, delete controls, playback speed, max iterations
 * Collapsible via chevron toggle
 */
export default function LeftPanel({ hmmState }) {
    const [inputSeq, setInputSeq] = useState('A B A C B A');
    const {
        generateObservedNodes, addHiddenState, addEmissionSymbol,
        deleteHiddenState, deleteEmissionSymbol,
        hiddenStates, emissionNodes, algorithmMode, symbols,
        maxIterations, setMaxIterations,
        playbackSpeed, setPlaybackSpeed,
        leftPanelCollapsed, setLeftPanelCollapsed,
    } = hmmState;

    const handleGenerate = () => {
        generateObservedNodes(inputSeq);
    };

    // Symbols that are part of the observation sequence — cannot be deleted
    const obsSymbols = new Set(
        inputSeq.trim().split(/\s+/).filter(Boolean).map(s => s.toUpperCase())
    );

    const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2];

    return (
        <div className={`left-panel ${leftPanelCollapsed ? 'collapsed' : ''}`}>
            {leftPanelCollapsed && (
                <button
                    className="panel-collapse-btn"
                    onClick={() => setLeftPanelCollapsed(false)}
                    title="Expand panel"
                >
                    »
                </button>
            )}

            {!leftPanelCollapsed && (
                <motion.div
                    className="panel-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>📐 Model Setup</h2>
                        <button
                            className="panel-collapse-btn header-btn"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => setLeftPanelCollapsed(true)}
                            title="Collapse panel"
                        >
                            «
                        </button>
                    </div>

                    {/* Observation sequence input */}
                    <div className="panel-section">
                        <label className="input-label" htmlFor="obs-input">Observation Sequence</label>
                        <input
                            id="obs-input"
                            className="obs-input"
                            type="text"
                            value={inputSeq}
                            onChange={(e) => setInputSeq(e.target.value)}
                            placeholder="A B A C B A"
                            disabled={algorithmMode}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleGenerate}
                            disabled={algorithmMode}
                        >
                            Generate Emission Nodes
                        </button>
                    </div>

                    {/* Add controls */}
                    <div className="panel-section">
                        <button
                            className="btn btn-secondary"
                            onClick={() => addHiddenState()}
                            disabled={algorithmMode}
                        >
                            + Add Hidden State
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => addEmissionSymbol()}
                            disabled={algorithmMode || symbols.length === 0}
                            style={{ marginTop: '6px' }}
                        >
                            ➕ Add Emission Symbol
                        </button>
                    </div>

                    {/* Delete controls — hidden states */}
                    {hiddenStates.length > 0 && !algorithmMode && (
                        <div className="panel-section delete-section">
                            <label className="input-label">Hidden States</label>
                            <div className="delete-items">
                                {hiddenStates.map(s => (
                                    <div key={s.id} className="delete-item">
                                        <span className="delete-item-label">{s.label}</span>
                                        <button
                                            className="delete-item-btn"
                                            onClick={() => deleteHiddenState(s.id)}
                                            title={`Delete ${s.label}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Delete controls — emission symbols */}
                    {emissionNodes.length > 0 && !algorithmMode && (
                        <div className="panel-section delete-section">
                            <label className="input-label">Emission Symbols</label>
                            <div className="delete-items">
                                {emissionNodes.map(n => {
                                    const isFromObs = obsSymbols.has(n.label?.toUpperCase());
                                    return (
                                        <div key={n.id} className="delete-item">
                                            <span className="delete-item-label">{n.label}</span>
                                            {!isFromObs && (
                                                <button
                                                    className="delete-item-btn"
                                                    onClick={() => deleteEmissionSymbol(n.id)}
                                                    title={`Delete ${n.label}`}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Max Iterations */}
                    <div className="panel-section">
                        <label className="input-label" htmlFor="max-iter-input">Max Iterations</label>
                        <input
                            id="max-iter-input"
                            className="obs-input"
                            type="number"
                            value={maxIterations}
                            onChange={(e) => setMaxIterations(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                            min={1}
                            max={500}
                            disabled={algorithmMode}
                        />
                    </div>

                    {/* Playback Speed */}
                    <div className="panel-section">
                        <label className="input-label">Playback Speed</label>
                        <div className="speed-selector">
                            {SPEED_OPTIONS.map(sp => (
                                <button
                                    key={sp}
                                    className={`speed-btn ${playbackSpeed === sp ? 'active' : ''}`}
                                    onClick={() => setPlaybackSpeed(sp)}
                                >
                                    {sp}x
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="panel-info">
                        <div className="info-row">
                            <span className="info-label">Hidden States</span>
                            <span className="info-value">{hiddenStates.length}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Emission Symbols</span>
                            <span className="info-value">{emissionNodes.length}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Alphabet</span>
                            <span className="info-value">{symbols.join(', ') || '—'}</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="panel-legend">
                        <h3>Legend</h3>
                        <div className="legend-item">
                            <span className="legend-circle" /> Hidden State
                        </div>
                        <div className="legend-item">
                            <span className="legend-rect" /> Emission Symbol
                        </div>
                        <div className="legend-item">
                            <span className="legend-line solid" /> Transition
                        </div>
                        <div className="legend-item">
                            <span className="legend-line dashed" /> Emission
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
