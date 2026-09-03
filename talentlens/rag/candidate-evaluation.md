# Screening rubric — Kilometer mid-level web engineer

TalentLens, operating for Kilometer TA and Engineering. Door to Door req. Mid-level (about 3–5 years). Use on every packet.

A **hire** is a mid-level front-end engineer who can own a feature with PM and design, write production React/TypeScript, review others, and mentor someone ramping on web. They are not a junior who needs a ticket broken down to the hour, and they are not staff/lead (chapter contribution yes; they do not set org-wide architecture).

## Mid-level front-end bar (expected)

- **UI:** Semantic HTML, modern CSS (layout, responsive, design-system usage). Implements from Figma without a pixel-perfect fight, and flags when the spec is ambiguous.
- **React / TypeScript:** Components with clear state, effects, and data fetching. Types the public surface of what they ship. Does not invent a new framework.
- **Quality:** Tests the behaviour they own; uses the existing CI; leaves the PR reviewable. Debugging in the browser (network, a11y tree, performance when it matters) is routine.
- **Product:** Breaks a story into mergeable slices. Talks to PM/PD in English. Explains a trade-off (iterate now vs scale later) without a slide deck.
- **Ownership:** Integrates with APIs and patterns other Kilometer teams already run. Takes part in design and code review; gives usable comments, not only “LGTM.”
- **Chapter:** Shows up to the Front-End Web Chapter; can adopt shared libraries. Does not need to lead the chapter.
- **Tooling:** Git and Docker without a babysitter. Some Node (the 60/40 split). Some observability (logs/metrics on the path they touch). Uses the org’s AI coding tools without pasting secrets or skipping review.
- **Mentoring:** Can pair a ramping engineer through a web task. Not their full-time job.

Nice-to-haves (SEO, extra NestJS, Kubernetes, native mobile) are **not** hire-blockers. Missing them is hold only if the core bar above is also thin.

## Score 1–5

| Dimension | 1 (below mid) | 3 (mid / this req) | 5 (overqualified) |
| --------- | ------------- | ------------------ | ----------------- |
| Web stack | HTML/CSS or JS without production React+TS | Ships TS, HTML, CSS, React in prod | Deep platform/chapter-level web |
| Fullstack lean | Frontend-only, no Node | Enough Node/Git/Docker/observability to hold ~60/40 | NestJS/services as a default |
| Product & chapter | Ticket-taker | Owns a slice with PM/PD; reviews; mentors a ramp | Sets architecture or leads a squad |
| Quality | No tests, noisy PRs | Tests, CI, review, Friday debt work is familiar | Raises the org quality bar |
| Communication | Weak English or cannot explain a choice | English with PM, EM, and pairing partners | Influences VP/chapter direction |
| Ramp | Needs a buddy for Git/Docker/SSO/admin tools | Productive in our repo in the first weeks | Coaches the squad’s toolchain |

Recommend **hire** at a cluster of 3s, with no 1 on web stack or communication.

## Decision

Recommend **hire**, **hold**, or **reject**. Do not leave the req in “needs more info” when a similar profile already has a debrief in our Kilometer notes.

If two people are in the same loop, the hire signal is who owns the technical conversation and the toolchain.

## Process (client)

TA → EM + PM → design interview → code review → pairing → VP Engineering. In pairing, watch whether they drive the editor and the browser, not only the conversation.
