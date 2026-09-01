# Wycherley International School — Cheque & Voucher Printer

A standalone, ultra-fast Cheque & Voucher Printing Web Application designed for **Wycherley International School (Org ID: `933829154`)** with direct Zoho Books API integration, ready for **Vercel**, **Netlify**, and **Local** deployment.

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

## ⚡ Vercel Deployment Guide

1. **Import Git Repository to Vercel**:
   - Repository: `https://github.com/vitharanasumithra718-design/wichaly-check-print`
   - Framework Preset: **Other** (Root directory: `./`)

2. **Add Environment Variables in Vercel** (`Project Settings → Environment Variables`):

| Variable | Value | Description |
|---|---|---|
| `ZOHO_CLIENT_ID` | `1000.CUHQ2LAJ1531VTGLBU2XFFY62FD2WJ` | Your Zoho API Client ID |
| `ZOHO_CLIENT_SECRET` | `636078052e431dd4d0cc2ff9eb8ef4a10d6288b6e2` | Your Zoho API Client Secret |
| `ZOHO_ORG_ID` | `933829154` | Wycherley International School Org ID |
| `ZOHO_REFRESH_TOKEN` | *(Your generated OAuth Refresh Token)* | Refresh token from Zoho OAuth |

3. **Deploy** 🚀

---

## 🔗 Zoho Books Custom Button URL Format

In **Zoho Books** (Wycherley International School, Org: `933829154`) → **Settings** → **Customization** → **Buttons & Links**:

### 1. For Cheque Print Button:
- **Button Type**: Open a Web Tab / Open a URL
- **URL**:
  ```
  https://<your-project-name>.vercel.app/?type=cheque&paymentID=${payment.payment_id}&organizationID=933829154
  ```

### 2. For Payment Voucher Button:
- **URL**:
  ```
  https://<your-project-name>.vercel.app/?type=voucher&paymentID=${payment.payment_id}&organizationID=933829154
  ```

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
