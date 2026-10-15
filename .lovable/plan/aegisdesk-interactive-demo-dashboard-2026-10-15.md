# AegisDesk Interactive Demo Dashboard

A web-based mock-up of the AegisDesk control panel, showing the three expanded-scope features with simulated live data and real AI explanations.

## Pages
- **/ Overview**: summary cards (apps running, threats blocked, RAM saved, predicted next app), live activity feed.
- **/threats — AI Threat Intelligence**: live stream of simulated network requests and permission prompts (camera, clipboard, location, unknown domains) per wrapped app, each with a risk score. Click any event and "Explain with AI" gives a plain-language verdict and recommended action (allow / block / ask).
- **/workspace — Automated Workspace Management**: a weekly usage heatmap per app, a "Predicted next" queue with confidence and pre-load status, and an AI "Workspace tips" panel summarising habits.
- **/resources — Intelligent Resource Allocation**: per-app live CPU/RAM charts, current dynamic limits vs. usage, suspended/idle states, battery/thermal mode toggle, and an AI "Optimise" button that suggests new limits you can apply.

## Design
Dark, security-console feel: deep graphite background, a single sharp teal accent, amber/red for risk. Monospace numerals for metrics, a distinctive grotesk for headings. Left sidebar navigation.

## Data
All app, traffic and usage data is simulated in the browser (sample apps like Notion, Figma, Gmail, Slack, Linear) and ticks every couple of seconds. No accounts or saved data.

## Technical details
- TanStack routes per page, shared sidebar layout in root; recharts for charts.
- Simulation engine in a client module with React hooks.
- AI: server functions calling Lovable AI Gateway (Responses API, default model, streamed, strict JSON schema) for threat verdicts, workspace tips, and resource suggestions. Errors (429/402) shown as friendly toasts.
- Head metadata per route.
