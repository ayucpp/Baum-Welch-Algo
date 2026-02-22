import React, { useState, useId } from 'react';
import { motion } from 'framer-motion';

/**
 * Edge component — smooth Bézier SVG paths with label halos.
 *
 * Hover glow is controlled by the parent Canvas via a single-slot
 * `hoveredEdgeId` — only one edge can ever glow at once, eliminating
 * the spurious multi-edge glow caused by React re-render mouse events.
 *
 * `isHovered`     – parent tells this edge it is the hovered one
 * `onEdgeHover`   – call when mouse enters (passes edgeId up)
 * `onEdgeHoverEnd`– call when mouse leaves (passes edgeId up)
 *
 * `selected` (yellow glow) is still local state, toggled on click.
 */
export default function Edge({
    fromX, fromY, toX, toY,
    probability, type = 'transition',
    highlight, xiVal, onClick, isSelfLoop,
    edgeIndex = 0, totalEdges = 1,
    active = false,
    // Parent-controlled hover
    edgeId, isHovered = false, onEdgeHover, onEdgeHoverEnd,
}) {
    const [selected, setSelected] = useState(false);
    const uid = useId().replace(/:/g, '_');

    const colors = {
        transition: { normal: 'var(--edge-transition)', highlight: 'var(--accent-red)' },
        emission: { normal: 'var(--edge-emission)', highlight: 'var(--accent-red)' },
    };
    const c = colors[type] || colors.transition;

    const baseColor = highlight ? c.highlight : c.normal;
    const glowColor = selected ? '#facc15' : baseColor;
    const strokeColor = (isHovered || selected) ? glowColor : baseColor;
    const strokeW = selected ? 3 : isHovered ? 2.5 : active ? 2 : 1.5;
    const glowBlur = selected ? 7 : 4;
    const showGlow = isHovered || selected;

    const handleClick = (e) => { e.stopPropagation(); setSelected(v => !v); onClick?.(); };
    const handleEnter = () => onEdgeHover?.(edgeId);
    const handleLeave = () => onEdgeHoverEnd?.(edgeId);

    const NODE_R = 36;

    // Glow filter on non-interactive inner group so its enlarged bbox
    // never steals mouse events from the outer wrapper.
    const GlowFilter = () => (
        <defs>
            <filter id={`ef_${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={glowBlur} result="blur" />
                <feFlood
                    floodColor={selected ? '#facc15' : type === 'transition' ? '#60a5fa' : '#f59e0b'}
                    floodOpacity={selected ? 0.85 : 0.65}
                    result="color"
                />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    );

    // Wide invisible stroke — the only interactive surface
    const HitPath = ({ d }) => (
        <path d={d} fill="none" stroke="transparent" strokeWidth={20}
            style={{ cursor: 'pointer' }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onClick={handleClick}
        />
    );

    const LabelHalo = ({ x, y, text, fill, fontWeight = '500', fontSize = '11' }) => {
        const textLen = String(text).length * 5.5 + 6;
        const textColor = selected ? '#facc15' : (fill || strokeColor);
        return (
            <g style={{ pointerEvents: 'none' }}>
                <rect x={x - textLen / 2} y={y - 9} width={textLen} height={14} rx={3}
                    fill="var(--label-halo-bg)" opacity="0.9" />
                <text x={x} y={y + 2} textAnchor="middle" className="edge-label"
                    fill={textColor}
                    fontWeight={isHovered || selected ? '700' : fontWeight}
                    fontSize={fontSize}>
                    {text}
                </text>
            </g>
        );
    };

    // ── SELF-LOOP ──
    if (isSelfLoop) {
        const loopW = 22, loopH = 45;
        const path = `M ${fromX - loopW} ${fromY - NODE_R}
            C ${fromX - loopW - 10} ${fromY - NODE_R - loopH},
              ${fromX + loopW + 10} ${fromY - NODE_R - loopH},
              ${fromX + loopW} ${fromY - NODE_R}`;
        const arrowTipX = fromX + loopW, arrowTipY = fromY - NODE_R;

        return (
            <g>
                {showGlow && <GlowFilter />}
                <g filter={showGlow ? `url(#ef_${uid})` : 'none'} style={{ pointerEvents: 'none' }}>
                    <motion.path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeW} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
                    <polygon
                        points={`${arrowTipX},${arrowTipY} ${arrowTipX - 4},${arrowTipY - 8} ${arrowTipX + 4},${arrowTipY - 8}`}
                        fill={strokeColor} />
                </g>
                {probability !== undefined && (
                    <LabelHalo x={fromX} y={fromY - NODE_R - loopH - 4} text={fmt(probability)} />
                )}
                {xiVal != null && (
                    <LabelHalo x={fromX} y={fromY - NODE_R - loopH + 12}
                        text={`ξ=${fmt(xiVal, 3)}`} fill="var(--accent-red)" fontWeight="600" fontSize="9" />
                )}
                <HitPath d={path} />
            </g>
        );
    }

    // ── TRANSITION EDGES ──
    if (type === 'transition') {
        const dx = toX - fromX, dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const startX = fromX + (dx / dist) * NODE_R, startY = fromY + (dy / dist) * NODE_R;
        const endX = toX - (dx / dist) * NODE_R, endY = toY - (dy / dist) * NODE_R;

        const baseCurve = 40 + edgeIndex * 30;
        const midX = (startX + endX) / 2, midY = (startY + endY) / 2 - baseCurve;
        const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

        const arrowAngle = Math.atan2(endY - midY, endX - midX);
        const arrowLen = 8;
        const arrow = [
            [endX, endY],
            [endX - arrowLen * Math.cos(arrowAngle - 0.35), endY - arrowLen * Math.sin(arrowAngle - 0.35)],
            [endX - arrowLen * Math.cos(arrowAngle + 0.35), endY - arrowLen * Math.sin(arrowAngle + 0.35)],
        ];

        // Quadratic Bézier midpoint t=0.5
        const bezMidX = 0.25 * startX + 0.5 * midX + 0.25 * endX;
        const bezMidY = 0.25 * startY + 0.5 * midY + 0.25 * endY;
        const tangX = endX - startX, tangY = endY - startY;
        const tangLen = Math.sqrt(tangX * tangX + tangY * tangY) || 1;
        const labelX = bezMidX + (-tangY / tangLen) * 10;
        const labelY = bezMidY + (tangX / tangLen) * 10;

        return (
            <g>
                {showGlow && <GlowFilter />}
                <g filter={showGlow ? `url(#ef_${uid})` : 'none'} style={{ pointerEvents: 'none' }}>
                    <motion.path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeW} strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5 }} />
                    <polygon points={arrow.map(p => p.join(',')).join(' ')} fill={strokeColor} />
                </g>
                {probability !== undefined && (
                    <LabelHalo x={labelX} y={labelY} text={fmt(probability)} />
                )}
                {xiVal != null && (
                    <LabelHalo x={labelX} y={labelY + 14}
                        text={`ξ=${fmt(xiVal, 3)}`} fill="var(--accent-red)" fontWeight="600" fontSize="9" />
                )}
                <HitPath d={path} />
            </g>
        );
    }

    // ── EMISSION EDGES ──
    {
        const rectH = 22;
        const startX = fromX, startY = fromY + NODE_R;
        const endX = toX, endY = toY - rectH;
        const vertMid = (startY + endY) / 2;
        const ctrl1X = startX, ctrl1Y = vertMid;
        const ctrl2X = endX, ctrl2Y = vertMid;
        const path = `M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`;

        const arrowLen = 7;
        const arrowAngle = Math.atan2(endY - ctrl2Y, endX - ctrl2X);
        const arrow = [
            [endX, endY],
            [endX - arrowLen * Math.cos(arrowAngle - 0.4), endY - arrowLen * Math.sin(arrowAngle - 0.4)],
            [endX - arrowLen * Math.cos(arrowAngle + 0.4), endY - arrowLen * Math.sin(arrowAngle + 0.4)],
        ];

        // Cubic Bézier midpoint t=0.5
        const bezMidX = 0.125 * startX + 0.375 * ctrl1X + 0.375 * ctrl2X + 0.125 * endX;
        const bezMidY = 0.125 * startY + 0.375 * ctrl1Y + 0.375 * ctrl2Y + 0.125 * endY;
        const tTangX = ctrl2X - ctrl1X, tTangY = ctrl2Y - ctrl1Y;
        const tLen = Math.sqrt(tTangX * tTangX + tTangY * tTangY) || 1;
        const labelX = bezMidX + (-tTangY / tLen) * 10;
        const labelY = bezMidY + (tTangX / tLen) * 10;

        return (
            <g>
                {showGlow && <GlowFilter />}
                <g filter={showGlow ? `url(#ef_${uid})` : 'none'} style={{ pointerEvents: 'none' }}>
                    <motion.path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeW}
                        strokeDasharray="6 3" strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5 }} />
                    <polygon points={arrow.map(p => p.join(',')).join(' ')} fill={strokeColor} />
                </g>
                {probability !== undefined && probability >= 0.05 && (
                    <LabelHalo x={labelX} y={labelY} text={fmt(probability)} />
                )}
                <HitPath d={path} />
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
