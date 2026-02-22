import React from 'react';
import { motion } from 'framer-motion';

/**
 * Edge component — smooth Bézier SVG paths with label halos
 */
export default function Edge({
    fromX, fromY, toX, toY,
    probability, type = 'transition',
    highlight, xiVal, onClick, isSelfLoop,
    edgeIndex = 0, totalEdges = 1,
    active = false,
}) {
    const colors = {
        transition: { normal: 'var(--edge-transition)', highlight: 'var(--accent-red)' },
        emission: { normal: 'var(--edge-emission)', highlight: 'var(--accent-red)' },
    };
    const c = colors[type] || colors.transition;
    const strokeColor = highlight ? c.highlight : c.normal;
    const strokeW = highlight ? 2.5 : (active ? 2 : 1.5);
    const NODE_R = 36;

    // Label halo helper — renders a semi-transparent background behind text
    const LabelHalo = ({ x, y, text, fill, fontWeight = '500', fontSize = '11' }) => {
        const textLen = String(text).length * 5.5 + 6;
        return (
            <g>
                <rect
                    x={x - textLen / 2}
                    y={y - 9}
                    width={textLen}
                    height={14}
                    rx={3}
                    fill="var(--label-halo-bg)"
                    opacity="0.85"
                />
                <text
                    x={x}
                    y={y + 2}
                    textAnchor="middle"
                    className="edge-label"
                    fill={fill || strokeColor}
                    fontWeight={fontWeight}
                    fontSize={fontSize}
                    style={{ pointerEvents: 'none' }}
                >
                    {text}
                </text>
            </g>
        );
    };

    // ── SELF-LOOP ──
    if (isSelfLoop) {
        const loopW = 22;
        const loopH = 45;
        const path = `M ${fromX - loopW} ${fromY - NODE_R}
            C ${fromX - loopW - 10} ${fromY - NODE_R - loopH},
              ${fromX + loopW + 10} ${fromY - NODE_R - loopH},
              ${fromX + loopW} ${fromY - NODE_R}`;

        const arrowTipX = fromX + loopW;
        const arrowTipY = fromY - NODE_R;

        return (
            <g>
                <motion.path
                    d={path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                />
                <polygon
                    points={`${arrowTipX},${arrowTipY} ${arrowTipX - 4},${arrowTipY - 8} ${arrowTipX + 4},${arrowTipY - 8}`}
                    fill={strokeColor}
                />
                {probability !== undefined && (
                    <LabelHalo
                        x={fromX}
                        y={fromY - NODE_R - loopH - 4}
                        text={fmt(probability)}
                        fontWeight={highlight ? '700' : '500'}
                    />
                )}
                {xiVal != null && (
                    <LabelHalo
                        x={fromX}
                        y={fromY - NODE_R - loopH + 12}
                        text={`ξ=${fmt(xiVal, 3)}`}
                        fill="var(--accent-red)"
                        fontWeight="600"
                        fontSize="9"
                    />
                )}
            </g>
        );
    }

    // ── TRANSITION EDGES ──
    if (type === 'transition') {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const startX = fromX + (dx / dist) * NODE_R;
        const startY = fromY + (dy / dist) * NODE_R;
        const endX = toX - (dx / dist) * NODE_R;
        const endY = toY - (dy / dist) * NODE_R;

        const baseCurve = 40 + edgeIndex * 30;
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2 - baseCurve;

        const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

        const arrowAngle = Math.atan2(endY - midY, endX - midX);
        const arrowLen = 8;
        const arrow = [
            [endX, endY],
            [endX - arrowLen * Math.cos(arrowAngle - 0.35), endY - arrowLen * Math.sin(arrowAngle - 0.35)],
            [endX - arrowLen * Math.cos(arrowAngle + 0.35), endY - arrowLen * Math.sin(arrowAngle + 0.35)],
        ];

        const labelX = midX;
        const labelY = midY - 6;

        return (
            <g>
                <motion.path
                    d={path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />
                <polygon points={arrow.map(p => p.join(',')).join(' ')} fill={strokeColor} />

                {probability !== undefined && (
                    <LabelHalo
                        x={labelX}
                        y={labelY}
                        fontWeight={highlight ? '700' : '500'}
                        text={fmt(probability)}
                    />
                )}

                {xiVal != null && (
                    <LabelHalo
                        x={labelX}
                        y={labelY + 18}
                        text={`ξ=${fmt(xiVal, 3)}`}
                        fill="var(--accent-red)"
                        fontWeight="600"
                        fontSize="9"
                    />
                )}
            </g>
        );
    }

    // ── EMISSION EDGES ──
    {
        const rectH = 22;
        const startX = fromX;
        const startY = fromY + NODE_R;
        const endX = toX;
        const endY = toY - rectH;

        const vertMid = (startY + endY) / 2;
        const ctrl1X = startX;
        const ctrl1Y = vertMid;
        const ctrl2X = endX;
        const ctrl2Y = vertMid;

        const path = `M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`;

        const arrowLen = 7;
        const arrowAngle = Math.atan2(endY - ctrl2Y, endX - ctrl2X);
        const arrow = [
            [endX, endY],
            [endX - arrowLen * Math.cos(arrowAngle - 0.4), endY - arrowLen * Math.sin(arrowAngle - 0.4)],
            [endX - arrowLen * Math.cos(arrowAngle + 0.4), endY - arrowLen * Math.sin(arrowAngle + 0.4)],
        ];

        const labelX = (startX + endX) / 2;
        const labelY = vertMid;
        const labelOffset = (endX > startX) ? 12 : (endX < startX) ? -12 : 0;

        return (
            <g>
                <motion.path
                    d={path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    strokeDasharray="6 3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />
                <polygon points={arrow.map(p => p.join(',')).join(' ')} fill={strokeColor} />

                {probability !== undefined && probability >= 0.05 && (
                    <LabelHalo
                        x={labelX + labelOffset}
                        y={labelY}
                        text={fmt(probability)}
                        fontWeight={highlight ? '700' : '500'}
                    />
                )}
            </g>
        );
    }
}

function fmt(val, decimals = 2) {
    if (val === undefined || val === null) return '?';
    if (typeof val !== 'number') return String(val);
    if (isNaN(val)) return 'NaN';
    return val.toFixed(decimals);
}
