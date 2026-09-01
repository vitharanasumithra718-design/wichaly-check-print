// api/get-record.js
const { apiRequest, getStoredTokens, ORG_ID } = require("./zohoAuth");
const url = require("url");

function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const val = Number(num) || 0;
  const intPart = Math.floor(val);
  const cents = Math.round((val - intPart) * 100);

  const wordsPart = intPart === 0 ? 'Zero' : inWords(intPart);
  const centsPart = cents === 0 ? 'Zero' : inWords(cents);

  return `${wordsPart} and Cents ${centsPart} Only`;
}

function formatDateDigits(dateStr) {
  if (!dateStr) return { d1: '', d2: '', m1: '', m2: '', y1: '', y2: '', y3: '', y4: '', formatted: '' };
  let day = '', month = '', year = '';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) { // YYYY-MM-DD
      year = parts[0]; month = parts[1].padStart(2, '0'); day = parts[2].padStart(2, '0');
    } else { // DD-MM-YYYY
      day = parts[0].padStart(2, '0'); month = parts[1].padStart(2, '0'); year = parts[2];
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    day = parts[0].padStart(2, '0'); month = parts[1].padStart(2, '0'); year = parts[2];
  }

  return {
    d1: day[0] || '', d2: day[1] || '',
    m1: month[0] || '', m2: month[1] || '',
    y1: year[0] || '', y2: year[1] || '', y3: year[2] || '', y4: year[3] || '',
    formatted: `${day}/${month}/${year}`,
  };
}

function formatAmount(amt) {
  const n = Number(amt) || 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const query = req.query || url.parse(req.url, true).query || {};

  // Auth check mode
  if (query.check === "1") {
    const tokens = getStoredTokens();
    res.writeHead(200);
    res.end(JSON.stringify({ authorized: !!(tokens && tokens.refresh_token), orgId: ORG_ID }));
    return;
  }

  const type = query.type || "vendorpayment";
  const id = query.id || query.paymentID || query.expenseID || query.invoiceID;
  const orgId = query.organizationID || query.orgId || ORG_ID;

  try {
    if (type === "list") {
      const apiRes = await apiRequest("GET", `/vendorpayments?per_page=50&sort_column=date&sort_order=D`, null, orgId);
      if (apiRes.status >= 400) throw new Error(JSON.stringify(apiRes.data));
      const payments = (apiRes.data && apiRes.data.vendorpayments) || [];
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, payments }));
      return;
    }

    if (!id) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Missing Record ID (paymentID or expenseID)" }));
      return;
    }

    if (type === "vendorpayment" || type === "cheque" || type === "voucher") {
      const apiRes = await apiRequest("GET", `/vendorpayments/${id}`, null, orgId);
      if (apiRes.status >= 400) throw new Error(JSON.stringify(apiRes.data));
      const p = (apiRes.data && apiRes.data.vendorpayment) || {};

      const customFields = p.custom_fields || [];
      let printBank = "";
      for (const cf of customFields) {
        if (cf.label === "Print Bank Name" || cf.api_name === "cf_print_bank_name") {
          printBank = cf.value_formatted || cf.value || "";
        }
      }
      if (!printBank) {
        printBank = p.paid_through_account_name || "";
      }

      const amount = Number(p.amount) || 0;
      const dateDigits = formatDateDigits(p.date);
      const amountInWords = numberToWords(amount);
      const amountFormatted = formatAmount(amount);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        type: "vendorpayment",
        id: p.payment_id,
        paymentNumber: p.payment_number || p.reference_number || "",
        referenceNumber: p.reference_number || "",
        payeeName: p.vendor_name || "",
        date: p.date,
        dateDigits,
        amount,
        amountFormatted,
        amountInWords,
        bankName: printBank,
        paidThrough: p.paid_through_account_name || "",
        notes: p.description || "",
        bills: p.bills || [],
        raw: p,
      }));
      return;
    }

    if (type === "expense" || type === "pettycash") {
      const apiRes = await apiRequest("GET", `/expenses/${id}`, null, orgId);
      if (apiRes.status >= 400) throw new Error(JSON.stringify(apiRes.data));
      const exp = (apiRes.data && apiRes.data.expense) || {};

      const payeeName = exp.vendor_name || exp.paid_to_name || exp.paid_to || exp.employee_name || exp.customer_name || "—";
      const amount = Number(exp.total || exp.amount) || 0;
      const dateDigits = formatDateDigits(exp.date);
      const amountInWords = numberToWords(amount);
      const amountFormatted = formatAmount(amount);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        type: "expense",
        id: exp.expense_id,
        voucherNumber: exp.voucher_number || exp.expense_number || exp.reference_number || "",
        referenceNumber: exp.reference_number || "",
        payeeName,
        date: exp.date,
        dateDigits,
        amount,
        amountFormatted,
        amountInWords,
        bankName: exp.paid_through_account_name || "",
        accountName: exp.account_name || "",
        notes: exp.description || "",
        lineItems: exp.line_items || [],
        raw: exp,
      }));
      return;
    }

    res.writeHead(400);
    res.end(JSON.stringify({ error: `Unsupported record type: ${type}` }));

  } catch (err) {
    if (err.code === "NOT_AUTHORIZED" || (err.message && err.message.includes("NOT_AUTHORIZED"))) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "NOT_AUTHORIZED", message: "Zoho Books not connected" }));
      return;
    }
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message || String(err) }));
  }
};
