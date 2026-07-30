# Agent Notes

## Purpose

Build and maintain a local-first React interface for reviewing Colombian informacion exogena Excel reports. The application should make sensitive tax data easier to inspect without sending files to a backend.

## Stack

- Vite
- React
- TypeScript
- JSZip plus direct OOXML parsing for workbook reading
- Lucide React for icons
- Plain CSS in `src/styles.css`

## Commands

```bash
npm install
npm run dev
npm run build
```

## Data Rules

- Keep Excel parsing client-side unless the user explicitly asks for a backend.
- Do not add analytics, telemetry, external upload flows, or remote persistence for tax data.
- Do not hardcode real taxpayer data into source files.
- Do not commit real taxpayer workbooks or local spreadsheet fixtures.
- Treat changes to `src/lib/exogenaParser.ts` as high-risk because row and column assumptions are central to the app.

## UI Rules

- The first screen should be the working upload/review experience, not a marketing page.
- Keep the interface Spanish-first.
- Format money as Colombian pesos.
- Long fields such as `Uso declaracion sugerida` and `Informacion adicional` should remain readable through a detail view.

## Documentation

Update these when behavior changes:

- `README.md` for setup and high-level usage.
- `docs/user-guide.md` for user workflows.
- `docs/data-contract.md` for workbook parsing assumptions.
- `docs/architecture.md` for app structure.
- `docs/testing.md` for validation scenarios.
- `docs/data-privacy.md` for privacy behavior.
