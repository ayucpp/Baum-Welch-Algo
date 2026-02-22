import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExpandedChartPopup from '../Popups/ExpandedChartPopup.jsx';
import MatrixEditor from './MatrixEditor.jsx';

/**
 * Right Panel — parameters, matrices, log-likelihood chart
 * Collapsible, drag-resizable, zoomable chart
 */
export default function RightPanel({ hmmState, algorithmState }) {
    const {
        hiddenStates, symbols, transitionMatrix, emissionMatrix, initialDist,
        updateTransition, updateEmission, updatePi, algorithmMode,
        rightPanelCollapsed, setRightPanelCollapsed,
        rightPanelWidth, setRightPanelWidth,
    } = hmmState;

    const { logLikelihoods, currentStep, iteration } = algorithmState;

    const [chartZoom, setChartZoom] = useState(1);
    const resizingRef = useRef(false);
    const panelRef = useRef(null);
    const [isExpandedChartOpen, setIsExpandedChartOpen] = useState(false);

    // Drag-resize handler
    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        resizingRef.current = true;
        const startX = e.clientX;
        const startWidth = rightPanelWidth;

        const handleMove = (moveE) => {
            if (!resizingRef.current) return;
            const delta = startX - moveE.clientX;
            const newWidth = Math.max(200, Math.min(600, startWidth + delta));
            setRightPanelWidth(newWidth);
        };

        const handleUp = () => {
            resizingRef.current = false;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    }, [rightPanelWidth, setRightPanelWidth]);

    if (rightPanelCollapsed) {
        return (
            <div className="right-panel collapsed">
                <button
                    className="panel-collapse-btn"
                    onClick={() => setRightPanelCollapsed(false)}
                    title="Expand panel"
                >
                    «
                </button>
            </div>
        );
    }

    if (hiddenStates.length === 0) {
        return (
            <div className="right-panel" style={{ width: rightPanelWidth }} ref={panelRef}>
                <div className="resize-handle" onMouseDown={handleResizeStart} />
                <div className="panel-header">
                    <h2>📊 Parameters</h2>
                    <button
                        className="panel-collapse-btn right"
                        style={{ position: 'relative', top: '0', right: '0', marginLeft: 'auto' }}
                        onClick={() => setRightPanelCollapsed(true)}
                        title="Collapse panel"
                    >
                        »
                    </button>
                </div>
                <div className="panel-empty">
                    <p>Add hidden states and emission symbols to see matrices.</p>
                </div>
            </div>
        );
    }

    const hiddenLabels = hiddenStates.map(s => s.label);
    const symLabels = symbols.length > 0 ? symbols : ['?'];

    // ── Log-Likelihood Chart ──
    const renderChart = () => {
        if (logLikelihoods.length < 2) return null;
        const min = Math.min(...logLikelihoods);
        const max = Math.max(...logLikelihoods);
        const range = max - min || 1;
        const baseW = Math.max(230, rightPanelWidth - 40);
        const baseH = 120;
        const pad = 30;

        const w = baseW * chartZoom;
        const h = baseH * chartZoom;

        const points = logLikelihoods.map((ll, i) => {
            const x = pad + (i / (logLikelihoods.length - 1)) * (w - 2 * pad);
            const y = h - pad - ((ll - min) / range) * (h - 2 * pad);
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="convergence-chart">
                <div className="chart-header">
                    <h3>Log-Likelihood</h3>
                    <div className="chart-zoom-controls">
                        <button
                            className="chart-zoom-btn"
                            onClick={() => setChartZoom(z => Math.max(0.5, z - 0.25))}
                            title="Zoom out"
                        >
                            −
                        </button>
                        <span className="chart-zoom-label">{(chartZoom * 100).toFixed(0)}%</span>
                        <button
                            className="chart-zoom-btn"
                            onClick={() => setChartZoom(z => Math.min(3, z + 0.25))}
                            title="Zoom in"
                        >
                            +
                        </button>
                    </div>
                </div>
                <div className="chart-scroll-container">
                    <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} className="chart-svg">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                            const y2 = pad + frac * (h - 2 * pad);
                            return (
                                <line
                                    key={frac}
                                    x1={pad} y1={y2}
                                    x2={w - pad} y2={y2}
                                    stroke="var(--border-color)"
                                    strokeWidth="0.5"
                                    strokeDasharray="4 2"
                                    opacity="0.5"
                                />
                            );
                        })}

                        {/* Axes */}
                        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--text-muted)" strokeWidth="1" />
                        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="var(--text-muted)" strokeWidth="1" />

                        {/* Gradient area */}
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <polygon
                            points={`${pad},${h - pad} ${points} ${pad + ((logLikelihoods.length - 1) / (logLikelihoods.length - 1)) * (w - 2 * pad)},${h - pad}`}
                            fill="url(#chartGradient)"
                        />

                        {/* Line */}
                        <polyline
                            points={points}
                            fill="none"
                            stroke="var(--accent-blue)"
                            strokeWidth="2"
                            strokeLinejoin="round"
                        />

                        {/* Dots */}
                        {logLikelihoods.map((ll, i) => {
                            const x = pad + (i / (logLikelihoods.length - 1)) * (w - 2 * pad);
                            const y = h - pad - ((ll - min) / range) * (h - 2 * pad);
                            return <circle key={i} cx={x} cy={y} r={3} fill="var(--accent-blue)" />;
                        })}

                        {/* Labels */}
                        <text x={w / 2} y={h - 4} textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontFamily="Inter, sans-serif">Iteration</text>
                        <text x={pad - 5} y={pad - 5} textAnchor="end" fontSize="8" fill="var(--text-secondary)" fontFamily="Inter, sans-serif">{max.toFixed(2)}</text>
                        <text x={pad - 5} y={h - pad + 12} textAnchor="end" fontSize="8" fill="var(--text-secondary)" fontFamily="Inter, sans-serif">{min.toFixed(2)}</text>
                    </svg>

                    {/* Clickable Overlay to open expanded modal */}
                    <div
                        className="chart-expand-overlay"
                        onClick={() => setIsExpandedChartOpen(true)}
                        title="Click to expand chart"
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            cursor: 'zoom-in', zIndex: 10, background: 'transparent'
                        }}
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="right-panel" style={{ width: rightPanelWidth }} ref={panelRef}>
                {/* Drag resize handle */}
                <div className="resize-handle" onMouseDown={handleResizeStart} />

                <div className="panel-header">
                    <h2>📊 Parameters</h2>
                    {algorithmMode && (
                        <span className="iteration-badge">Iteration {iteration + 1}</span>
                    )}
                    {/* Collapse button moved to the right within the header */}
                    <button
                        className="panel-collapse-btn right"
                        style={{ position: 'relative', top: '0', right: '0', marginLeft: 'auto' }}
                        onClick={() => setRightPanelCollapsed(true)}
                        title="Collapse panel"
                    >
                        »
                    </button>
                </div>

                {/* Content... */}
                <div className="panel-scroll">
                    {/* Initial Distribution */}
                    <div className="panel-section">
                        <h3>Initial Distribution (π)</h3>
                        <div className="pi-editor">
                            {initialDist.map((val, i) => (
                                <div key={i} className="pi-cell">
                                    <span className="pi-label">{hiddenLabels[i]}</span>
                                    <input
                                        type="number"
                                        className="matrix-input pi-input"
                                        value={val?.toFixed(3) || '0.000'}
                                        onChange={(e) => updatePi(i, e.target.value)}
                                        step="0.01"
                                        min="0"
                                        max="1"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Transition Matrix — editable before run */}
                    <div className="panel-section">
                        <h3>Transition Matrix (A)</h3>
                        <MatrixEditor
                            matrix={transitionMatrix}
                            rowLabels={hiddenLabels}
                            colLabels={hiddenLabels}
                            onUpdate={updateTransition}
                            highlightRow={currentStep.type === 'M_STEP' ? 'all' : null}
                        />
                    </div>

                    {/* Emission Matrix — editable before run */}
                    <div className="panel-section">
                        <h3>Emission Matrix (B)</h3>
                        <MatrixEditor
                            matrix={emissionMatrix}
                            rowLabels={hiddenLabels}
                            colLabels={symLabels}
                            onUpdate={updateEmission}
                            highlightRow={currentStep.type === 'M_STEP' ? 'all' : null}
                        />
                    </div>

                    {/* Convergence Chart */}
                    {renderChart()}
                </div>
            </div>

            {/* Expanded Chart Modal */}
            {isExpandedChartOpen && (
                <ExpandedChartPopup
                    logLikelihoods={logLikelihoods}
                    onClose={() => setIsExpandedChartOpen(false)}
                />
            )}
        </>
    );
}
