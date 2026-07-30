# Architecture

## Flow

1. User selects an Excel workbook.
2. `parseExogenaWorkbook` reads it with JSZip and direct OOXML parsing in the browser.
3. Raw rows are normalized into `ExogenaReport`.
4. Summary helpers compute totals and groups.
5. React renders the dashboard, filters, table, and record drawer.

## Main Files

- `src/App.tsx`: application state, filtering, sorting, export, and screen composition.
- `src/lib/exogenaParser.ts`: workbook parsing and normalization.
- `src/lib/summarize.ts`: aggregate calculations.
- `src/lib/format.ts`: Colombian peso and number formatting.
- `src/types.ts`: shared TypeScript data shapes.
- `src/styles.css`: dashboard layout and responsive styling.

## State

The app uses local React state:

- `report`: parsed workbook data.
- `query`: normalized search query.
- `tope`: selected tope filter.
- `sortKey`: current sort mode.
- `selectedRecord`: row shown in the detail drawer.
- `error` and `isLoading`: upload feedback.

No global store is currently needed.

## Export

The CSV export uses the currently filtered records and creates a browser download with `URL.createObjectURL`.
