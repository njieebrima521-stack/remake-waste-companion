<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- App state lives in `src/lib/remake/store.ts` (one external store persisted to localStorage) and pure rules in `src/lib/remake/logic.ts`; screens read via `useApp` and write via `actions` — keeps every screen in sync without a backend.
- Signed-in screens are `src/routes/_main.*.tsx` under the `_main` gate; each screen is a phone-sized `Screen`/`ScreenHeader`/`ScreenBody`/`ScreenFooter` from `components/remake/Screen.tsx` — consistent mobile layout.
- Recyclable (`/book`) and general (`/general`) bookings share step components from `components/remake/booking.tsx` and keep progress in the store `draft` — scan results carry into booking and edits don't duplicate.
- Business rules (coin release, separation, slots, redemption) are covered in `src/test/remake-rules.test.ts`; update it when a rule changes.
- Collector eligibility (`eligibleCollectors`/`collectorAccepts`) and collection QR handling (`qrPayload`/`resolveScan`/`confirmCollection`) live only in `src/lib/remake/logic.ts`; booking, reassignment, auto-assignment and the `/collector` scanner demo all call them — one matching rule everywhere.
- Collector-side rules (request visibility, readiness/minimums, accept/reject/propose, routes, confirmation, material verification, history, registration) live only in `src/lib/remake/collector.ts` as pure functions over AppState; screens call them through `actions` in the store — keeps one rule set for every collector screen and testable in `src/test/collector-rules.test.ts`.
- The collector app is under `/collector/*`; approved-only screens sit under the pathless `src/routes/collector._app.tsx` gate and use `useMe()` from `components/collector/ui.tsx` — unapproved/suspended accounts can never reach assignments.
- The booking QR scanner is one component (`components/collector/Scanner.tsx`) shared by the collector app and the resident demo at `/collector-demo` — no duplicate scanner logic.
- Resident screens list bookings via `residentPickups()` so institutional collector requests never appear in the resident app.

