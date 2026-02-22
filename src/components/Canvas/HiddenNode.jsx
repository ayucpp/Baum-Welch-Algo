import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Hidden state node — circle in the top row
 * Double-click the label to rename inline.
 */
export default function HiddenNode({ id, label, x, y, onDrag, onRename, highlight, alphaVal, betaVal, gammaVal }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(label);
    const inputRef = useRef(null);

    // Sync draft if label changes externally
    useEffect(() => { setDraft(label); }, [label]);

    // Focus the foreign-object input when editing starts
    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const commitRename = () => {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== label && onRename) {
            onRename(id, trimmed);
        }
        setEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') commitRename();
        if (e.key === 'Escape') { setDraft(label); setEditing(false); }
        e.stopPropagation();
    };

    const handleMouseDown = (e) => {
        if (editing) return; // Let the foreign-object handle events  
        e.stopPropagation();
        const svg = e.target.closest('svg');
        if (!svg) return;

        const handleMouseMove = (e2) => {
            const pt = svg.createSVGPoint();
            pt.x = e2.clientX;
            pt.y = e2.clientY;
            const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
            onDrag(id, svgPt.x, svgPt.y);
        };
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        if (!onRename) return; // Disable during algo mode
        setDraft(label);
        setEditing(true);
    };

    return (
        <g
            transform={`translate(${x}, ${y})`}
            style={{ cursor: editing ? 'default' : 'grab' }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
                {/* Circle */}
                <circle
                    r={36}
                    fill={
                        highlight === 'forward' ? 'var(--node-forward-fill)' :
                            highlight === 'backward' ? 'var(--node-backward-fill)' :
                                highlight === 'gamma' ? 'var(--node-gamma-fill)' :
                                    'var(--hidden-node-fill)'
                    }
                    stroke={editing ? 'var(--accent-blue)' : 'var(--hidden-node-stroke)'}
                    strokeWidth={editing ? 2.5 : 2}
                    strokeDasharray="6 4"
                />

                {/* Inline rename input (foreignObject so we get real HTML <input>) */}
                {editing ? (
                    <foreignObject x={-34} y={-18} width={68} height={36}>
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input
                                ref={inputRef}
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                onBlur={commitRename}
                                onKeyDown={handleKeyDown}
                                maxLength={8}
                                style={{
                                    width: '60px',
                                    textAlign: 'center',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    background: 'var(--bg-panel)',
                                    color: 'var(--text-primary)',
                                    border: 'none',
                                    borderBottom: '1.5px solid var(--accent-blue)',
                                    outline: 'none',
                                    borderRadius: '0',
                                    padding: '2px 0',
                                    cursor: 'text',
                                }}
                            />
                        </div>
                    </foreignObject>
                ) : (
                    <text
                        textAnchor="middle"
                        dy="-2"
                        fontFamily="var(--font-display)"
                        fontSize="18"
                        fill="var(--hidden-node-text)"
                        fontWeight="700"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                        {label}
                    </text>
                )}

                {/* Algorithm values */}
                {alphaVal != null && (
                    <text textAnchor="middle" dy="16" fontFamily="var(--font-ui)" fontSize="10"
                        fill="var(--accent-blue)" fontWeight="600" style={{ pointerEvents: 'none' }}>
                        α={typeof alphaVal === 'number' ? alphaVal.toFixed(3) : alphaVal}
                    </text>
                )}
                {betaVal != null && (
                    <text textAnchor="middle" dy="28" fontFamily="var(--font-ui)" fontSize="10"
                        fill="var(--accent-orange)" fontWeight="600" style={{ pointerEvents: 'none' }}>
                        β={typeof betaVal === 'number' ? betaVal.toFixed(3) : betaVal}
                    </text>
                )}
                {gammaVal != null && (
                    <text textAnchor="middle"
                        dy={alphaVal != null ? '40' : '16'}
                        fontFamily="var(--font-ui)" fontSize="10"
                        fill="var(--accent-green)" fontWeight="700" style={{ pointerEvents: 'none' }}>
                        γ={typeof gammaVal === 'number' ? gammaVal.toFixed(3) : gammaVal}
                    </text>
                )}
            </motion.g>
            <title>{label}</title>
        </g>
    );
}
