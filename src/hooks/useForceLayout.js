import { useCallback } from 'react';

/**
 * Deterministic grid layout for vertical hierarchical HMM graph
 * No D3-force needed — positions are computed from state/symbol counts
 */
export function useForceLayout(hiddenStates, emissionNodes, setHiddenStates, setEmissionNodes) {
    const startForceLayout = useCallback(() => {
        const canvasWidth = 700;
        const hiddenY = 120;
        const emissionY = 380;

        // Position hidden states in top row
        const hSpacing = canvasWidth / (hiddenStates.length + 1);
        setHiddenStates(prev =>
            prev.map((s, i) => ({ ...s, x: hSpacing * (i + 1), y: hiddenY }))
        );

        // Position emission nodes in bottom row
        if (setEmissionNodes) {
            const eSpacing = canvasWidth / (emissionNodes.length + 1);
            setEmissionNodes(prev =>
                prev.map((s, i) => ({ ...s, x: eSpacing * (i + 1), y: emissionY }))
            );
        }
    }, [hiddenStates.length, emissionNodes.length, setHiddenStates, setEmissionNodes]);

    const stopForceLayout = useCallback(() => {
        // No-op — no simulation to stop
    }, []);

    return { startForceLayout, stopForceLayout };
}
