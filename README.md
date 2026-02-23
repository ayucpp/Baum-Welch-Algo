# Baum-Welch Visualizer

## Student Information

- **Ayush Raj** — TCR24CS018  
- **Bhagath P R** — TCR24CS019  
- **David Chacko Binoy** — TCR24CS022  
- **Jerome Parekkattil** — TCR24CS037  
- **Joseph Mathew** — TCR24CS038  
- **Royce Pathayil Saji** — TCR24CS058  
- **Sidharth V Jain** — TCR24CS063  

---

## Project Overview

An interactive visualization of the Baum-Welch algorithm — the core Expectation-Maximization (EM) method used to train Hidden Markov Models (HMMs).

Built with React, Vite, and D3.

---

## What It Does

Set up a custom Hidden Markov Model by defining:

- Hidden states  
- Emission symbols  
- Observation sequence  

Then observe the algorithm execute step-by-step through:

- Forward Pass  
- Backward Pass  
- Gamma Computation  
- Xi Computation  
- Parameter Re-estimation  

A live log-likelihood chart tracks convergence across iterations, and the optional Jerome assistant explains each step in clear language.

---

## Features

- Interactive graph canvas with draggable and renameable nodes  
- Spring-embedder layout animation  
- Smooth, untangled edge rendering  
- Step-by-step algorithm playback with speed controls  
- Real-time parameter matrix updates (π, A, B)  
- Log-likelihood convergence visualization  
- Dark / Light mode toggle  
- Optional guided explanation mode  

---

## Run Locally

```bash
npm install
npm run dev
```

---

## Technologies Used

- React  
- Vite  
- D3 (force simulation and visualization)  
- SVG-based rendering  

---

## Educational Goal

This project is designed to provide an intuitive, visual understanding of:

- Forward–Backward inference  
- Soft state assignments (γ)  
- Expected transition counts (ξ)  
- Expectation-Maximization updates  
- Likelihood convergence behavior  

The system functions as a visual debugger for the Baum-Welch algorithm.
