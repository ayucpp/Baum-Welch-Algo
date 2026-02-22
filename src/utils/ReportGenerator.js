import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a comprehensive PDF report of the current HMM state.
 * 
 * @param {Object} convergenceData - Results from the algorithm engine
 * @param {Array} hiddenStates - List of hidden states
 * @param {Array} symbols - List of emission symbols
 */
export async function generateReport(convergenceData, hiddenStates, symbols) {
    if (!convergenceData) return;

    try {
        // 1. Setup PDF document (A4 Landscape)
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1200, 800]
        });

        // Background color logic to match dark/light theme
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const bgColor = isDarkMode ? '#1e293b' : '#f8fafc';
        const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';

        pdf.setFillColor(bgColor);
        pdf.rect(0, 0, 1200, 800, 'F');
        pdf.setTextColor(textColor);

        // Header
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Baum-Welch Visualizer Report', 40, 50);

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, 40, 75);

        // Summary Stats
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Algorithm Convergence Results:', 40, 110);

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Iterations: ${convergenceData.totalIterations}`, 50, 135);
        pdf.text(`Final Log-Likelihood: ${convergenceData.finalLogLik?.toFixed(6)}`, 50, 155);
        pdf.text(`Status: ${convergenceData.converged ? 'Converged Successfully' : 'Hit Max Iterations'}`, 50, 175);

        // 2. Capture the Canvas SVG
        const canvasWrapper = document.querySelector('.canvas-wrapper');
        if (canvasWrapper) {
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('HMM Graph Structure:', 40, 220);

            const canvasImage = await html2canvas(canvasWrapper, {
                backgroundColor: bgColor,
                scale: 1, // Fix Out Of Memory crashes completely
                onclone: (doc) => {
                    // Hide SVG patterns that cause html2canvas infinite loops
                    const grid = doc.querySelector('rect[fill="url(#grid)"]');
                    if (grid) grid.style.display = 'none';
                }
            });
            const imgData = canvasImage.toDataURL('image/png');

            // Calculate aspect ratio fit
            const imgW = 600;
            const imgH = (canvasImage.height * imgW) / canvasImage.width;
            pdf.addImage(imgData, 'PNG', 40, 240, imgW, imgH);
        }

        // 3. New Page for Matrices & Chart
        pdf.addPage();
        pdf.setFillColor(bgColor);
        pdf.rect(0, 0, 1200, 800, 'F');
        pdf.setTextColor(textColor);

        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Final Parameters', 40, 50);

        // Helper to draw a matrix
        let currentY = 80;
        const hiddenLabels = hiddenStates.map(s => s.label);

        const drawMatrix = (matrix, title, rowLabels, colLabels, startX, startY) => {
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, startX, startY);

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');

            const cellW = 80;
            const cellH = 25;
            let cy = startY + 20;

            // Column Headers
            colLabels.forEach((label, j) => {
                pdf.text(label.toString(), startX + cellW + (j * cellW) + 10, cy + 15);
            });
            cy += cellH;

            // Rows
            matrix.forEach((row, i) => {
                pdf.setFont('helvetica', 'bold');
                pdf.text(rowLabels[i], startX + 10, cy + 15);
                pdf.setFont('helvetica', 'normal');

                row.forEach((val, j) => {
                    const str = typeof val === 'number' ? val.toFixed(3) : val;
                    pdf.text(str, startX + cellW + (j * cellW) + 10, cy + 15);
                });
                cy += cellH;
            });
            return cy + 20;
        };

        const afterA = drawMatrix(convergenceData.transitionMatrix, 'Transition Matrix (A)', hiddenLabels, hiddenLabels, 40, currentY);
        const afterB = drawMatrix(convergenceData.emissionMatrix, 'Emission Matrix (B)', hiddenLabels, symbols, 40, afterA + 30);

        // Try to capture the mini-chart from the right panel if visible
        const chartNode = document.querySelector('.convergence-chart .chart-svg');
        if (chartNode) {
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Log-Likelihood Timeline:', 600, 80);

            // We use XMLSerializer to safely convert the raw SVG to an image via a blob
            const svgData = new XMLSerializer().serializeToString(chartNode);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create a temporary image to draw the SVG natively onto the PDF
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise((resolve) => {
                img.onload = () => {
                    try {
                        pdf.addImage(img, 'PNG', 600, 100, 500, 250);
                    } catch (err) {
                        console.error("jsPDF failed to draw SVG image:", err);
                    }
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.onerror = (e) => {
                    console.error("Failed to load SVG into PDF image:", e);
                    URL.revokeObjectURL(url);
                    resolve(); // Resolve anyway to not block the whole report
                };
                img.src = url;
            });
        }

        // 4. Robust Blob Save (Bypasses silent download fails via explicit DOM anchor)
        const blob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = 'baum-welch-report.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pdfUrl);

    } catch (error) {
        console.error("Failed to generate report:", error);
        alert("There was an error generating the PDF report. Please try again.");
    }
}
