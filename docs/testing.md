# Testing

## Manual Test Scenarios

Use a local workbook that follows the data contract. Do not commit real taxpayer workbooks or files derived from real taxpayer data.

1. Upload the workbook.
2. Confirm taxpayer metadata appears.
3. Confirm all five threshold cards appear.
4. Confirm the detail table renders records.
5. Search by reporter name.
6. Search by NIT.
7. Filter by `Tope 1`, `Tope 2`, and `Tope 3`.
8. Sort by value, informant, and detail.
9. Open a record drawer and confirm long text is readable.
10. Export CSV and confirm it reflects current filters.
11. Select `Limpiar` and confirm imported data disappears.

## Parser Edge Cases

Add automated parser tests before changing `src/lib/exogenaParser.ts` materially.

Important cases:

- Empty workbook.
- Workbook with no sheets.
- Missing threshold rows.
- Blank detail rows.
- String-formatted money values.
- Missing declaration-use text.
- Different but compatible sheet name.

## Build Check

```bash
npm run build
```
