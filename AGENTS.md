<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI server functions require `requireSupabaseAuth` and validate input/output with zod schemas in `src/lib/ai.schemas.ts` — the AI gateway costs credits and must never be callable anonymously.
- Every dashboard page shows the Simulation Mode banner (via `PageHeader`) while data is generated — users must not mistake sample data for real protection.
