# Baum-Welch Visualizer

An interactive visualization of the **Baum-Welch algorithm** — the core expectation-maximization method used to train Hidden Markov Models (HMMs).

Built with React + Vite + D3.

## What it does

Set up a custom HMM (hidden states, emission symbols, observation sequence), then watch the algorithm run step-by-step through the Forward, Backward, Gamma, Xi, and Re-estimation passes in a physics-driven graph view. A live log-likelihood chart tracks convergence, and the Jerome assistant explains each step in plain English.

## Features

- Interactive graph canvas with draggable, renameable nodes
- Obsidian-style spring-embedder layout animation
- Step-by-step algorithm playback with speed controls
- Real-time parameter matrix updates (π, A, B)
- Dark / light mode

## Run locally

```bash
npm install
npm run dev
```
