import React from 'react';
import { motion } from 'framer-motion';

/**
 * Observed state node — dotted rectangle, hand-drawn style
 */
export default function ObservedNode({ id, label, symbol, x, y }) {
    return (
        <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x, y }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        >
            {/* Hand-drawn rectangle */}
            <rect
                x={-40}
                y={-22}
                width={80}
                height={44}
                rx={4}
                fill="#fefcbf"
                stroke="#975a16"
                strokeWidth={1.8}
                strokeDasharray="6 4"
                filter="url(#sketchy)"
            />

            {/* Label */}
            <text
                textAnchor="middle"
                dy="-4"
                fontFamily="'Caveat', cursive"
                fontSize="16"
                fill="#744210"
                fontWeight="700"
            >
                {label}
            </text>

            {/* Symbol */}
            <text
                textAnchor="middle"
                dy="14"
                fontFamily="'Inter', sans-serif"
                fontSize="12"
                fill="#975a16"
                fontWeight="600"
            >
                = {symbol}
            </text>

            <title>{`${label}: Observation "${symbol}"`}</title>
        </motion.g>
    );
}
