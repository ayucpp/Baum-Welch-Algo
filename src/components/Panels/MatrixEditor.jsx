import React from 'react';
import { motion } from 'framer-motion';

/**
 * Editable matrix table with row highlighting
 */
export default function MatrixEditor({ matrix, rowLabels, colLabels, onUpdate, highlightRow, disabled }) {
    if (!matrix || matrix.length === 0) return null;

    return (
        <div className="matrix-editor">
            <table className="matrix-table">
                <thead>
                    <tr>
                        <th></th>
                        {colLabels.map((label, j) => (
                            <th key={j} className="matrix-col-label">{label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {matrix.map((row, i) => (
                        <motion.tr
                            key={i}
                            className={`matrix-row ${highlightRow === 'all' || highlightRow === i ? 'highlight' : ''}`}
                            animate={{
                                backgroundColor: highlightRow === 'all' || highlightRow === i
                                    ? 'rgba(66, 153, 225, 0.15)'
                                    : 'transparent',
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            <td className="matrix-row-label">{rowLabels[i]}</td>
                            {row.map((val, j) => (
                                <td key={j} className="matrix-cell">
                                    <motion.input
                                        type="number"
                                        className="matrix-input"
                                        value={val.toFixed(3)}
                                        onChange={(e) => onUpdate(i, j, e.target.value)}
                                        animate={{
                                            scale: highlightRow === 'all' || highlightRow === i ? [1, 1.05, 1] : 1,
                                        }}
                                        transition={{ duration: 0.4 }}
                                        step="0.01"
                                        min="0"
                                        max="1"
                                        disabled={disabled}
                                    />
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
