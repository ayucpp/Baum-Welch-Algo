import { useState, useCallback, useRef } from 'react';
import * as d3 from 'd3';
import { randomStochastic, randomPi, normalizeArray } from '../engine/utils.js';

/**
 * Central state management hook for the HMM
 * 
 * KEY CONCEPT: emissionNodes represent the emission ALPHABET (unique symbols),
 * NOT individual time-step observations.
 */
export function useHMMState() {
    // Hidden states (array of { id, label, x, y })
    const [hiddenStates, setHiddenStates] = useState([]);
    // Emission symbols (unique alphabet)
    const [symbols, setSymbols] = useState([]);
    const symbolsRef = useRef([]);
    // Observation sequence (array of symbol strings — the time dimension)
    const [observationSeq, setObservationSeq] = useState([]);
    const obsSeqRef = useRef([]);
    // Emission symbol nodes — ONE per unique symbol (NOT per timestep)
    const [emissionNodes, setEmissionNodes] = useState([]);

    // Model parameters
    const [transitionMatrix, setTransitionMatrix] = useState([]); // A (N×N)
    const [emissionMatrix, setEmissionMatrix] = useState([]);     // B (N×M)
    const [initialDist, setInitialDist] = useState([]);           // π (N)

    // Saved state for resetting dragging
    const [savedHiddenStates, setSavedHiddenStates] = useState(null);
    const [savedEmissionNodes, setSavedEmissionNodes] = useState(null);

    // Whether the model is in algorithm mode
    const [algorithmMode, setAlgorithmMode] = useState(false);

    // Jerome enabled
    const [jeromeEnabled, setJeromeEnabled] = useState(false);

    // Dark mode
    const [darkMode, setDarkMode] = useState(true);

    // --- NEW: Phase 3 state ---
    const [maxIterations, setMaxIterations] = useState(100);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [canvasZoom, setCanvasZoom] = useState(1);
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
    const [rightPanelWidth, setRightPanelWidth] = useState(300);
    const [showResultsPopup, setShowResultsPopup] = useState(false);
    const [hasConvergedOnce, setHasConvergedOnce] = useState(false);

    // --- Layout helpers ---
    const computeLayout = useCallback((hiddenCount, symbolCount) => {
        const canvasWidth = 700;
        const hiddenY = 120;
        const emissionY = 380;

        const hiddenPositions = [];
        const spacing = canvasWidth / (hiddenCount + 1);
        for (let i = 0; i < hiddenCount; i++) {
            hiddenPositions.push({ x: spacing * (i + 1), y: hiddenY });
        }

        const emissionPositions = [];
        const eSpacing = canvasWidth / (symbolCount + 1);
        for (let i = 0; i < symbolCount; i++) {
            emissionPositions.push({ x: eSpacing * (i + 1), y: emissionY });
        }

        return { hiddenPositions, emissionPositions };
    }, []);

    const repositionNodes = useCallback((newHidden, newEmission) => {
        const { hiddenPositions, emissionPositions } = computeLayout(newHidden.length, newEmission.length);

        const updatedHidden = newHidden.map((s, i) => ({
            ...s,
            x: hiddenPositions[i]?.x ?? s.x,
            y: hiddenPositions[i]?.y ?? s.y,
        }));

        const updatedEmission = newEmission.map((s, i) => ({
            ...s,
            x: emissionPositions[i]?.x ?? s.x,
            y: emissionPositions[i]?.y ?? s.y,
        }));

        return { updatedHidden, updatedEmission };
    }, [computeLayout]);

    // --- Add a hidden state ---
    const addHiddenState = useCallback(() => {
        setHiddenStates(prev => {
            const id = `H${prev.length + 1}`;
            const newStates = [...prev, { id, label: id, x: 0, y: 0 }];
            const N = newStates.length;
            const M = Math.max(symbolsRef.current.length, 1);
            setTransitionMatrix(randomStochastic(N, N));
            setEmissionMatrix(randomStochastic(N, M));
            setInitialDist(randomPi(N));

            const { updatedHidden, updatedEmission } = repositionNodes(
                newStates,
                emissionNodes.length > 0 ? emissionNodes : symbolsRef.current.map((sym, i) => ({
                    id: sym, label: sym, symbol: sym, x: 0, y: 0,
                }))
            );
            setEmissionNodes(updatedEmission.length > 0 ? updatedEmission : []);
            return updatedHidden;
        });
    }, [repositionNodes, emissionNodes]);

    // --- Delete a hidden state ---
    const deleteHiddenState = useCallback((idToDelete) => {
        setHiddenStates(prev => {
            const idx = prev.findIndex(s => s.id === idToDelete);
            if (idx === -1) return prev;

            const newStates = prev.filter(s => s.id !== idToDelete);
            const N = newStates.length;
            const M = Math.max(symbolsRef.current.length, 1);

            if (N === 0) {
                setTransitionMatrix([]);
                setEmissionMatrix([]);
                setInitialDist([]);
            } else {
                // Remove row/col from transition matrix
                setTransitionMatrix(mPrev => {
                    const newM = mPrev.filter((_, ri) => ri !== idx).map(row => {
                        const newRow = row.filter((_, ci) => ci !== idx);
                        return normalizeArray(newRow);
                    });
                    return newM;
                });
                // Remove row from emission matrix
                setEmissionMatrix(mPrev => {
                    return mPrev.filter((_, ri) => ri !== idx);
                });
                // Remove from initial distribution
                setInitialDist(piPrev => {
                    const newPi = piPrev.filter((_, i) => i !== idx);
                    return normalizeArray(newPi);
                });
            }

            // Reposition remaining
            const currentEmission = emissionNodes.length > 0 ? emissionNodes : [];
            const { updatedHidden, updatedEmission } = repositionNodes(newStates, currentEmission);
            setEmissionNodes(updatedEmission);
            return updatedHidden;
        });
    }, [repositionNodes, emissionNodes]);

    // --- Delete an emission symbol ---
    const deleteEmissionSymbol = useCallback((idToDelete) => {
        const symIdx = symbolsRef.current.indexOf(idToDelete);
        if (symIdx === -1) return;

        const newSymbols = symbolsRef.current.filter(s => s !== idToDelete);
        setSymbols(newSymbols);
        symbolsRef.current = newSymbols;

        // Remove the observation sequence tokens that reference this symbol
        const newObs = obsSeqRef.current.filter(s => s !== idToDelete);
        setObservationSeq(newObs);
        obsSeqRef.current = newObs;

        setEmissionNodes(prev => {
            const newNodes = prev.filter(n => n.id !== idToDelete);

            // Remove column from emission matrix
            setEmissionMatrix(mPrev => {
                return mPrev.map(row => {
                    const newRow = row.filter((_, ci) => ci !== symIdx);
                    return newRow.length > 0 ? normalizeArray(newRow) : [];
                });
            });

            // Reposition
            setHiddenStates(hPrev => {
                const { updatedHidden, updatedEmission } = repositionNodes(hPrev, newNodes);
                setEmissionNodes(updatedEmission);
                return updatedHidden;
            });

            return newNodes;
        });
    }, [repositionNodes]);

    // Parse observation sequence and create emission nodes (unique symbols only)
    const generateObservedNodes = useCallback((seqStr) => {
        const tokens = seqStr.trim().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return;

        const uniqueSyms = [...new Set(tokens)];
        setSymbols(uniqueSyms);
        symbolsRef.current = uniqueSyms;
        setObservationSeq(tokens);
        obsSeqRef.current = tokens;

        const nodes = uniqueSyms.map((sym, i) => ({
            id: sym,
            label: sym,
            symbol: sym,
            x: 0,
            y: 0,
        }));

        setHiddenStates(prev => {
            const { updatedHidden, updatedEmission } = repositionNodes(prev, nodes);
            setEmissionNodes(updatedEmission);
            if (prev.length > 0) {
                setEmissionMatrix(randomStochastic(prev.length, uniqueSyms.length));
            }
            return updatedHidden;
        });
    }, [repositionNodes]);

    // Add a new emission symbol
    const addEmissionSymbol = useCallback(() => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const usedSyms = new Set(symbolsRef.current);
        let newSym = '';
        for (const letter of alphabet) {
            if (!usedSyms.has(letter)) {
                newSym = letter;
                break;
            }
        }
        if (!newSym) {
            newSym = `S${symbolsRef.current.length + 1}`;
        }

        const newSymbols = [...symbolsRef.current, newSym];
        setSymbols(newSymbols);
        symbolsRef.current = newSymbols;

        const newNode = { id: newSym, label: newSym, symbol: newSym, x: 0, y: 0 };

        setEmissionNodes(prev => {
            const newNodes = [...prev, newNode];
            setHiddenStates(hPrev => {
                const { updatedHidden, updatedEmission } = repositionNodes(hPrev, newNodes);
                setEmissionNodes(updatedEmission);

                if (hPrev.length > 0) {
                    setEmissionMatrix(mPrev => {
                        return mPrev.map(row => {
                            const newRow = [...row, Math.random() * 0.3 + 0.05];
                            const sum = newRow.reduce((a, b) => a + b, 0);
                            return newRow.map(v => v / sum);
                        });
                    });
                }
                return updatedHidden;
            });
            return newNodes;
        });
    }, [repositionNodes]);

    // Update matrix cells
    const updateTransition = useCallback((i, j, value) => {
        setTransitionMatrix(prev => {
            const newM = prev.map(r => [...r]);
            newM[i][j] = parseFloat(value) || 0;
            newM[i] = normalizeArray(newM[i]);
            return newM;
        });
    }, []);

    const updateEmission = useCallback((i, k, value) => {
        setEmissionMatrix(prev => {
            const newM = prev.map(r => [...r]);
            newM[i][k] = parseFloat(value) || 0;
            newM[i] = normalizeArray(newM[i]);
            return newM;
        });
    }, []);

    const updatePi = useCallback((i, value) => {
        setInitialDist(prev => {
            const newPi = [...prev];
            newPi[i] = parseFloat(value) || 0;
            return normalizeArray(newPi);
        });
    }, []);

    // Move a hidden state node
    const moveHiddenState = useCallback((id, x, y) => {
        setHiddenStates(prev =>
            prev.map(s => s.id === id ? { ...s, x, y } : s)
        );
    }, []);

    // Move an emission state node
    const moveEmissionNode = useCallback((id, x, y) => {
        setEmissionNodes(prev =>
            prev.map(s => s.id === id ? { ...s, x, y } : s)
        );
    }, []);

    // Convert observation sequence to indices
    const getObsIndices = useCallback(() => {
        return obsSeqRef.current.map(s => symbolsRef.current.indexOf(s));
    }, []);

    // Set full parameters (for M-step updates)
    const setParams = useCallback(({ A, B, pi }) => {
        if (A) setTransitionMatrix(A);
        if (B) setEmissionMatrix(B);
        if (pi) setInitialDist(pi);
    }, []);

    // Reference to stop any active simulation on unmount/toggle
    const simulationRef = useRef(null);

    // Expose a function to rename a hidden state label
    const renameHiddenState = useCallback((id, newLabel) => {
        setHiddenStates(prev => prev.map(s => s.id === id ? { ...s, label: newLabel } : s));
    }, []);

    // ─── Obsidian-style spring-embedder layout ───────────────────────────────
    //
    // Exactly matches specification:
    //   ∙ Preserve current node positions as initial conditions
    //   ∙ forceManyBody   → mutual repulsion between all nodes
    //   ∙ forceLink       → attractive spring forces along edges (H→H + H→E)
    //   ∙ forceCenter     → mild centering gravity to stabilize layout
    //   ∙ forceCollide    → hard collision constraints (no overlap)
    //   ∙ alpha(0.5)      → non-zero energy start so we enter a relaxation
    //   ∙ alphaDecay      → simulation progressively cools until frozen
    //   ∙ velocityDecay   → damping that turns kinetic energy into heat
    //
    const realignNodes = useCallback(() => {
        const combinedNodes = [
            ...hiddenStates.map(s => ({ ...s, group: 'hidden', vx: 0, vy: 0 })),
            ...emissionNodes.map(s => ({ ...s, group: 'emission', vx: 0, vy: 0 }))
        ];

        // Build edge list (springs):
        // H→H transition edges enforce relational structure
        // H→E emission edges keep the two rows at appropriate distance
        const links = [];
        hiddenStates.forEach((from, i) => {
            hiddenStates.forEach((to, j) => {
                if (i !== j) links.push({ source: from.id, target: to.id, distance: 140, strength: 0.15 });
            });
        });
        hiddenStates.forEach(h => {
            emissionNodes.forEach(e => {
                links.push({ source: h.id, target: e.id, distance: 200, strength: 0.06 });
            });
        });

        // Stop any previous simulation cleanly
        if (simulationRef.current) simulationRef.current.stop();

        simulationRef.current = d3.forceSimulation(combinedNodes)
            // Repulsion: push nodes apart so they spread out like a natural graph
            .force('charge', d3.forceManyBody()
                .strength(n => n.group === 'hidden' ? -280 : -160)
                .distanceMax(400)
            )
            // Springs: preserve relational structure through weighted edges
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(l => l.distance)
                .strength(l => l.strength)
            )
            // Centering gravity: gentle pull toward canvas center (not a hard constraint)
            .force('center', d3.forceCenter(350, 250).strength(0.04))
            // Collision: nodes cannot overlap each other
            .force('collide', d3.forceCollide()
                .radius(n => n.group === 'hidden' ? 50 : 34)
                .strength(0.85)
                .iterations(3)
            )
            // Physics parameters — Obsidian-like gradual relaxation
            .alpha(0.5)         // Start with meaningful energy (not full 1.0 to avoid explosion)
            .alphaMin(0.001)    // Cool down threshold — simulation stops when alpha reaches this
            .alphaDecay(0.012)  // Slow, organic cooling (~400 ticks to freeze)
            .velocityDecay(0.35) // Medium damping: fluid motion, not over-damped
            .on('tick', () => {
                const hiddenSim = combinedNodes.filter(n => n.group === 'hidden');
                const emissionSim = combinedNodes.filter(n => n.group === 'emission');

                setHiddenStates(prev => prev.map(s => {
                    const n = hiddenSim.find(x => x.id === s.id);
                    return n ? { ...s, x: n.x, y: n.y } : s;
                }));
                setEmissionNodes(prev => prev.map(s => {
                    const n = emissionSim.find(x => x.id === s.id);
                    return n ? { ...s, x: n.x, y: n.y } : s;
                }));
            });
    }, [hiddenStates, emissionNodes, computeLayout]);

    // Expose a rename function

    // Set Algorithm Mode (and save/restore layout or trigger force directed cleanout)
    const toggleAlgorithmMode = useCallback((isActive) => {
        if (isActive) {
            // Save initial positions before they are modified by D3
            setSavedHiddenStates(hiddenStates.map(s => ({ ...s })));
            setSavedEmissionNodes(emissionNodes.map(s => ({ ...s })));

            realignNodes();
        } else {
            // Revert back exactly where user had dragged them manually
            if (simulationRef.current) simulationRef.current.stop();
            if (savedHiddenStates) setHiddenStates(savedHiddenStates.map(s => ({ ...s })));
            if (savedEmissionNodes) setEmissionNodes(savedEmissionNodes.map(s => ({ ...s })));
        }
        setAlgorithmMode(isActive);
    }, [hiddenStates, emissionNodes, savedHiddenStates, savedEmissionNodes, realignNodes]);

    return {
        hiddenStates, setHiddenStates,
        symbols: symbolsRef.current.length > 0 ? symbolsRef.current : symbols,
        observationSeq,
        emissionNodes, setEmissionNodes,
        observedNodes: emissionNodes,
        transitionMatrix, setTransitionMatrix,
        emissionMatrix, setEmissionMatrix,
        initialDist, setInitialDist,
        algorithmMode, setAlgorithmMode: toggleAlgorithmMode,
        realignNodes,
        jeromeEnabled, setJeromeEnabled,
        darkMode, setDarkMode,
        // Phase 3
        maxIterations, setMaxIterations,
        playbackSpeed, setPlaybackSpeed,
        canvasZoom, setCanvasZoom,
        leftPanelCollapsed, setLeftPanelCollapsed,
        rightPanelCollapsed, setRightPanelCollapsed,
        rightPanelWidth, setRightPanelWidth,
        showResultsPopup, setShowResultsPopup,
        hasConvergedOnce, setHasConvergedOnce,
        // Actions
        addHiddenState,
        deleteHiddenState,
        generateObservedNodes,
        addEmissionSymbol,
        deleteEmissionSymbol,
        updateTransition,
        updateEmission,
        updatePi,
        moveHiddenState,
        moveEmissionNode,
        getObsIndices,
        setParams,
        renameHiddenState,
    };
}
