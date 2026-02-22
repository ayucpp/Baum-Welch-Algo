import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MiniLineChart — polished, responsive SVG line chart.
 *
 * Features:
 *   - viewBox-based scaling: fills 100% container width
 *   - Clearly labelled X axis (xLabel) and Y axis (yLabel) with tick values
 *   - Per-dot hover tooltip showing (Iteration N, value)
 *   - Final (converged) dot glows white when showGlowDot=true
 *   - Built-in ⊕ Expand button → full-screen modal via AnimatePresence
 *   - Realtime: re-renders whenever `data` prop changes
 */
export default function MiniLineChart({
    data = [],
    color = 'var(--accent-blue)',
    title = '',
    xLabel = 'Iteration',
    yLabel = 'Value',
    height = 120,
    showGlowDot = false,
    asymptoteDesc = '',
}) {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const filtered = data.filter(v => isFinite(v) && !isNaN(v));
    if (filtered.length < 2) return null;

    return (
        <>
            {/* Compact sidebar chart */}
            <div style={{ width: '100%' }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {title}
                    </span>
                    <button
                        onClick={() => setExpanded(true)}
                        title="Expand chart"
                        style={{
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            borderRadius: 4,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '1px 7px',
                            fontSize: '11px',
                            lineHeight: 1.6,
                        }}
                    >
                        ⊕
                    </button>
                </div>

                <ChartSVG
                    filtered={filtered}
                    color={color}
                    xLabel={xLabel}
                    yLabel={yLabel}
                    vw={540} vh={height} pad={40} padLeft={52}
                    showGlowDot={showGlowDot}
                    asymptoteDesc={asymptoteDesc}
                    hoveredIdx={hoveredIdx}
                    setHoveredIdx={setHoveredIdx}
                    dotR={3.5}
                    fontSize={8}
                />
            </div>

            {/* Expanded full-screen modal */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setExpanded(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9000,
                            background: 'rgba(0,0,0,0.75)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 12,
                                padding: '20px 24px',
                                width: 'min(90vw, 780px)',
                                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                            }}
                        >
                            {/* Modal header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>{title}</h3>
                                <button
                                    onClick={() => setExpanded(false)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--text-secondary)', cursor: 'pointer',
                                        fontSize: 20, lineHeight: 1,
                                    }}
                                >✕</button>
                            </div>

                            <ChartSVG
                                filtered={filtered}
                                color={color}
                                xLabel={xLabel}
                                yLabel={yLabel}
                                vw={700} vh={260} pad={50} padLeft={64}
                                showGlowDot={showGlowDot}
                                asymptoteDesc={asymptoteDesc}
                                hoveredIdx={hoveredIdx}
                                setHoveredIdx={setHoveredIdx}
                                dotR={5}
                                fontSize={10}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * Pure SVG chart — shared between compact and expanded views.
 */
function ChartSVG({
    filtered, color,
    xLabel, yLabel,
    vw, vh, pad, padLeft,
    showGlowDot, asymptoteDesc,
    hoveredIdx, setHoveredIdx,
    dotR, fontSize,
}) {
    const min = Math.min(...filtered);
    const max = Math.max(...filtered);
    const range = max - min || 1;
    const uid = color.replace(/[^a-z0-9]/gi, '').slice(0, 8) + vw; // stable key per config

    const toX = i => padLeft + (i / (filtered.length - 1)) * (vw - padLeft - pad);
    const toY = val => vh - pad - ((val - min) / range) * (vh - 2 * pad);

    const points = filtered.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
    const areaPoints = `${padLeft},${vh - pad} ${points} ${toX(filtered.length - 1)},${vh - pad}`;
    const gradId = `mlcg_${uid}`;
    const glowId = `mlcgl_${uid}`;

    // Y-axis ticks (5 evenly spaced)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
        val: min + f * range,
        y: toY(min + f * range),
    }));

    // X-axis ticks (up to 8)
    const xTickCount = Math.min(filtered.length - 1, 7);
    const xTicks = Array.from({ length: xTickCount + 1 }, (_, k) => {
        const i = Math.round(k * (filtered.length - 1) / xTickCount);
        return { i, x: toX(i) };
    });

    // Tooltip geometry
    const tipW = 148, tipH = 40;
    const tipPos = (i) => {
        const cx = toX(i), cy = toY(filtered[i]);
        let tx = cx - tipW / 2;
        if (tx < padLeft) tx = padLeft;
        if (tx + tipW > vw - pad) tx = vw - pad - tipW;
        const ty = cy - tipH - 10 < pad ? cy + 12 : cy - tipH - 10;
        return { tx, ty, cx, cy };
    };

    const finalIdx = filtered.length - 1;

    return (
        <svg
            viewBox={`0 0 ${vw} ${vh}`}
            width="100%"
            height={vh}
            style={{ display: 'block', overflow: 'visible' }}
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
                {showGlowDot && (
                    <filter id={glowId} x="-150%" y="-150%" width="400%" height="400%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feFlood floodColor="#ffffff" floodOpacity="0.9" result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                )}
            </defs>

            {/* ── Y-axis grid lines + tick labels ── */}
            {yTicks.map(({ val, y }, k) => (
                <g key={k}>
                    <line x1={padLeft} y1={y} x2={vw - pad} y2={y}
                        stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 2" opacity="0.45" />
                    <text x={padLeft - 6} y={y + fontSize * 0.38}
                        textAnchor="end" fontSize={fontSize} fill="var(--text-secondary)">
                        {Math.abs(val) >= 1000 || (Math.abs(val) < 0.01 && val !== 0)
                            ? val.toExponential(1)
                            : val.toFixed(2)}
                    </text>
                </g>
            ))}

            {/* ── X-axis ticks + labels ── */}
            {xTicks.map(({ i, x }) => (
                <g key={i}>
                    <line x1={x} y1={vh - pad} x2={x} y2={vh - pad + 4}
                        stroke="var(--text-muted)" strokeWidth="0.8" />
                    <text x={x} y={vh - pad + 4 + fontSize + 2}
                        textAnchor="middle" fontSize={fontSize} fill="var(--text-secondary)">
                        {i + 1}
                    </text>
                </g>
            ))}

            {/* ── Axes ── */}
            <line x1={padLeft} y1={vh - pad} x2={vw - pad} y2={vh - pad} stroke="var(--text-muted)" strokeWidth="1" />
            <line x1={padLeft} y1={pad} x2={padLeft} y2={vh - pad} stroke="var(--text-muted)" strokeWidth="1" />

            {/* ── Axis labels ── */}
            {/* X label */}
            <text
                x={(padLeft + vw - pad) / 2} y={vh - 2}
                textAnchor="middle" fontSize={fontSize + 1} fill="var(--text-muted)" fontWeight="500"
            >
                {xLabel}
            </text>
            {/* Y label — rotated */}
            <text
                transform={`translate(${fontSize}, ${(pad + vh - pad) / 2}) rotate(-90)`}
                textAnchor="middle" fontSize={fontSize + 1} fill="var(--text-muted)" fontWeight="500"
            >
                {yLabel}
            </text>

            {/* ── Area + line ── */}
            <polygon points={areaPoints} fill={`url(#${gradId})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

            {/* ── Dots + hover targets ── */}
            {filtered.map((val, i) => {
                const cx = toX(i), cy = toY(val);
                const isLast = i === finalIdx;
                const isHov = hoveredIdx === i;
                const r = isLast && showGlowDot ? dotR + 2 : isHov ? dotR + 1.5 : dotR;
                const fill = isLast && showGlowDot ? 'white' : (isHov ? 'white' : color);
                const filter = isLast && showGlowDot ? `url(#${glowId})` : 'none';

                return (
                    <g key={i}>
                        {/* Wide transparent hover region */}
                        <circle cx={cx} cy={cy} r={10}
                            fill="transparent"
                            style={{ cursor: 'crosshair' }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                        />
                        {/* Visible dot */}
                        <circle cx={cx} cy={cy} r={r}
                            fill={fill} filter={filter}
                            style={{ pointerEvents: 'none' }}
                        />
                        {/* Inner colour for glow dot */}
                        {isLast && showGlowDot && (
                            <circle cx={cx} cy={cy} r={r - 2} fill={color} style={{ pointerEvents: 'none' }} />
                        )}
                    </g>
                );
            })}

            {/* ── Hover tooltip ── */}
            {hoveredIdx !== null && (() => {
                const val = filtered[hoveredIdx];
                const { tx, ty } = tipPos(hoveredIdx);
                const isLast = hoveredIdx === finalIdx;
                const fmtVal = Math.abs(val) >= 1000 || (Math.abs(val) < 0.01 && val !== 0)
                    ? val.toExponential(3)
                    : val.toFixed(4);
                return (
                    <g style={{ pointerEvents: 'none' }}>
                        {/* Connector */}
                        <line x1={toX(hoveredIdx)} y1={toY(val)} x2={tx + tipW / 2} y2={ty + tipH}
                            stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                        {/* Box */}
                        <rect x={tx} y={ty} width={tipW} height={tipH} rx={5}
                            fill="#0f172a" stroke="rgba(255,255,255,0.12)" strokeWidth="1" opacity="0.97" />
                        {/* Iter label */}
                        <text x={tx + tipW / 2} y={ty + fontSize + 3}
                            textAnchor="middle" fontSize={fontSize} fill="rgba(255,255,255,0.5)" fontStyle="italic">
                            Iteration {hoveredIdx + 1}
                        </text>
                        {/* (x, y) value */}
                        <text x={tx + tipW / 2} y={ty + fontSize * 2 + 8}
                            textAnchor="middle" fontSize={fontSize + 1.5} fill="white" fontWeight="700">
                            ({hoveredIdx + 1},  {fmtVal})
                        </text>
                        {/* Asymptote note on final dot */}
                        {isLast && showGlowDot && asymptoteDesc && (
                            <>
                                <rect x={tx - 10} y={ty + tipH + 4} width={tipW + 20} height={fontSize + 8} rx={3}
                                    fill="#0f172a" stroke="rgba(255,255,255,0.07)" strokeWidth="1" opacity="0.94" />
                                <text x={tx + tipW / 2} y={ty + tipH + fontSize + 8}
                                    textAnchor="middle" fontSize={fontSize - 0.5} fill="rgba(255,255,255,0.6)">
                                    {asymptoteDesc.slice(0, 60)}
                                </text>
                            </>
                        )}
                    </g>
                );
            })()}
        </svg>
    );
}
