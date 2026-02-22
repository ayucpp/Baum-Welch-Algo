import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExpandedChartPopup from '../Popups/ExpandedChartPopup.jsx';
import MatrixEditor from './MatrixEditor.jsx';
import MiniLineChart from '../Charts/MiniLineChart.jsx';

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

    // renderChart is now replaced by MiniLineChart below


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
                        style={{ marginLeft: 'auto' }}
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

                    {/* ── All 3 convergence charts — realtime updates, expand popup, tooltips ── */}
                    {logLikelihoods.length >= 2 && (() => {
                        const pVals = logLikelihoods.map(ll => Math.exp(ll));
                        const omP = pVals.map(p => 1 - Math.min(p, 1));
                        const finalLL = logLikelihoods[logLikelihoods.length - 1];
                        const finalP = Math.exp(finalLL);
                        return (
                            <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <MiniLineChart
                                    data={logLikelihoods}
                                    color="var(--accent-blue)"
                                    title="log P(O|λ) over Iterations"
                                    xLabel="Iteration"
                                    yLabel="log P(O|λ)"
                                    height={120}
                                    showGlowDot={true}
                                    asymptoteDesc={`Asymptote ≈ ${finalLL.toFixed(4)}`}
                                />
                                <MiniLineChart
                                    data={omP}
                                    color="var(--accent-red)"
                                    title="1 − P(O|λ) over Iterations"
                                    xLabel="Iteration"
                                    yLabel="1 − P(O|λ)"
                                    height={120}
                                    showGlowDot={true}
                                    asymptoteDesc={`Residual ≈ ${(1 - Math.min(finalP, 1)).toExponential(3)}`}
                                />
                            </div>
                        );
                    })()}

                </div>
            </div>
        </>
    );
}

