/**
 * Jerome's contextual explanations for each algorithm step
 */
export const explanations = {
    INIT: {
        title: "🎓 Model Initialization",
        text: `Welcome! Let's learn Baum-Welch together.

Our HMM model λ = (A, B, π) has three parts:
• A — the transition matrix: probability of moving between hidden states
• B — the emission matrix: probability of each state producing each observation
• π — the initial distribution: which state we start in

These probabilities are either what you set, or randomly initialized. Each row sums to 1 — that's the stochasticity constraint!`,
    },

    FORWARD: {
        title: "➡️ Forward Pass (α)",
        text: `Now computing forward probabilities α_t(i).

α_t(i) answers: "what's the probability of seeing observations O₁...Oₜ AND being in state i at time t?"

We start at t=0, then propagate forward. At each step, we sum over all possible previous states, weighted by transition probabilities, then multiply by the emission probability of the current observation.

Think of it as flowing probability mass forward through the trellis!`,
    },

    BACKWARD: {
        title: "⬅️ Backward Pass (β)",
        text: `Now computing backward probabilities β_t(i).

β_t(i) answers: "if we're in state i at time t, what's the probability of seeing the REMAINING observations O_{t+1}...O_T?"

We start from the end (β_T = 1) and work backwards. This gives us future evidence — when combined with α, we get the complete picture.

Together, α and β tell us everything about each state's role in explaining the full sequence.`,
    },

    GAMMA: {
        title: "📊 Gamma (γ) — Posterior State Probability",
        text: `γ_t(i) = P(state = i at time t | full observation sequence)

This is computed as:  γ_t(i) = α_t(i) × β_t(i) / normalization

This tells us the "soft assignment" — how responsible each state is for each time point. Unlike Viterbi (hard assignment), gamma gives us smooth probabilities.

These are the expected state occupancies — the foundation for re-estimating parameters!`,
    },

    XI: {
        title: "🔗 Xi (ξ) — Expected Transitions",
        text: `ξ_t(i,j) = P(state_t = i, state_{t+1} = j | observations)

Xi tells us the expected number of transitions from state i to state j at each time step.

It uses both forward (α) and backward (β) probabilities along with the transition and emission probabilities.

These "soft counts" of transitions are the key to updating the transition matrix in the M-step!`,
    },

    M_STEP: {
        title: "🔄 M-Step: Parameter Update",
        text: `Now we update all parameters using expected sufficient statistics!

• New A[i][j] = (expected transitions from i to j) / (expected visits to state i)
  = Σ_t ξ_t(i,j) / Σ_t γ_t(i)

• New B[i][k] = (expected emissions of symbol k from state i) / (expected visits to state i)

• New π[i] = γ_1(i) — just the posterior at time 1

This is the "M" in EM — we're maximizing the expected complete-data log-likelihood!`,
    },

    LIKELIHOOD: {
        title: "📈 Likelihood Increase",
        text: `After each complete iteration, the log-likelihood of the observed sequence P(O|λ) is guaranteed to increase (or stay the same).

This is a fundamental property of the EM algorithm! Each iteration finds parameters that better explain the observations.

However, EM only finds a LOCAL maximum — different initializations may converge to different solutions. That's why random restarts are often used in practice.`,
    },

    CONVERGE_CHECK: {
        title: "🔍 Checking Convergence",
        text: `We check if the log-likelihood has stopped changing significantly.

If |LL_new - LL_old| < threshold (we use 10⁻⁶), we declare convergence.

This means we've found a (local) maximum of the likelihood function — further iterations won't meaningfully improve the model.`,
    },

    CONVERGED: {
        title: "✅ Converged!",
        text: `The algorithm has converged! The model parameters are now locally optimal.

The transition matrix A, emission matrix B, and initial distribution π have stabilized. The log-likelihood can't be significantly improved by further iterations.

Remember: this is a local optimum. Different random initializations might find different solutions with different likelihoods.

Great job working through the algorithm step by step! 🎉`,
    },
};
