# Proof of Delivery (POD — ₹11.80 incl. GST) Implementation Plan

## 1. Tariff & Calculation Engine (`src/data/indiaPostTariffs.ts` & `src/App.tsx`)
- Define official Proof of Delivery fee constant: `POD_FEE_INCL_GST = 11.80` (₹10.00 base + ₹1.80 GST).
- When `hasAck` (POD) is enabled on a consignment:
  - Keep `basePostage` and `gstAmount` showing the postage base and postage GST.
  - Set `valueAddedServicesFee = 11.80` (POD fee incl. GST).
  - Add `₹11.80` directly to `totalPostage` (`basePostage + gstAmount + 11.80`), including after live India Post scraping in `applyLiveResultToItem`.

## 2. Bulk Spreadsheet Toolbar Toggle (`src/components/BatchHeaderControls.tsx`)
- Add a **POD (+₹11.80)** batch toggle checkbox in the toolbar so you can enable or disable Proof of Delivery across all rows in the customer batch with a single click.

## 3. Dedicated POD Column in Bulk Spreadsheet (`src/components/SpreadsheetGrid.tsx`)
- Add a dedicated **POD (₹11.80)** column between **GST (₹)** and **Total (₹)**:
  - Each row renders a checkbox + `₹11.80` (when checked) or `—` (when unchecked).
  - Toggling the checkbox immediately adds/subtracts `₹11.80` from that row's **Total (₹)** and updates the batch summary.

## 4. Single Parcel / Letter Estimator (`src/components/SingleParcelEstimator.tsx`)
- Add a **Proof of Delivery (+₹11.80 incl. GST)** checkbox under **Package Details**.
- When checked, add `₹11.80` to the Speed Post / Registered / Parcel card totals, display `Proof of Delivery (incl. GST): ₹11.80` in the price breakdown tooltip, and carry `hasAck: true` when adding the item to the Bulk Spreadsheet.

## 5. Batch Summary, Printable Manifest & Excel/CSV Import/Export
- Include the total Proof of Delivery charges in `BatchSummaryCard` (`VAS / POD Charges`) and `PrintableManifestModal`.
- Include a `POD (Rs 11.80)` column in Excel (`.xlsx`) and CSV exports, and parse `POD` / `Ack` (`Yes`/`true`/`1`/`11.8`) when importing spreadsheets.
