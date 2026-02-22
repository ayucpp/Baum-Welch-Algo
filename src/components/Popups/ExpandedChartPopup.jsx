import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';

export default function ExpandedChartPopup({ logLikelihoods, onClose }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || logLikelihoods.length < 2) return;

        const w = containerRef.current.clientWidth - 40;
        const h = containerRef.current.clientHeight - 80;
        const padX = 70;
        const padY = 60;

        const filtered = logLikelihoods.filter(v => isFinite(v) && !isNaN(v));
        if (filtered.length < 2) return;

        const min = Math.min(...filtered);
        const max = Math.max(...filtered);
        const range = max - min || 1;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous

        svg.attr("width", w).attr("height", h);

        const xScale = d3.scaleLinear()
            .domain([0, filtered.length - 1])
            .range([padX, w - padX]);

        const yScale = d3.scaleLinear()
            .domain([min, max])
            .range([h - padY, padY]); // SVG coordinates: y=0 is top

        // Axes
        const xAxis = d3.axisBottom(xScale).ticks(10);
        const yAxis = d3.axisLeft(yScale).ticks(10).tickFormat(d3.format(".2f"));

        // Create a root group for zooming
        const g = svg.append("g");

        // Add axes to outer SVG (not zoomable) or inner G (zoomable).
        // For standard charts, axes stay fixed while content zooms, but here we'll zoom the whole thing for simplicity,
        // or just the line. Let's make axes fixed and content zoomable.

        // Define clip path
        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", w - 2 * padX)
            .attr("height", h - 2 * padY)
            .attr("x", padX)
            .attr("y", padY);

        const content = g.append("g").attr("clip-path", "url(#clip)");

        // Line generator
        const line = d3.line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d));

        // Draw line
        const pathLine = content.append("path")
            .datum(filtered)
            .attr("fill", "none")
            .attr("stroke", "var(--accent-blue)")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Draw dots
        const dots = content.selectAll("circle")
            .data(filtered)
            .enter()
            .append("circle")
            .attr("cx", (d, i) => xScale(i))
            .attr("cy", d => yScale(d))
            .attr("r", 4)
            .attr("fill", "var(--accent-blue)");

        // Draw axes last so they are on top of the clipped area
        const xAxisG = svg.append("g")
            .attr("transform", `translate(0, ${h - padY})`)
            .attr("class", "chart-axis")
            .call(xAxis);

        const yAxisG = svg.append("g")
            .attr("transform", `translate(${padX}, 0)`)
            .attr("class", "chart-axis")
            .call(yAxis);

        // Add explicit axis labels
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", w / 2)
            .attr("y", h - padY / 3)
            .attr("fill", "var(--text-secondary)")
            .text("Iteration");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", padX / 3)
            .attr("x", -h / 2)
            .attr("fill", "var(--text-secondary)")
            .text("Log-Likelihood");

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 10]) // Zoom up to 10x
            .translateExtent([[padX, padY], [w - padX, h - padY]])
            .extent([[padX, padY], [w - padX, h - padY]])
            .on("zoom", (event) => {
                // Rescale X and Y
                const newXScale = event.transform.rescaleX(xScale);
                const newYScale = event.transform.rescaleY(yScale);

                // Update axes
                xAxisG.call(xAxis.scale(newXScale));
                yAxisG.call(yAxis.scale(newYScale));

                // Update line and dots
                pathLine.attr("d", line.x((d, i) => newXScale(i)).y(d => newYScale(d)));
                dots.attr("cx", (d, i) => newXScale(i)).attr("cy", d => newYScale(d));
            });

        svg.call(zoom);

    }, [logLikelihoods]);

    return (
        <AnimatePresence>
            <motion.div
                className="popup-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ zIndex: 9999 }}
            >
                <motion.div
                    className="popup-card"
                    style={{ width: '80vw', height: '80vh', maxWidth: '1000px', display: 'flex', flexDirection: 'column' }}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    ref={containerRef}
                >
                    <div className="popup-header">
                        <h2>📈 Expanded Log-Likelihood Chart</h2>
                        <button className="popup-close-btn" onClick={onClose} title="Close">✕</button>
                    </div>

                    <div className="popup-body" style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                            Scroll to zoom. Click and drag to pan.
                        </p>
                        <svg ref={svgRef} className="expanded-chart-svg" style={{ display: 'block' }}></svg>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
