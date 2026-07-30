# Data Contract

This document describes the workbook shape expected by the parser in `src/lib/exogenaParser.ts`.

## Workbook

- File type: `.xlsx` or `.xls`
- Expected sheet: first workbook sheet
- Do not commit real taxpayer workbooks or example files derived from real taxpayer data.

## Metadata Rows

The parser uses zero-based arrays internally. The user-visible Excel rows are:

| Excel Row | Cell | Meaning |
| --- | --- | --- |
| 2 | A | Warning text |
| 2 | H | Report date |
| 3 | C | Cutoff date |
| 4 | C | Report year |
| 6 | C | Document type |
| 7 | C | Identification |
| 8 | C | Taxpayer name |

Excel serial dates are formatted for `es-CO`.

## Threshold Rows

Rows 15 through 19 are parsed as thresholds.

| Cell | Meaning |
| --- | --- |
| E | Threshold label |
| F | Threshold value |

## Detail Rows

Detailed records start at row 20.

| Column | Field |
| --- | --- |
| A | `reporterNit` |
| B | `reporterName` |
| C | `reportedNit` |
| D | `reportedName` |
| E | `detail` |
| F | `value` |
| G | `declarationUse` |
| H | `additionalInfo` |

Rows with no reporter, detail, or value are ignored.

## Derived Fields

`topes` are extracted from `declarationUse` with the pattern `Tope <number>`. Records without a detected tope are shown as `Sin tope` in the UI.

## Compatibility Notes

If DIAN changes the row positions, merged-cell structure, or column order, update this document and `src/lib/exogenaParser.ts` together.
