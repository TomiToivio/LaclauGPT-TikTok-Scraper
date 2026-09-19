# Agent rules

<!-- PHASE-BRANCH-POLICY:v1 -->

## Mandatory phase-branch policy

LaclauGPT is developed on persistent phase branches: `phase-0`, `phase-1`, `phase-2`, `phase-3`, and `phase-4`.

**Current active/stable phase: Phase 0.** Therefore `main` must represent the current Phase-0 state and must stay synchronized with `phase-0`.

Before making any issue-driven change, an agent MUST determine the issue's intended phase from explicit issue text, title, labels, milestone, linked plan, or repository documentation. Then:

1. Work from the matching persistent phase branch, e.g. a Phase-1 issue starts from `phase-1`, not `main` and not `phase-0`.
2. Prefer a short-lived issue branch created from that phase branch and target the pull request back to the same `phase-N` branch.
3. Never merge later-phase work into `main` while an earlier phase is current.
4. Phase-0 fixes target `phase-0`. After validation, keep `main` synchronized with `phase-0`.
5. When the project officially advances phases, synchronize `main` to the newly active phase branch only after explicit human approval.
6. If an issue has no phase information, treat it as belonging to the current phase unless the roadmap clearly says otherwise. Currently that means `phase-0`.
7. Do not silently move work between phases.
8. Preserve all existing TOMI-LOCKED, privacy, runtime-data, scientific-method, and module-boundary rules.

See `docs/PHASE_BRANCHING.md`.

