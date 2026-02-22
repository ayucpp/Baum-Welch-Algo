import React, { useCallback, useRef, useState } from 'react';
import HiddenNode from './HiddenNode.jsx';
import EmissionNode from './EmissionNode.jsx';
import Edge from './Edge.jsx';
import { STEP_TYPES } from '../../hooks/useAlgorithm.js';

/**
 * Main SVG Canvas — vertical hierarchical HMM graph with zoom controls
 */
export default function Canvas({ hmmState, algorithmState }) {
    const {
        hiddenStates, emissionNodes, transitionMatrix, emissionMatrix,
        addHiddenState, addEmissionSymbol, moveHiddenState, moveEmissionNode, symbols, algorithmMode,
        canvasZoom, setCanvasZoom, renameHiddenState,
    } = hmmState;

    const { currentStep, alphaResult, betaResult, gammaResult, xiResult } = algorithmState;
    const svgRef = useRef(null);

    // Single-slot hover: only one edge can glow at a time
    const [hoveredEdgeId, setHoveredEdgeId] = useState(null);
    const setEdgeHover = useCallback((id) => setHoveredEdgeId(id), []);
    const clearEdgeHover = useCallback((id) => setHoveredEdgeId(prev => prev === id ? null : prev), []);

    // Zoom via mouse wheel
    const handleWheel = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setCanvasZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
        }
    }, [setCanvasZoom]);

    // Compute viewBox from zoom
    const baseW = 700;
    const baseH = 500;
    const vbW = baseW / canvasZoom;
    const vbH = baseH / canvasZoom;
    const vbX = (baseW - vbW) / 2;
    const vbY = (baseH - vbH) / 2;

    // Double-click to add hidden state
    const handleDoubleClick = useCallback((e) => {
        if (algorithmMode) return;
        addHiddenState();
    }, [addHiddenState, algorithmMode]);

    // Determine highlights
    const getNodeHighlight = (stateIdx) => {
        if (!currentStep.data) return null;
        if (currentStep.type === STEP_TYPES.FORWARD) return 'forward';
        if (currentStep.type === STEP_TYPES.BACKWARD) return 'backward';
        if (currentStep.type === STEP_TYPES.GAMMA) return 'gamma';
        return null;
    };

    const getAlphaVal = (stateIdx) => {
        if (currentStep.type === STEP_TYPES.FORWARD && currentStep.data) {
            const t = currentStep.data.t;
            return currentStep.data.alpha[t]?.[stateIdx] ?? null;
        }
        return null;
    };

    const getBetaVal = (stateIdx) => {
        if (currentStep.type === STEP_TYPES.BACKWARD && currentStep.data) {
            const t = currentStep.data.t;
            return currentStep.data.beta[t]?.[stateIdx] ?? null;
        }
        return null;
    };

    const getGammaVal = (stateIdx) => {
        if (currentStep.type === STEP_TYPES.GAMMA && currentStep.data) {
            const gamma = currentStep.data.gamma;
            if (gamma?.[0]) return gamma[0][stateIdx];
        }
        return null;
    };

    const getXiVal = (fromIdx, toIdx) => {
        if (currentStep.type === STEP_TYPES.XI && xiResult) {
            let sum = 0;
            for (let t = 0; t < xiResult.length; t++) {
                sum += xiResult[t][fromIdx][toIdx];
            }
            return sum / xiResult.length;
        }
        return null;
    };

    const transitionEdgeIndex = (i, j) => {
        if (i < j) return 0;
        return 1;
    };

    return (
        <div className="canvas-wrapper" onWheel={handleWheel}>
            <svg
                ref={svgRef}
                className="canvas-svg"
                width="100%"
                height="100%"
                viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
                preserveAspectRatio="xMidYMid meet"
                onDoubleClick={handleDoubleClick}
            >
                <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--grid-line)" strokeWidth="0.5" opacity="0.5" />
                    </pattern>
                    <radialGradient id="abyssMask" cx="50%" cy="50%" r="60%">
                        <stop offset="30%" stopColor="white" stopOpacity="1" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                    <mask id="gridFade">
                        <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="url(#abyssMask)" />
                    </mask>
                </defs>

                {/* Background */}
                <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="var(--canvas-bg)" />
                <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="url(#grid)" mask="url(#gridFade)" />

                {/* Hint text when empty */}
                {hiddenStates.length === 0 && emissionNodes.length === 0 && !algorithmMode && (
                    <text
                        x="350" y="250"
                        textAnchor="middle"
                        fontFamily="var(--font-display)"
                        fontSize="20"
                        fill="var(--text-muted)"
                        opacity="0.7"
                    >
                        Use the toolbar below to add states & symbols
                    </text>
                )}

                {/* Layer labels */}
                {hiddenStates.length > 0 && (
                    <text x="15" y="122" fontFamily="var(--font-ui)" fontSize="10" fill="var(--text-muted)" fontWeight="600" opacity="0.6">
                        HIDDEN
                    </text>
                )}
                {emissionNodes.length > 0 && (
                    <text x="15" y="382" fontFamily="var(--font-ui)" fontSize="10" fill="var(--text-muted)" fontWeight="600" opacity="0.6">
                        EMISSION
                    </text>
                )}

                {/* ─── Layer 1: Transition edges ─── */}
                <g className="transition-layer">
                    {hiddenStates.map((from, i) =>
                        hiddenStates.map((to, j) => {
                            if (!transitionMatrix[i]) return null;
                            const prob = transitionMatrix[i][j];
                            if (prob === undefined) return null;
                            const isSelf = i === j;
                            const eid = `t-${i}-${j}`;
                            return (
                                <Edge
                                    key={eid}
                                    edgeId={eid}
                                    isHovered={hoveredEdgeId === eid}
                                    onEdgeHover={setEdgeHover}
                                    onEdgeHoverEnd={clearEdgeHover}
                                    fromX={from.x} fromY={from.y}
                                    toX={to.x} toY={to.y}
                                    probability={prob}
                                    type="transition"
                                    isSelfLoop={isSelf}
                                    highlight={currentStep.type === STEP_TYPES.XI}
                                    xiVal={getXiVal(i, j)}
                                    edgeIndex={transitionEdgeIndex(i, j)}
                                    totalEdges={2}
                                />
                            );
                        })
                    )}
                </g>

                {/* ─── Layer 2: Emission edges ─── */}
                <g className="emission-layer">
                    {hiddenStates.map((h, i) =>
                        emissionNodes.map((e, symIdx) => {
                            if (!emissionMatrix[i]) return null;
                            const prob = emissionMatrix[i][symIdx];
                            if (prob === undefined || prob < 0.01) return null;
                            const eid = `e-${i}-${symIdx}`;
                            return (
                                <Edge
                                    key={eid}
                                    edgeId={eid}
                                    isHovered={hoveredEdgeId === eid}
                                    onEdgeHover={setEdgeHover}
                                    onEdgeHoverEnd={clearEdgeHover}
                                    fromX={h.x} fromY={h.y}
                                    toX={e.x} toY={e.y}
                                    probability={prob}
                                    type="emission"
                                    isSelfLoop={false}
                                />
                            );
                        })
                    )}
                </g>

                {/* ─── Layer 3: Emission symbol nodes ─── */}
                {emissionNodes.map((node) => (
                    <EmissionNode key={node.id} {...node} onDrag={moveEmissionNode} />
                ))}

                {/* ─── Layer 4: Hidden state nodes ─── */}
                {hiddenStates.map((node, idx) => (
                    <HiddenNode
                        key={node.id}
                        {...node}
                        onDrag={moveHiddenState}
                        onRename={algorithmMode ? undefined : renameHiddenState}
                        highlight={getNodeHighlight(idx)}
                        alphaVal={getAlphaVal(idx)}
                        betaVal={getBetaVal(idx)}
                        gammaVal={getGammaVal(idx)}
                    />
                ))}

                {/* ─── Step info overlay ─── */}
                {algorithmMode && currentStep.type !== STEP_TYPES.IDLE && (
                    <g>
                        <rect x={vbX + 10} y={vbY + 10} width="260" height="32" rx="8"
                            fill="var(--overlay-bg)" />
                        <text x={vbX + 20} y={vbY + 31} fontFamily="var(--font-ui)" fontSize="12"
                            fill="var(--overlay-text)" fontWeight="500">
                            {getStepLabel(currentStep)}
                        </text>
                    </g>
                )}
            </svg>

            {/* ─── Zoom Controls ─── */}
            <div className="canvas-zoom-controls">
                <button
                    className="zoom-btn"
                    onClick={() => setCanvasZoom(prev => Math.min(3, prev + 0.2))}
                    title="Zoom In"
                >
                    +
                </button>
                <span className="zoom-level">{(canvasZoom * 100).toFixed(0)}%</span>
                <button
                    className="zoom-btn"
                    onClick={() => setCanvasZoom(prev => Math.max(0.3, prev - 0.2))}
                    title="Zoom Out"
                >
                    −
                </button>
                <button
                    className="zoom-btn zoom-reset"
                    onClick={() => setCanvasZoom(1)}
                    title="Reset Zoom"
                >
                    ⟲
                </button>
            </div>

            {/* ─── Excalidraw-style Toolbar ─── */}
            {!algorithmMode && (
                <div className="canvas-toolbar">
                    <button
                        className="toolbar-btn"
                        onClick={addHiddenState}
                        title="Add Hidden State"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
                            <text x="10" y="14" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">H</text>
                        </svg>
                        <span className="toolbar-label">Hidden State</span>
                    </button>
                    <div className="toolbar-sep" />
                    <button
                        className="toolbar-btn"
                        onClick={addEmissionSymbol}
                        disabled={symbols.length === 0}
                        title="Add Emission Symbol"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <rect x="2" y="4" width="16" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
                            <text x="10" y="14" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">E</text>
                        </svg>
                        <span className="toolbar-label">Emission Symbol</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function getStepLabel(step) {
    switch (step.type) {
        case STEP_TYPES.INIT: return '🟢 Model Initialization';
        case STEP_TYPES.FORWARD: return `➡️ Forward Pass — t = ${step.data?.t}`;
        case STEP_TYPES.BACKWARD: return `⬅️ Backward Pass — t = ${step.data?.t}`;
        case STEP_TYPES.GAMMA: return '📊 Computing Gamma (γ)';
        case STEP_TYPES.XI: return '🔗 Computing Xi (ξ)';
        case STEP_TYPES.M_STEP: return '🔄 Parameter Update (M-Step)';
        case STEP_TYPES.LIKELIHOOD: return `📈 Log-Likelihood: ${step.data?.logLik?.toFixed(4)}`;
        case STEP_TYPES.CONVERGE_CHECK: return `🔍 Convergence Check — Iter ${(step.data?.iteration ?? 0) + 1}`;
        case STEP_TYPES.CONVERGED: return `✅ Converged after ${step.data?.iteration} iterations`;
        default: return '';
    }
}
