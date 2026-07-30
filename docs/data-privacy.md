# Data Privacy

The app is local-first.

## What Happens To The File

- The selected Excel file is read by the browser.
- Records are kept in React state while the page is open.
- The app has no backend.
- The app does not upload the workbook.
- The app does not store imported data in local storage by default.

## Clearing Data

Use `Limpiar` to remove the current parsed report from the interface. Closing or refreshing the tab also clears the current in-memory state.

## Recommendations

- Avoid opening personal tax files on public or shared machines.
- Clear the report before leaving the browser unattended.
- Review exported CSV files carefully because they contain sensitive tax information.
