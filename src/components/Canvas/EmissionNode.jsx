import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

/**
 * Emission symbol node — unique emission symbol
 * Uses d3-drag for dragging, while preserving Framer Motion for initial animation.
 */
export default function EmissionNode({ id, label, symbol, x, y, onDrag, onRename }) {
    const nodeRef = useRef(null);

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(symbol);
    const inputRef = useRef(null);

    useEffect(() => { setDraft(symbol); }, [symbol]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const commitRename = () => {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== symbol && onRename) {
            onRename(id, trimmed);
        }
        setEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') commitRename();
        if (e.key === 'Escape') { setDraft(symbol); setEditing(false); }
        e.stopPropagation();
    };

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        if (!onRename) return;
        setDraft(symbol);
        setEditing(true);
    };

    useEffect(() => {
        if (!nodeRef.current || !onDrag || editing) return;
        const drag = d3.drag().on('drag', (event) => onDrag(id, event.x, event.y));
        d3.select(nodeRef.current).call(drag);
    }, [id, onDrag, editing]);

    return (
        <g
            transform={`translate(${x}, ${y})`}
            ref={nodeRef}
            style={{ cursor: editing ? 'text' : (onDrag ? 'grab' : 'default') }}
            onDoubleClick={handleDoubleClick}
        >
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
                    stroke={editing ? 'var(--accent-blue)' : 'var(--emission-node-stroke)'}
                    strokeWidth={editing ? 2.5 : 2}
                    strokeDasharray="6 4"
                />

                {/* Inline rename input (foreignObject) */}
                {editing ? (
                    <foreignObject x={-30} y={-18} width={60} height={36}>
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input
                                ref={inputRef}
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                onBlur={commitRename}
                                onKeyDown={handleKeyDown}
                                maxLength={8}
                                style={{
                                    width: '56px',
                                    textAlign: 'center',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    background: 'transparent',
                                    color: 'var(--emission-node-text)',
                                    border: 'none',
                                    borderBottom: '1.5px solid var(--accent-blue)',
                                    outline: 'none',
                                    padding: '2px 0',
                                    cursor: 'text',
                                }}
                            />
                        </div>
                    </foreignObject>
                ) : (
                    <text
                        textAnchor="middle"
                        dy="5"
                        fontFamily="var(--font-display)"
                        fontSize="22"
                        fill="var(--emission-node-text)"
                        fontWeight="700"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                        {symbol}
                    </text>
                )}
            </motion.g>
            <title>{label}</title>
        </g>
    );
}
