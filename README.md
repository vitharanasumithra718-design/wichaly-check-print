# Wycherley International School — Cheque & Voucher Printer

A standalone, ultra-fast Cheque & Voucher Printing Web Application designed for **Wycherley International School (Org ID: `933829154`)** with direct Zoho Books API integration.

## 🚀 Key Features

1. **Pixel-Perfect Cheque Printing (No Scrollbars / Zero Margin Offset)**:
   - Formatted to standard `7.5" x 3.875"` Monarch cheque dimensions.
   - Works seamlessly with cheque printers (Epson LQ-310, continuous/sheet feed, HP/Canon laser cheque trays).
2. **Built-in Sri Lankan Bank Profiles**:
   - Commercial Bank
   - Sampath Bank
   - Nations Trust Bank (NTB)
   - Hatton National Bank (HNB)
   - Bank of Ceylon (BOC)
   - Seylan Bank
   - Custom Alignment
3. **Live Millimeter Calibration Sliders**:
   - Fine-tune Date box, Payee line, Words line, and Amount in Numbers with live on-screen adjustments.
   - Save calibrations per bank directly in your browser.
4. **All-in-One Printable Documents**:
   - **Vendor Cheque**
   - **Expense Cheque**
   - **Payment Voucher** (A4 Portrait with Dr/Cr accounts and signatures)
   - **Petty Cash Voucher** (A4 Landscape with dashed lines)
5. **Direct Integration with Zoho Books Custom Buttons**:
   - Open directly via URL parameters from Zoho Books.

---

## 🔗 Zoho Books Custom Button URL Format

In **Zoho Books** → **Settings** → **Customization** → **Buttons & Links**:

### 1. For Cheque Print Button:
- **Button Type**: Open a Web Tab / Open a URL
- **URL**:
  ```
  https://<your-app-name>.netlify.app/?type=cheque&paymentID=${payment.payment_id}&organizationID=${organization.organization_id}
  ```

### 2. For Payment Voucher Button:
- **URL**:
  ```
  https://<your-app-name>.netlify.app/?type=voucher&paymentID=${payment.payment_id}&organizationID=${organization.organization_id}
  ```

---

## ⚙️ Environment Variables (Netlify)

Add these in **Netlify Site settings → Environment variables**:

| Variable | Description |
|---|---|
| `ZOHO_CLIENT_ID` | Your Zoho API Client ID |
| `ZOHO_CLIENT_SECRET` | Your Zoho API Client Secret |
| `ZOHO_REFRESH_TOKEN` | Generated OAuth Refresh Token |
| `ZOHO_ORG_ID` | `933829154` (Wycherley International School) |

---

## 💻 Local Development

1. Run with standard Node.js:
```bash
start.bat
```
or
```bash
node server.js
```
Open `http://localhost:8888` in your browser.
