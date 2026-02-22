import React, { useState, useEffect } from 'react';

/**
 * Shows a polished fullscreen gate on portrait mobile,
 * asking the user to rotate to landscape.
 * Hidden entirely on desktop (viewport width >= 1024px).
 */
export default function RotateOverlay() {
    const [isPortraitMobile, setIsPortraitMobile] = useState(false);

    useEffect(() => {
        const check = () => {
            const isMobile = window.innerWidth < 1024;
            const isPortrait = window.innerHeight > window.innerWidth;
            setIsPortraitMobile(isMobile && isPortrait);
        };

        check();
        window.addEventListener('resize', check);
        window.addEventListener('orientationchange', check);
        return () => {
            window.removeEventListener('resize', check);
            window.removeEventListener('orientationchange', check);
        };
    }, []);

    if (!isPortraitMobile) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            padding: '32px',
        }}>
            {/* Animated rotate icon */}
            <div style={{ animation: 'rotatePulse 2s ease-in-out infinite' }}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Phone silhouette */}
                    <rect x="26" y="10" width="28" height="46" rx="5" stroke="#3b82f6" strokeWidth="3" fill="none" />
                    <circle cx="40" cy="50" r="3" fill="#3b82f6" />
                    {/* Rotate arrow */}
                    <path d="M12 40 A28 28 0 0 1 68 40" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="6 4" />
                    <polygon points="68,40 74,34 74,46" fill="#60a5fa" />
                </svg>
            </div>

            <div style={{ textAlign: 'center', color: '#f1f5f9' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, marginBottom: '10px', fontFamily: 'system-ui, sans-serif' }}>
                    Rotate your device
                </h2>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, maxWidth: '260px', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>
                    Baum-Welch Visualizer works best in <strong style={{ color: '#60a5fa' }}>landscape orientation</strong>. Please rotate your phone sideways to continue.
                </p>
            </div>

            {/* Decorative graph icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <circle cx="12" cy="5" r="2" />
                <circle cx="5" cy="19" r="2" />
                <circle cx="19" cy="19" r="2" />
                <line x1="12" y1="7" x2="5" y2="17" />
                <line x1="12" y1="7" x2="19" y2="17" />
                <line x1="5" y1="19" x2="19" y2="19" />
            </svg>

            <style>{`
                @keyframes rotatePulse {
                    0%   { transform: rotate(0deg) scale(1); }
                    25%  { transform: rotate(-15deg) scale(1.05); }
                    75%  { transform: rotate(15deg) scale(1.05); }
                    100% { transform: rotate(0deg) scale(1); }
                }
            `}</style>
        </div>
    );
}
