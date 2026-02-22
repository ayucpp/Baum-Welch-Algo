import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

/**
 * Emission symbol node — unique emission symbol
 * Uses d3-drag for dragging, while preserving Framer Motion for initial animation.
 */
export default function EmissionNode({ id, label, symbol, x, y, onDrag }) {
    const nodeRef = useRef(null);

    useEffect(() => {
        if (!nodeRef.current || !onDrag) return;

        const drag = d3.drag()
            .on('drag', (event) => {
                onDrag(id, event.x, event.y);
            });

        d3.select(nodeRef.current).call(drag);
    }, [id, onDrag]);

    return (
        <g transform={`translate(${x}, ${y})`} ref={nodeRef} style={{ cursor: onDrag ? 'grab' : 'default' }}>
            <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
            >
                {/* Rounded rectangle */}
                <rect
                    x={-32}
                    y={-22}
                    width={64}
                    height={44}
                    rx={8}
                    fill="var(--emission-node-fill)"
                    stroke="var(--emission-node-stroke)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                />

                {/* Symbol label */}
                <text
                    textAnchor="middle"
                    dy="5"
                    fontFamily="var(--font-display)"
                    fontSize="22"
                    fill="var(--emission-node-text)"
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                >
                    {symbol}
                </text>
            </motion.g>
            <title>{`Emission Symbol: ${symbol}`}</title>
        </g>
    );
}
