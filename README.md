# Exogenial

Exogenial is a local React app for reviewing Colombian `informacion exogena` reports from Excel files. It turns the report into a readable dashboard with taxpayer metadata, tax thresholds, grouped insights, filters, and a detailed record table.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## Supported File

The app expects a DIAN-style informacion exogena Excel workbook:

- One report sheet.
- Metadata and warnings near the top.
- Threshold rows for `Tope 1` through `Tope 5`.
- Detailed third-party records with columns from `A` to `H`.

See [docs/data-contract.md](/home/emmanuel/Documents/exogenial/docs/data-contract.md) for the exact mapping.

## Privacy

The workbook is parsed in the browser. The app does not include a backend, does not upload the file, and does not persist imported records by default.

Spreadsheet files are ignored by git by default because they may contain sensitive taxpayer data.

## Important

Informacion exogena is a reference source and does not replace the taxpayer's actual economic records, tax review, or professional advice.
