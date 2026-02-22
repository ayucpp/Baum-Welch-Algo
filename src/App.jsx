import React, { useCallback, useEffect, useState } from 'react';
import { useHMMState } from './hooks/useHMMState.js';
import { useAlgorithm } from './hooks/useAlgorithm.js';
import Canvas from './components/Canvas/Canvas.jsx';
import LeftPanel from './components/Panels/LeftPanel.jsx';
import RightPanel from './components/Panels/RightPanel.jsx';
import ControlBar from './components/Controls/ControlBar.jsx';
import Jerome from './components/Jerome/Jerome.jsx';
import ResultsPopup from './components/Popups/ResultsPopup.jsx';
import RotateOverlay from './components/RotateOverlay.jsx';

/**
 * Main Application Shell
 */
export default function App() {
  const hmmState = useHMMState();
  const algorithmState = useAlgorithm(hmmState);

  // Apply dark mode to html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', hmmState.darkMode ? 'dark' : 'light');
  }, [hmmState.darkMode]);

  const handleStart = useCallback(() => {
    if (hmmState.hiddenStates.length === 0) {
      alert('Please add at least one hidden state first!');
      return;
    }
    if (hmmState.emissionNodes.length === 0) {
      alert('Please generate emission nodes first!');
      return;
    }
    algorithmState.startAlgorithm();
  }, [hmmState.hiddenStates, hmmState.emissionNodes, algorithmState]);

  const handleReset = useCallback(() => {
    algorithmState.resetAlgorithm();
  }, [algorithmState]);

  const handleClosePopup = useCallback(() => {
    hmmState.setShowResultsPopup(false);
  }, [hmmState]);

  const handleOpenPopup = useCallback(() => {
    hmmState.setShowResultsPopup(true);
  }, [hmmState]);

  return (
    <div className="app-container">
      <RotateOverlay />
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="title-icon">
              {/* Neural network / graph icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2" />
                <circle cx="5" cy="19" r="2" />
                <circle cx="19" cy="19" r="2" />
                <line x1="12" y1="7" x2="5" y2="17" />
                <line x1="12" y1="7" x2="19" y2="17" />
                <line x1="5" y1="19" x2="19" y2="19" />
              </svg>
            </span>
            Baum-Welch Visualizer
          </h1>
          <span className="app-subtitle">Interactive HMM Learning Platform</span>
        </div>
        <div className="header-right">
          {/* Results Info button — visible after first convergence */}
          {hmmState.hasConvergedOnce && (
            <button
              className="btn-info-toggle"
              onClick={handleOpenPopup}
              title="View Algorithm Results"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            className="btn-theme-toggle"
            onClick={() => hmmState.setDarkMode(prev => !prev)}
            title="Toggle Dark Mode"
          >
            {hmmState.darkMode ? '☀️' : '🌙'}
          </button>

          {/* Jerome Toggle */}
          <label className="jerome-toggle">
            <input
              type="checkbox"
              checked={hmmState.jeromeEnabled}
              onChange={(e) => hmmState.setJeromeEnabled(e.target.checked)}
            />
            <span className="toggle-slider" />
            <span className="toggle-label">
              🧑‍🏫 Jerome
            </span>
          </label>
        </div>
      </header>

      {/* Main Content */}
      <div className="app-body">
        {/* Left Panel */}
        <LeftPanel hmmState={hmmState} />

        {/* Center Canvas */}
        <div className="canvas-container">
          <Canvas hmmState={hmmState} algorithmState={algorithmState} />

          {/* Jerome overlay */}
          <Jerome
            currentStep={algorithmState.currentStep}
            enabled={hmmState.jeromeEnabled}
          />
        </div>

        {/* Right Panel */}
        <RightPanel hmmState={hmmState} algorithmState={algorithmState} />
      </div>

      {/* Bottom Control Bar */}
      <ControlBar
        algorithmState={algorithmState}
        hmmState={hmmState}
        onStart={handleStart}
        onReset={handleReset}
      />

      {/* Results Popup */}
      {hmmState.showResultsPopup && (
        <ResultsPopup
          convergenceData={algorithmState.convergenceData}
          onClose={handleClosePopup}
          hmmState={hmmState}
        />
      )}
    </div>
  );
}
