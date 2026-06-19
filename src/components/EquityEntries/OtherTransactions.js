  import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Styles/OtherTransactions.css';
import { accountAPI, otherTransactionAPI, otherTransactionGLEntryAPI, glAccountMappingAPI, otherTransactionTypeAPI, chartOfAccountsAPI, accountCategoryAPI } from '../../services/api';
import { authService } from '../../services/authService';
import holidayService from '../../services/holidayService';

// Helper function to get today's date in YYYY-MM-DD format
const getToday = () => new Date().toISOString().slice(0, 10);

// Function to generate unique voucher numbers
const generateVoucherNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `V-${year}${month}${day}-${hour}${minute}${second}`;
};

// Function to generate unique voucher numbers for liability settlements
const generateLiabilitySettlementVoucherNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `LS-${year}${month}${day}-${hour}${minute}${second}`;
};

// Letterhead used by all printable documents (Voucher / Invoice / Request Letter).
// Replace these placeholder values (or wire to a company-settings API) when ready.
const PRINT_LETTERHEAD = {
  companyName: 'Company Name',
  logoText: 'COMPANY',
  registrationNo: '',
  addressLine: '',
  phone: '',
  fax: '',
  email: ''
};

const formatDateDdMmYyyy = (value) => {
  if (!value) return '—';
  const s = String(value).substring(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
};

const formatAmount = (value) => {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const numberToWords = (num) => {
  const n = Math.floor(Math.abs(parseFloat(num) || 0));
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const chunk = (x) => {
    let s = '';
    if (x >= 100) { s += ones[Math.floor(x / 100)] + ' Hundred '; x %= 100; }
    if (x >= 20) { s += tens[Math.floor(x / 10)] + (x % 10 ? '-' + ones[x % 10] : '') + ' '; }
    else if (x > 0) { s += ones[x] + ' '; }
    return s;
  };
  let result = '';
  const scales = ['', 'Thousand', 'Million', 'Billion'];
  let scaleIdx = 0;
  let remaining = n;
  while (remaining > 0) {
    const part = remaining % 1000;
    if (part) result = chunk(part) + (scales[scaleIdx] ? scales[scaleIdx] + ' ' : '') + result;
    remaining = Math.floor(remaining / 1000);
    scaleIdx++;
  }
  return result.trim();
};

// Reusable CSS shared between the in-modal renderer and the print iframe.
// Layout is built with semantic tables so labels/values land on fixed columns,
// like the Ambeon Capital sample voucher.
const INLINE_DOC_STYLE = `
  .inline-doc-print-wrap, .inline-doc-render {
    font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff;
  }
  .inline-doc-render { padding: 16px 22px; }
  .inline-doc-print-wrap { padding: 22px 28px; max-width: 780px; margin: 0 auto; }

  /* ---------- Letterhead ---------- */
  .inline-doc-render .lh, .inline-doc-print-wrap .lh {
    display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
    padding-bottom: 8px; border-bottom: 1px solid #111;
  }
  .inline-doc-render .co-name, .inline-doc-print-wrap .co-name {
    font-size: 13pt; font-weight: 700; margin-bottom: 4px;
  }
  .inline-doc-render .co-meta, .inline-doc-print-wrap .co-meta {
    font-size: 8pt; color: #1f2937; line-height: 1.35;
  }
  .inline-doc-render .logo, .inline-doc-print-wrap .logo {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 14pt; font-weight: 300; color: #6b7280; text-align: right;
    letter-spacing: 0.4em; line-height: 1; align-self: center;
    text-transform: uppercase; padding-right: 2px;
  }

  /* ---------- Section title ---------- */
  .inline-doc-render .doc-title, .inline-doc-print-wrap .doc-title {
    text-align: center; margin: 16px 0 10px; font-size: 11pt; font-weight: 700;
    text-decoration: underline; text-underline-offset: 5px;
  }

  /* ---------- Header info table ---------- */
  .inline-doc-render table.hdr, .inline-doc-print-wrap table.hdr {
    width: 100%; border-collapse: collapse; font-size: 9pt; margin: 0;
  }
  .inline-doc-render table.hdr td, .inline-doc-print-wrap table.hdr td {
    padding: 6px 6px; vertical-align: top;
  }
  .inline-doc-render table.hdr td.lbl, .inline-doc-print-wrap table.hdr td.lbl {
    width: 110px; font-weight: 600; white-space: nowrap;
  }
  .inline-doc-render table.hdr td.lbl-r, .inline-doc-print-wrap table.hdr td.lbl-r {
    width: 110px; font-weight: 600; text-align: right; white-space: nowrap;
  }
  .inline-doc-render table.hdr td.val, .inline-doc-print-wrap table.hdr td.val { width: auto; }
  .inline-doc-render table.hdr tr.sep td, .inline-doc-print-wrap table.hdr tr.sep td {
    border-bottom: 1px solid #111; padding-top: 4px; padding-bottom: 6px;
  }

  /* ---------- Journal table (minimal lines, like sample) ---------- */
  .inline-doc-render table.jt, .inline-doc-print-wrap table.jt {
    width: 100%; border-collapse: collapse; margin: 4px 0 0; font-size: 9pt;
  }
  .inline-doc-render table.jt th, .inline-doc-print-wrap table.jt th {
    text-align: left; padding: 8px 6px 6px; border-bottom: 1px solid #111;
    text-decoration: underline; text-underline-offset: 4px; font-weight: 700;
  }
  .inline-doc-render table.jt td, .inline-doc-print-wrap table.jt td {
    padding: 5px 6px; vertical-align: top;
  }
  .inline-doc-render table.jt td.num, .inline-doc-render table.jt th.num,
  .inline-doc-print-wrap table.jt td.num, .inline-doc-print-wrap table.jt th.num {
    text-align: right; white-space: nowrap;
  }
  .inline-doc-render table.jt td.center, .inline-doc-render table.jt th.center,
  .inline-doc-print-wrap table.jt td.center, .inline-doc-print-wrap table.jt th.center {
    text-align: center;
  }
  .inline-doc-render table.jt tr.totals td, .inline-doc-print-wrap table.jt tr.totals td {
    font-weight: 700;
  }
  .inline-doc-render table.jt tr.totals-first td, .inline-doc-print-wrap table.jt tr.totals-first td {
    padding-top: 8px;
  }
  .inline-doc-render table.jt tr.section-end td, .inline-doc-print-wrap table.jt tr.section-end td {
    border-bottom: 1px solid #111; padding-bottom: 8px;
  }

  /* ---------- Bank / branch strip ---------- */
  .inline-doc-render table.bank, .inline-doc-print-wrap table.bank {
    width: 100%; border-collapse: collapse; font-size: 9pt;
    border-bottom: 1px solid #111; margin-top: 0;
  }
  .inline-doc-render table.bank td, .inline-doc-print-wrap table.bank td {
    padding: 8px 6px 10px; vertical-align: top;
  }
  .inline-doc-render table.bank td.lbl, .inline-doc-print-wrap table.bank td.lbl {
    font-weight: 600; white-space: nowrap;
  }

  /* ---------- Signature grid ---------- */
  .inline-doc-render table.sigs, .inline-doc-print-wrap table.sigs {
    width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 9pt;
  }
  .inline-doc-render table.sigs td, .inline-doc-print-wrap table.sigs td {
    padding: 16px 12px 4px; vertical-align: bottom; width: 33.33%;
  }
  .inline-doc-render table.sigs td .slabel, .inline-doc-print-wrap table.sigs td .slabel {
    font-weight: 600; display: inline-block; min-width: 130px;
  }
  .inline-doc-render table.sigs td .sline, .inline-doc-print-wrap table.sigs td .sline {
    display: inline-block; border-bottom: 1px solid #111; width: 130px; height: 1em; vertical-align: bottom;
  }

  /* ---------- Signoff (Yours faithfully / Authorised Signatory) ---------- */
  .inline-doc-render .signoff, .inline-doc-print-wrap .signoff { margin-top: 24px; font-size: 9.5pt; }
  .inline-doc-render .signoff .line, .inline-doc-print-wrap .signoff .line {
    border-bottom: 1px solid #111; width: 200px; min-height: 16px; margin: 18px 0 4px;
  }
  .inline-doc-render .signoff .lbl, .inline-doc-print-wrap .signoff .lbl { font-weight: 700; }

  /* ---------- Payment Advice value-on-right ---------- */
  .inline-doc-render table.advice-bank, .inline-doc-print-wrap table.advice-bank {
    width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 0;
    border-bottom: 1px solid #111;
  }
  .inline-doc-render table.advice-bank td, .inline-doc-print-wrap table.advice-bank td {
    padding: 8px 6px 10px; vertical-align: top;
  }
  .inline-doc-render table.advice-bank td.lbl, .inline-doc-print-wrap table.advice-bank td.lbl {
    font-weight: 600; white-space: nowrap;
  }
  .inline-doc-render table.advice-bank td.value-cell, .inline-doc-print-wrap table.advice-bank td.value-cell {
    text-align: right; vertical-align: bottom;
  }
  .inline-doc-render table.advice-bank td.value-cell .vl,
  .inline-doc-print-wrap table.advice-bank td.value-cell .vl { font-weight: 600; }
  .inline-doc-render table.advice-bank td.value-cell .va,
  .inline-doc-print-wrap table.advice-bank td.value-cell .va {
    font-weight: 700; font-size: 10.5pt; display: block; margin-top: 2px;
  }

  .inline-doc-render .advice-sep, .inline-doc-print-wrap .advice-sep {
    border: none; border-top: 1px dashed #9ca3af; margin: 28px 0 18px;
  }

  /* ---------- Generic table for Invoice ---------- */
  .inline-doc-render table.t, .inline-doc-print-wrap table.t { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
  .inline-doc-render table.t th, .inline-doc-render table.t td,
  .inline-doc-print-wrap table.t th, .inline-doc-print-wrap table.t td { border: 1px solid #333; padding: 5px 7px; vertical-align: top; text-align: left; }
  .inline-doc-render table.t th, .inline-doc-print-wrap table.t th { background: #f3f4f6; font-weight: 700; }
  .inline-doc-render table.t td.num, .inline-doc-render table.t th.num,
  .inline-doc-print-wrap table.t td.num, .inline-doc-print-wrap table.t th.num { text-align: right; white-space: nowrap; }
  .inline-doc-render table.t td.center, .inline-doc-render table.t th.center,
  .inline-doc-print-wrap table.t td.center, .inline-doc-print-wrap table.t th.center { text-align: center; }
  .inline-doc-render table.t tr.totals td, .inline-doc-print-wrap table.t tr.totals td { font-weight: 700; }

  .inline-doc-render .body-text, .inline-doc-print-wrap .body-text { font-size: 10pt; line-height: 1.55; margin: 8px 0; text-align: justify; }
  .inline-doc-render .body-text p, .inline-doc-print-wrap .body-text p { margin: 0 0 8px; }

  /* ---------- Letter (Request Letter) ---------- */
  .inline-doc-render .letter-date, .inline-doc-print-wrap .letter-date {
    text-align: right; font-size: 9.5pt; margin: 16px 0 4px;
  }
  .inline-doc-render .letter-ref, .inline-doc-print-wrap .letter-ref {
    text-align: right; font-size: 9pt; color: #374151; margin-bottom: 18px;
  }
  .inline-doc-render .letter-recipient, .inline-doc-print-wrap .letter-recipient {
    font-size: 10pt; line-height: 1.5; margin: 0 0 18px;
  }
  .inline-doc-render .letter-recipient .rline,
  .inline-doc-print-wrap .letter-recipient .rline { display: block; }
  .inline-doc-render .letter-recipient .rname,
  .inline-doc-print-wrap .letter-recipient .rname { font-weight: 700; }
  .inline-doc-render .letter-subject, .inline-doc-print-wrap .letter-subject {
    font-size: 10pt; font-weight: 700; text-decoration: underline; text-underline-offset: 3px;
    margin: 6px 0 14px;
  }
  .inline-doc-render .letter-body, .inline-doc-print-wrap .letter-body {
    font-size: 10pt; line-height: 1.65; text-align: justify;
  }
  .inline-doc-render .letter-body p, .inline-doc-print-wrap .letter-body p { margin: 0 0 10px; }
  .inline-doc-render .letter-body .salutation, .inline-doc-print-wrap .letter-body .salutation { margin-bottom: 12px; }
  .inline-doc-render table.req-details, .inline-doc-print-wrap table.req-details {
    width: 90%; margin: 6px 0 12px 18px; border-collapse: collapse; font-size: 9.5pt;
  }
  .inline-doc-render table.req-details td, .inline-doc-print-wrap table.req-details td {
    padding: 4px 8px; vertical-align: top;
  }
  .inline-doc-render table.req-details td.lbl, .inline-doc-print-wrap table.req-details td.lbl {
    width: 160px; font-weight: 600; color: #1f2937;
  }
  .inline-doc-render table.req-details tr td, .inline-doc-print-wrap table.req-details tr td { border-bottom: 1px dotted #d1d5db; }
  .inline-doc-render table.req-details tr:last-child td, .inline-doc-print-wrap table.req-details tr:last-child td { border-bottom: none; }
  .inline-doc-render .letter-close, .inline-doc-print-wrap .letter-close { margin-top: 28px; font-size: 10pt; }
  .inline-doc-render .letter-close .yours, .inline-doc-print-wrap .letter-close .yours { margin-bottom: 36px; }
  .inline-doc-render .letter-close .sigline, .inline-doc-print-wrap .letter-close .sigline {
    border-bottom: 1px solid #111; width: 220px; min-height: 14px; margin-bottom: 4px;
  }
  .inline-doc-render .letter-close .signer, .inline-doc-print-wrap .letter-close .signer { font-weight: 700; }
  .inline-doc-render .letter-close .designation, .inline-doc-print-wrap .letter-close .designation { font-size: 9pt; color: #374151; }
  .inline-doc-render .letter-cc, .inline-doc-print-wrap .letter-cc {
    margin-top: 22px; font-size: 9pt; color: #374151;
  }

  @media print {
    body.inline-doc-printing > *:not(.inline-doc-print-anchor) { display: none !important; }
    body.inline-doc-printing .inline-doc-print-anchor { display: block !important; }
  }
`;

const buildLetterheadHtml = () => {
  const meta = [
    PRINT_LETTERHEAD.registrationNo && `Company Registration No. ${PRINT_LETTERHEAD.registrationNo}`,
    PRINT_LETTERHEAD.addressLine,
    [
      PRINT_LETTERHEAD.phone && `T: ${PRINT_LETTERHEAD.phone}`,
      PRINT_LETTERHEAD.fax && `F: ${PRINT_LETTERHEAD.fax}`,
      PRINT_LETTERHEAD.email && `E: ${PRINT_LETTERHEAD.email}`
    ].filter(Boolean).join(' | ')
  ].filter(Boolean).map((m) => `<div class="co-meta">${m}</div>`).join('');
  const logoMark = PRINT_LETTERHEAD.logoText || (PRINT_LETTERHEAD.companyName.split(' ')[0] || '—');
  return `<div class="lh">
    <div>
      <div class="co-name">${PRINT_LETTERHEAD.companyName}</div>
      ${meta}
    </div>
    <div class="logo">${logoMark}</div>
  </div>`;
};

const buildPaymentVoucherDoc = (form, glLines) => {
  const lines = Array.isArray(glLines) && glLines.length
    ? glLines.map((e) => {
        const debit = parseFloat(e.debit) || 0;
        const credit = parseFloat(e.credit) || 0;
        if (debit > 0) return { desc: e.account_name || '—', no: e.account_code || '—', dc: 'DR', amt: debit };
        if (credit > 0) return { desc: e.account_name || '—', no: e.account_code || '—', dc: 'CR', amt: credit };
        return null;
      }).filter(Boolean)
    : [];
  const totalDr = lines.filter((r) => r.dc === 'DR').reduce((s, r) => s + r.amt, 0);
  const totalCr = lines.filter((r) => r.dc === 'CR').reduce((s, r) => s + r.amt, 0);

  const linesHtml = lines.length
    ? lines.map((r) => `<tr><td>${r.desc}</td><td>${r.no}</td><td class="center">${r.dc}</td><td class="num">${formatAmount(r.amt)}</td></tr>`).join('')
    : `<tr><td colspan="4" class="center" style="color:#6b7280; padding: 12px 0;">No journal lines recorded.</td></tr>`;

  const totalsHtml = lines.length ? `
        <tr class="totals totals-first"><td colspan="3" style="text-align:right">Total Credit</td><td class="num">${formatAmount(totalCr)}</td></tr>
        <tr class="totals section-end"><td colspan="3" style="text-align:right">Total Debit</td><td class="num">${formatAmount(totalDr)}</td></tr>
      ` : '';

  const branchCode = form.paymentBranchCode || form.branchCode || '—';
  const branchAccount = form.paymentAccountNumber || '—';
  const branchName = form.paymentBranchName || form.paymentBankName || '—';
  const chequeNo = form.chequeNumber || form.chequeNo || '—';
  const payee = form.counterparty || '—';
  const paymentType = String(form.paymentMethod || '—').toUpperCase();
  const narration = form.description || '—';
  const docAttached = form.reference || '—';
  const dateStr = formatDateDdMmYyyy(form.date);
  const voucherNo = form.voucherNumber || '—';

  // ---------- Payment Voucher (top) ----------
  const voucherHeader = `
    <table class="hdr">
      <colgroup>
        <col style="width: 110px;" />
        <col />
        <col style="width: 110px;" />
        <col style="width: 200px;" />
      </colgroup>
      <tbody>
        <tr class="sep">
          <td class="lbl">Date</td>
          <td class="val">${dateStr}</td>
          <td class="lbl-r">Voucher No</td>
          <td class="val" style="text-align:right;">${voucherNo}</td>
        </tr>
        <tr>
          <td class="lbl">Payee</td>
          <td class="val" colspan="3">${payee}</td>
        </tr>
        <tr>
          <td class="lbl">Payment Type</td>
          <td class="val" colspan="3">${paymentType}</td>
        </tr>
        <tr class="sep">
          <td class="lbl">Narration</td>
          <td class="val" colspan="3">${narration}</td>
        </tr>
        <tr class="sep">
          <td class="lbl">Document Attached</td>
          <td class="val" colspan="3">${docAttached}</td>
        </tr>
      </tbody>
    </table>`;

  const voucherJournal = `
    <table class="jt">
      <colgroup>
        <col />
        <col style="width: 160px;" />
        <col style="width: 70px;" />
        <col style="width: 130px;" />
      </colgroup>
      <thead>
        <tr>
          <th>Account Description</th>
          <th>Account No</th>
          <th class="center">DR/CR</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${linesHtml}
        ${totalsHtml}
      </tbody>
    </table>`;

  const voucherBank = `
    <table class="bank">
      <colgroup>
        <col style="width: 95px;" />
        <col />
        <col style="width: 110px;" />
        <col />
        <col style="width: 100px;" />
        <col />
        <col style="width: 90px;" />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td class="lbl">Branch Code</td>
          <td>${branchCode}</td>
          <td class="lbl">Branch Account</td>
          <td>${branchAccount}</td>
          <td class="lbl">Branch Name</td>
          <td>${branchName}</td>
          <td class="lbl">Cheque No</td>
          <td>${chequeNo}</td>
        </tr>
      </tbody>
    </table>`;

  const signatureGrid = `
    <table class="sigs">
      <tbody>
        <tr>
          <td><span class="slabel">Prepared by</span><span class="sline">&nbsp;</span></td>
          <td><span class="slabel">Approved by</span><span class="sline">&nbsp;</span></td>
          <td><span class="slabel">1st signatory</span><span class="sline">&nbsp;</span></td>
        </tr>
        <tr>
          <td><span class="slabel">2nd signatory</span><span class="sline">&nbsp;</span></td>
          <td><span class="slabel">Received with thanks</span><span class="sline">&nbsp;</span></td>
          <td><span class="slabel">Date</span><span class="sline">&nbsp;</span></td>
        </tr>
      </tbody>
    </table>`;

  // ---------- Payment Advice (bottom) ----------
  const adviceHeader = `
    <table class="hdr">
      <colgroup>
        <col style="width: 110px;" />
        <col />
        <col style="width: 110px;" />
        <col style="width: 200px;" />
      </colgroup>
      <tbody>
        <tr class="sep">
          <td class="lbl">Date</td>
          <td class="val">${dateStr}</td>
          <td class="lbl-r">Voucher No</td>
          <td class="val" style="text-align:right;">${voucherNo}</td>
        </tr>
        <tr>
          <td class="lbl">Payee</td>
          <td class="val" colspan="3">${payee}</td>
        </tr>
        <tr>
          <td class="lbl">Payment Type</td>
          <td class="val" colspan="3">${paymentType}</td>
        </tr>
        <tr class="sep">
          <td class="lbl">Narration</td>
          <td class="val" colspan="3">${narration}</td>
        </tr>
        <tr class="sep">
          <td class="lbl">Document Attached</td>
          <td class="val" colspan="3">${docAttached}</td>
        </tr>
      </tbody>
    </table>`;

  const adviceBank = `
    <table class="advice-bank">
      <colgroup>
        <col style="width: 95px;" />
        <col />
        <col style="width: 110px;" />
        <col />
        <col style="width: 90px;" />
        <col />
        <col style="width: 130px;" />
      </colgroup>
      <tbody>
        <tr>
          <td class="lbl">Branch Code</td>
          <td>${branchCode}</td>
          <td class="lbl">Branch Account</td>
          <td>${branchAccount}</td>
          <td class="lbl">Cheque No</td>
          <td>${chequeNo}</td>
          <td class="value-cell" rowspan="1">
            <span class="vl">Value</span>
            <span class="va">${formatAmount(form.amount)}</span>
          </td>
        </tr>
      </tbody>
    </table>`;

  return `${buildLetterheadHtml()}
  <div class="doc-title">Payment Voucher</div>
  ${voucherHeader}
  ${voucherJournal}
  ${voucherBank}
  ${signatureGrid}

  <hr class="advice-sep" />

  ${buildLetterheadHtml()}
  <div class="doc-title">PAYMENT ADVICE</div>
  ${adviceHeader}
  ${adviceBank}
  <div class="signoff">
    <div>Yours faithfully</div>
    <div class="line"></div>
    <div class="lbl">Authorised Signatory</div>
  </div>`;
};

const buildInvoiceDoc = (form) => {
  const qty = 1;
  const unit = parseFloat(form.amount) || 0;
  const total = qty * unit;
  const desc = form.description || form.transactionType || 'Service / Goods supplied';
  const currency = form.currency || 'LKR';
  const invoiceNo = form.reference || form.voucherNumber || '—';
  const dateStr = formatDateDdMmYyyy(form.date);
  const dueDateStr = dateStr; // No separate due-date field today
  const billTo = form.counterparty || '—';
  const ourRef = form.voucherNumber || '—';
  const paymentTerms = form.paymentMethod ? String(form.paymentMethod).toUpperCase() : 'AS PER AGREEMENT';

  // Top header block (4-column table for label/value pairs)
  const headerBlock = `
    <table class="hdr">
      <colgroup>
        <col style="width: 110px;" />
        <col />
        <col style="width: 110px;" />
        <col style="width: 200px;" />
      </colgroup>
      <tbody>
        <tr class="sep">
          <td class="lbl">Invoice No</td>
          <td class="val">${invoiceNo}</td>
          <td class="lbl-r">Invoice Date</td>
          <td class="val" style="text-align:right;">${dateStr}</td>
        </tr>
        <tr>
          <td class="lbl">Bill To</td>
          <td class="val" colspan="3">${billTo}</td>
        </tr>
        <tr>
          <td class="lbl">Our Reference</td>
          <td class="val">${ourRef}</td>
          <td class="lbl-r">Due Date</td>
          <td class="val" style="text-align:right;">${dueDateStr}</td>
        </tr>
        <tr class="sep">
          <td class="lbl">Payment Terms</td>
          <td class="val" colspan="3">${paymentTerms}</td>
        </tr>
      </tbody>
    </table>`;

  // Line items (minimal-border table to match Payment Voucher style)
  const itemsTable = `
    <table class="jt">
      <colgroup>
        <col style="width: 36px;" />
        <col />
        <col style="width: 56px;" />
        <col style="width: 130px;" />
        <col style="width: 140px;" />
      </colgroup>
      <thead>
        <tr>
          <th class="center">#</th>
          <th>Description</th>
          <th class="center">Qty</th>
          <th class="num">Unit Price (${currency})</th>
          <th class="num">Amount (${currency})</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="center">1</td>
          <td>${desc}</td>
          <td class="center">${qty}</td>
          <td class="num">${formatAmount(unit)}</td>
          <td class="num">${formatAmount(total)}</td>
        </tr>
        <tr class="totals totals-first">
          <td colspan="4" style="text-align:right">Sub Total</td>
          <td class="num">${formatAmount(total)}</td>
        </tr>
        <tr class="totals section-end">
          <td colspan="4" style="text-align:right">Total Payable (${currency})</td>
          <td class="num">${formatAmount(total)}</td>
        </tr>
      </tbody>
    </table>`;

  // Amount in words + notes section
  const wordsBlock = `
    <table class="hdr" style="margin-top: 10px;">
      <colgroup>
        <col style="width: 130px;" />
        <col />
      </colgroup>
      <tbody>
        <tr class="sep">
          <td class="lbl">Amount in Words</td>
          <td class="val" style="font-style: italic;">${numberToWords(total)} ${currency} Only.</td>
        </tr>
        ${form.notes ? `
        <tr class="sep">
          <td class="lbl">Notes</td>
          <td class="val">${form.notes}</td>
        </tr>` : ''}
      </tbody>
    </table>`;

  // Optional bank-payment instructions row (only render if any bank fields exist)
  const hasBankInfo = form.paymentBankName || form.paymentBranchName || form.paymentAccountNumber || form.paymentAccountName;
  const bankBlock = hasBankInfo ? `
    <div style="margin-top: 14px; font-size: 9pt; font-weight: 700; text-decoration: underline; text-underline-offset: 3px;">Payment Instructions</div>
    <table class="bank">
      <colgroup>
        <col style="width: 110px;" />
        <col />
        <col style="width: 110px;" />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td class="lbl">Bank Name</td>
          <td>${form.paymentBankName || '—'}</td>
          <td class="lbl">Branch</td>
          <td>${form.paymentBranchName || '—'}</td>
        </tr>
        <tr>
          <td class="lbl">Account Name</td>
          <td>${form.paymentAccountName || '—'}</td>
          <td class="lbl">Account No</td>
          <td>${form.paymentAccountNumber || '—'}</td>
        </tr>
      </tbody>
    </table>` : '';

  return `${buildLetterheadHtml()}
  <div class="doc-title">INVOICE</div>
  ${headerBlock}
  ${itemsTable}
  ${wordsBlock}
  ${bankBlock}
  <div class="signoff">
    <div>For ${PRINT_LETTERHEAD.companyName}</div>
    <div class="line"></div>
    <div class="lbl">Authorised Signatory</div>
  </div>
  <div style="margin-top: 22px; font-size: 8pt; color: #6b7280; text-align: center;">
    This is a computer-generated invoice. No signature is required if generated electronically.
  </div>`;
};

const buildRequestLetterDoc = (form) => {
  const todayStr = formatDateDdMmYyyy(getToday());
  const recipientName = form.counterparty || form.paymentBankName || 'The Manager';
  const branchLine = form.paymentBranchName ? `${form.paymentBranchName} Branch` : '';
  const bankNameLine = form.paymentBankName && form.paymentBankName !== recipientName ? form.paymentBankName : '';

  const currency = form.currency || 'LKR';
  const amtFigure = formatAmount(form.amount);
  const amtWords = Number.isFinite(parseFloat(form.amount))
    ? `${numberToWords(form.amount)} ${currency} Only`
    : '';

  const accountName = form.paymentAccountName || '';
  const accountNumber = form.paymentAccountNumber || '';
  const accountLine = [accountName, accountNumber].filter(Boolean).join(' / ');

  const subjectRef = form.reference || form.voucherNumber || '';
  const txnLabel = (form.transactionType || 'Transaction Processing').trim();
  const subjectLine = `Request for ${txnLabel}${subjectRef ? ` — Ref: ${subjectRef}` : ''}`;

  // Recipient block (To: ...)
  const recipientBlock = `
    <div class="letter-recipient">
      <span class="rline rname">${recipientName}</span>
      ${bankNameLine ? `<span class="rline">${bankNameLine}</span>` : ''}
      ${branchLine ? `<span class="rline">${branchLine}</span>` : ''}
    </div>`;

  // Detail table inside body (Amount, Account, Purpose, Settlement Note)
  const detailRows = [];
  detailRows.push(`<tr><td class="lbl">Amount</td><td>${currency} ${amtFigure}${amtWords ? ` &nbsp;<em>(${amtWords})</em>` : ''}</td></tr>`);
  if (accountLine) detailRows.push(`<tr><td class="lbl">Account</td><td>${accountLine}</td></tr>`);
  if (form.description) detailRows.push(`<tr><td class="lbl">Purpose</td><td>${form.description}</td></tr>`);
  if (form.cashFlowOnSettlement) detailRows.push(`<tr><td class="lbl">Settlement Note</td><td>${form.cashFlowOnSettlement}</td></tr>`);
  if (subjectRef) detailRows.push(`<tr><td class="lbl">Our Reference</td><td>${subjectRef}</td></tr>`);
  const detailsTable = `
    <table class="req-details">
      <colgroup>
        <col style="width: 160px;" />
        <col />
      </colgroup>
      <tbody>${detailRows.join('')}</tbody>
    </table>`;

  return `${buildLetterheadHtml()}
  <div class="letter-date">Date: ${todayStr}</div>
  ${subjectRef ? `<div class="letter-ref">Our Ref: ${subjectRef}</div>` : ''}

  <div class="letter-recipient">
    <span class="rline" style="font-weight: 600;">To,</span>
  </div>
  ${recipientBlock}

  <div class="letter-subject">Subject: ${subjectLine}</div>

  <div class="letter-body">
    <p class="salutation">Dear Sir/Madam,</p>

    <p>
      We, <strong>${PRINT_LETTERHEAD.companyName}</strong>, hereby kindly request you to process
      the following ${txnLabel.toLowerCase()} on our behalf as per the details set out below:
    </p>

    ${detailsTable}

    <p>
      We confirm that the necessary funds are available in the above account and that the
      relevant internal approvals have been duly obtained for this instruction.
      Kindly debit the said account and execute the settlement accordingly.
    </p>

    <p>
      We would be grateful if you could acknowledge receipt of this letter and confirm completion
      of the transaction at your earliest convenience. Should you require any further information
      or supporting documentation, please do not hesitate to contact the undersigned.
    </p>

    <p>Thank you for your prompt attention and continued support.</p>
  </div>

  <div class="letter-close">
    <div class="yours">Yours faithfully,</div>
    <div>For and on behalf of <strong>${PRINT_LETTERHEAD.companyName}</strong></div>
    <div class="sigline">&nbsp;</div>
    <div class="signer">Authorised Signatory</div>
    <div class="designation">Name &amp; Designation: ________________________</div>
  </div>

  <div class="letter-cc">
    cc: File / Accounts Department
  </div>`;
};

const OtherTransactions = () => {
  const [form, setForm] = useState({
    voucherNumber: generateVoucherNumber(),
    category: '', // Main category (Income, Expense, Asset, Liability)
    subCategory: '', // Sub category (specific category name from account_categories)
    transactionType: '',
    selectedTransactionTypeId: '', // Selected defined transaction type ID
    glAccountCode: '', // Selected GL account code from defined transaction type
    coaDescription: '', // Selected COA description from defined transaction type
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    currency: 'LKR',
    fxRate: '1.00',
    counterparty: '',
    notes: '',
    cashFlowOnSettlement: '',
    selectedAccountId: '',
    settlementAccount: '',
    paymentAccountName: '',
    paymentAccountNumber: '',
    paymentBankName: '',
    paymentBranchName: '',
    paymentMethod: ''
  });

  // Transaction type options based on selected category (dynamically populated from database)
  // For Create Voucher tab
  const [transactionTypes, setTransactionTypes] = useState([]);
  // For Define Transaction tab - store full objects to access transaction_type_code
  const [transactionTypesForDefine, setTransactionTypesForDefine] = useState([]);
  // Defined transaction types for the selected transaction type name (for Create Voucher tab)
  const [definedTransactionTypesForVoucher, setDefinedTransactionTypesForVoucher] = useState([]);
  const [definedTransactionTypesLoading, setDefinedTransactionTypesLoading] = useState(false);
  
  // Account categories grouped by account_type (for Category dropdown)
  // Keys here are the "main categories" you want to expose in Non-Trading Transactions.
  const [accountCategories, setAccountCategories] = useState({
    revenue: [],
    otherIncome: [],
    provisions: [],
    expense: [],
    asset: [],
    liability: [],
    equity: []
  });
  // Full category objects grouped by account_type (for Sub Category dropdown)
  const [categoriesByType, setCategoriesByType] = useState({
    revenue: [],
    otherIncome: [],
    provisions: [],
    expense: [],
    asset: [],
    liability: [],
    equity: []
  });
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [accountsWithMapping, setAccountsWithMapping] = useState([]); // Accounts that have GL mappings

  // Inline (in-modal) Voucher / Invoice / Request Letter document state
  const [inlineDocType, setInlineDocType] = useState(null); // 'voucher' | 'invoice' | 'letter' | null
  const [inlineDocHtml, setInlineDocHtml] = useState('');
  const [inlineDocTitle, setInlineDocTitle] = useState('');
  const [inlineDocEditing, setInlineDocEditing] = useState(false);
  const [inlineDocPdfLoading, setInlineDocPdfLoading] = useState(false);
  const [inlineDocFmtState, setInlineDocFmtState] = useState({ bold: false, italic: false, underline: false });
  const inlineDocRef = useRef(null);

  // Inject the shared inline-document stylesheet once
  useEffect(() => {
    const id = 'inline-doc-shared-style';
    if (document.getElementById(id)) return;
    const styleEl = document.createElement('style');
    styleEl.id = id;
    styleEl.innerHTML = INLINE_DOC_STYLE;
    document.head.appendChild(styleEl);
  }, []);

  // Imperatively set the inline document HTML when a *new* document is generated.
  // Using ref-based assignment (instead of dangerouslySetInnerHTML) so the contents
  // are NOT overwritten on every re-render — that's what was wiping the user's edits.
  useEffect(() => {
    if (!inlineDocRef.current) return;
    if (inlineDocType && inlineDocHtml) {
      inlineDocRef.current.innerHTML = inlineDocHtml;
    } else {
      inlineDocRef.current.innerHTML = '';
    }
  }, [inlineDocType, inlineDocHtml]);

  // Holidays for date validation
  const [holidays, setHolidays] = useState([]);
  const [dateErrors, setDateErrors] = useState({
    date: ''
  });
  
  // New states for viewing vouchers and general ledger
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'defineTransaction', 'view', 'generalLedger', 'reverseTransaction'
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'income', 'expense', 'asset', 'liability'
  
  // Form type state for Create Voucher tab (voucher, assetDepreciation, assetDerecognition, liabilitySettlement, glToGl)
  const [activeFormType, setActiveFormType] = useState('voucher'); // 'voucher', 'assetDepreciation', 'assetDerecognition', 'liabilitySettlement', 'glToGl'
  
  // Asset Depreciation form state
  const [assetDepreciationForm, setAssetDepreciationForm] = useState({
    voucherNumber: generateVoucherNumber(),
    assetAccountCode: '',
    assetAccountName: '',
    depreciationExpenseAccountCode: '',
    depreciationExpenseAccountName: '',
    accumulatedDepreciationAccountCode: '',
    accumulatedDepreciationAccountName: '',
    depreciationAmount: '',
    depreciationDate: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    notes: ''
  });

  // Asset Derecognition form state
  const [assetDerecognitionForm, setAssetDerecognitionForm] = useState({
    voucherNumber: generateVoucherNumber(),
    assetAccountCode: '',
    assetAccountName: '',
    accumulatedDepreciationAccountCode: '',
    accumulatedDepreciationAccountName: '',
    proceedsAccountCode: '',
    proceedsAccountName: '',
    gainLossAccountCode: '',
    gainLossAccountName: '',
    assetBookValue: '',
    saleProceeds: '',
    gainLossAmount: '',
    derecognitionDate: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    notes: ''
  });

  // Liability Settlement form state
  const [liabilitySettlementForm, setLiabilitySettlementForm] = useState({
    voucherNumber: generateLiabilitySettlementVoucherNumber(),
    selectedVoucherId: '', // For voucher dropdown
    accountType: 'liability', // Fixed to liability for this form type
    category: 'liability', // Main category (fixed to liability)
    subCategory: '', // Sub category (specific category name from account_categories)
    transactionType: '', // Transaction type name
    glAccountCode: '', // Liability account code (mapped from liabilityAccountCode)
    coaDescription: '', // Liability account name/description (mapped from liabilityAccountName)
    amount: '', // Settlement amount (mapped from settlementAmount)
    date: new Date().toISOString().split('T')[0], // Settlement date (mapped from settlementDate)
    description: '',
    reference: '',
    currency: 'LKR', // Default currency
    fxRate: '1.00', // Default FX rate
    counterparty: '', // Optional
    notes: '',
    cashFlowOnSettlement: '', // Auto-calculated
    selectedAccountId: '', // For account dropdown
    paymentAccountName: '',
    paymentAccountNumber: '',
    paymentBankName: '',
    paymentBranchName: '',
    paymentMethod: ''
  });

  const newGlJournalLineId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  // GL to GL: shared header + multiple debit/credit lines (balanced journal; multi-line API pending)
  const [glToGlForm, setGlToGlForm] = useState({
    voucherNumber: generateVoucherNumber(),
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    notes: ''
  });
  const [glToGlDebitLines, setGlToGlDebitLines] = useState(() => [
    { id: newGlJournalLineId(), accountCode: '', accountName: '', amount: '' }
  ]);
  const [glToGlCreditLines, setGlToGlCreditLines] = useState(() => [
    { id: newGlJournalLineId(), accountCode: '', accountName: '', amount: '' }
  ]);
  const [glToGlDebitFixed, setGlToGlDebitFixed] = useState(false);
  const [glToGlCreditFixed, setGlToGlCreditFixed] = useState(false);
  const [glToGlDebitFixMessage, setGlToGlDebitFixMessage] = useState('');
  const [glToGlCreditFixMessage, setGlToGlCreditFixMessage] = useState('');
  
  // Transaction types for Liability Settlement form
  const [transactionTypesForLiabilitySettlement, setTransactionTypesForLiabilitySettlement] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  // Store original voucher details for description generation
  const [originalVoucherDetails, setOriginalVoucherDetails] = useState({ voucherNumber: '', amount: '' });
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [generalLedgerEntries, setGeneralLedgerEntries] = useState([]);
  const [generalLedgerLoading, setGeneralLedgerLoading] = useState(false);
  const [generalLedgerVoucherSearch, setGeneralLedgerVoucherSearch] = useState('');
  const [generalLedgerCurrentPage, setGeneralLedgerCurrentPage] = useState(1);
  const [generalLedgerEntriesPerPage] = useState(50);
  // Reverse Transaction form state
  const [reverseForm, setReverseForm] = useState({ category: '', subCategory: '', transactionType: '', voucherId: '', voucherNumber: '', amount: '', cashFlowOnSettlement: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [reverseSubmitting, setReverseSubmitting] = useState(false);
  const [reverseMessage, setReverseMessage] = useState('');
  // Transaction types for Reverse Transaction tab
  const [transactionTypesForReverse, setTransactionTypesForReverse] = useState([]);

  // States for Define Transaction tab
  const [transactionTypeForm, setTransactionTypeForm] = useState({
    category: '', // Main category (Income, Expense, Asset, Liability)
    sub_category: '', // Sub category (specific category name from account_categories)
    transaction_type_name: '',
    gl_account_code: '',
    use_common_account: true,
    description: '',
    coa_description: '' // Description from chart of accounts (auto-filled when account code is selected)
  });
  const [definedTransactionTypes, setDefinedTransactionTypes] = useState([]);
  const [transactionTypesLoading, setTransactionTypesLoading] = useState(false);
  const [editingTransactionTypeId, setEditingTransactionTypeId] = useState(null);
  const [transactionTypeMessage, setTransactionTypeMessage] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(''); // For filtering defined transaction types
  const [chartAccounts, setChartAccounts] = useState([]);
  const [chartAccountsLoading, setChartAccountsLoading] = useState(false);
  const [coaSearchTerm, setCoaSearchTerm] = useState('');
  const [showCoaList, setShowCoaList] = useState(false);
  // For Liability Settlement form - liability account search
  const [liabilityAccountSearchTerm, setLiabilityAccountSearchTerm] = useState('');
  const [showLiabilityAccountList, setShowLiabilityAccountList] = useState(false);

  // Helper function to normalize a date to YYYY-MM-DD format (avoiding timezone issues)
  const normalizeDate = (dateInput, addOneDay = false) => {
    if (!dateInput) return null;
    
    let normalizedDate = null;
    
    // If it's already a string in YYYY-MM-DD format, use it directly
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      // Check if it's already in the correct format
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        normalizedDate = trimmed;
      } else {
        // Extract YYYY-MM-DD pattern from any string format
        const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch && dateMatch[1]) {
          normalizedDate = dateMatch[1];
        }
      }
    }
    // If it's a Date object, extract date part
    else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      // Use local date components to avoid timezone conversion issues
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      normalizedDate = `${year}-${month}-${day}`;
    }
    // For any other type, convert to string and try to extract date
    else {
      const dateStr = String(dateInput).trim();
      const dateMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch && dateMatch[1]) {
        normalizedDate = dateMatch[1];
      }
    }
    
    // If we need to add one day (workaround for timezone shift)
    if (normalizedDate && addOneDay) {
      const date = new Date(normalizedDate + 'T12:00:00'); // Use noon to avoid timezone issues
      date.setDate(date.getDate() + 1); // Add one day
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return normalizedDate;
  };

  // Helper function to check if a date is a weekend (Saturday or Sunday)
  const isWeekend = (dateString) => {
    if (!dateString) return false;
    const normalizedDate = normalizeDate(dateString);
    if (!normalizedDate) return false;
    
    const date = new Date(normalizedDate + 'T12:00:00');
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // Helper function to check if a date is a holiday
  // For recurring holidays, matches by month and day (ignoring year)
  // For non-recurring holidays, matches exact date
  const isHoliday = (dateString) => {
    if (!dateString || holidays.length === 0) return null;
    
    // Normalize the input date to YYYY-MM-DD format
    const checkDate = normalizeDate(dateString);
    if (!checkDate) {
      console.warn('Could not normalize date for holiday check:', dateString);
      return null;
    }
    
    // Find matching holiday
    const holiday = holidays.find(h => {
      // Holiday dates are already normalized when fetched, but normalize again to be safe
      const holidayDate = normalizeDate(h.date);
      if (!holidayDate) return false;
      
      // If holiday is recurring, match by month and day (MM-DD)
      if (h.isRecurring) {
        const checkMonthDay = checkDate.substring(5); // Extract MM-DD from YYYY-MM-DD
        const holidayMonthDay = holidayDate.substring(5); // Extract MM-DD from YYYY-MM-DD
        return checkMonthDay === holidayMonthDay;
      }
      
      // For non-recurring holidays, match exact date
      return String(holidayDate) === String(checkDate);
    });
    
    return holiday || null;
  };

  // Helper function to validate a date field (checks both holidays and weekends)
  const validateDateField = (fieldName, dateValue) => {
    if (!dateValue) {
      setDateErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
      return true;
    }

    // Check if it's a weekend
    if (isWeekend(dateValue)) {
      const date = new Date(normalizeDate(dateValue) + 'T12:00:00');
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      setDateErrors(prev => ({
        ...prev,
        [fieldName]: `${dayName} is not a business day. Please select a weekday.`
      }));
      return false;
    }

    // Check if it's a holiday
    const holiday = isHoliday(dateValue);
    if (holiday) {
      setDateErrors(prev => ({
        ...prev,
        [fieldName]: `${holiday.name} - ${holiday.type}. Please select a business day.`
      }));
      return false;
    }

    // Valid date
    setDateErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
    return true;
  };

  // Fetch holidays for date validation on mount
  useEffect(() => {
    holidayService.getAllHolidays()
      .then(data => {
        // Normalize all holiday dates to YYYY-MM-DD format to avoid timezone issues
        // WORKAROUND: Add one day to compensate for timezone shift (dates read as one day early)
        const normalizedHolidays = (data || []).map(holiday => {
          // Normalize the date and add one day to compensate for timezone shift
          let normalizedDate = normalizeDate(holiday.date, true); // true = add one day
          
          // If normalization failed, log for debugging
          if (!normalizedDate && holiday.date) {
            console.warn('Could not normalize holiday date:', {
              original: holiday.date,
              type: typeof holiday.date,
              holidayName: holiday.name
            });
            
            // Final fallback: try to extract YYYY-MM-DD pattern from string representation
            const dateStr = String(holiday.date);
            const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
            if (match && match[1]) {
              // Add one day to the extracted date
              const date = new Date(match[1] + 'T12:00:00');
              date.setDate(date.getDate() + 1);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              normalizedDate = `${year}-${month}-${day}`;
            }
          }
          
          return {
            ...holiday,
            date: normalizedDate
          };
        }).filter(holiday => {
          // Only keep holidays with valid normalized dates
          const isValid = holiday.date && /^\d{4}-\d{2}-\d{2}$/.test(holiday.date);
          if (!isValid) {
            console.warn('Filtered out holiday with invalid date:', holiday);
          }
          return isValid;
        });
        
        setHolidays(normalizedHolidays);
      })
      .catch(err => {
        console.error('Error loading holidays:', err);
        setHolidays([]);
      });
  }, []);

  // Fetch accounts, GL mappings, and account categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setAccountsLoading(true);
        setCategoriesLoading(true);
        const [accountData, mappingData, categoriesData, transactionTypesData] = await Promise.all([
          accountAPI.getAllAccounts().catch(() => []),
          glAccountMappingAPI.getAll().catch(() => []),
          accountCategoryAPI.getAll().catch(() => []),
          accountCategoryAPI.getAllTransactionTypes().catch(() => [])
        ]);
        
        setAccounts(accountData || []);
        
        // Build list of account IDs that have GL mappings
        const mappedAccountIds = [];
        if (mappingData && Array.isArray(mappingData)) {
          mappingData.forEach(mapping => {
            mappedAccountIds.push(mapping.account_id);
          });
        }
        
        setAccountsWithMapping(mappedAccountIds);
        
        // Group categories by account_type (revenue, otherIncome, provisions, expense, asset, liability, equity)
        const grouped = {
          revenue: [],
          otherIncome: [],
          provisions: [],
          expense: [],
          asset: [],
          liability: [],
          equity: []
        };
        
        // Also store full category objects for sub-category dropdown
        const categoriesByType = {
          revenue: [],
          otherIncome: [],
          provisions: [],
          expense: [],
          asset: [],
          liability: [],
          equity: []
        };
        
        // Process top-level categories from database
        categoriesData.forEach(cat => {
          const accountType = cat.account_type?.toLowerCase();
          if (accountType === 'revenue') {
            grouped.revenue.push(cat.category_name);
            categoriesByType.revenue.push(cat);
          } else if (accountType === 'other income') {
            grouped.otherIncome.push(cat.category_name);
            categoriesByType.otherIncome.push(cat);
          } else if (accountType === 'provisions') {
            grouped.provisions.push(cat.category_name);
            categoriesByType.provisions.push(cat);
          } else if (accountType === 'expense') {
            grouped.expense.push(cat.category_name);
            categoriesByType.expense.push(cat);
          } else if (accountType === 'asset') {
            grouped.asset.push(cat.category_name);
            categoriesByType.asset.push(cat);
          } else if (accountType === 'liability') {
            grouped.liability.push(cat.category_name);
            categoriesByType.liability.push(cat);
          } else if (accountType === 'equity') {
            grouped.equity.push(cat.category_name);
            categoriesByType.equity.push(cat);
          }
        });
        
        // Extract sub-categories from transaction types (like in NewGLAccount.js)
        const subCategoriesFromTransactionTypes = {
          revenue: [],
          otherIncome: [],
          provisions: [],
          expense: [],
          asset: [],
          liability: [],
          equity: []
        };
        
        transactionTypesData.forEach(tt => {
          const accountType = tt.account_type?.toLowerCase();
          let mappedType = '';
          
          if (accountType === 'revenue') {
            mappedType = 'revenue';
          } else if (accountType === 'other income') {
            mappedType = 'otherIncome';
          } else if (accountType === 'provisions') {
            mappedType = 'provisions';
          } else if (accountType === 'expense') {
            mappedType = 'expense';
          } else if (accountType === 'asset') {
            mappedType = 'asset';
          } else if (accountType === 'liability') {
            mappedType = 'liability';
          } else if (accountType === 'equity') {
            mappedType = 'equity';
          }
          
          if (mappedType && tt.category_name) {
            // Check if this sub-category already exists
            if (!subCategoriesFromTransactionTypes[mappedType].some(cat => cat.category_name === tt.category_name)) {
              // Create a category object from transaction type data
              subCategoriesFromTransactionTypes[mappedType].push({
                id: tt.id || `tt-${tt.category_name}`,
                category_name: tt.category_name,
                account_type: tt.account_type,
                category_number: tt.category_number
              });
            }
          }
        });
        
        // Merge categories from database with sub-categories from transaction types
        Object.keys(subCategoriesFromTransactionTypes).forEach(type => {
          subCategoriesFromTransactionTypes[type].forEach(subCat => {
            // Add to grouped if not already present
            if (!grouped[type].includes(subCat.category_name)) {
              grouped[type].push(subCat.category_name);
            }
            // Add to categoriesByType if not already present
            if (!categoriesByType[type].some(cat => cat.category_name === subCat.category_name)) {
              categoriesByType[type].push(subCat);
            }
          });
        });
        
        // Remove duplicates and sort
        grouped.revenue = [...new Set(grouped.revenue)].sort();
        grouped.otherIncome = [...new Set(grouped.otherIncome)].sort();
        grouped.provisions = [...new Set(grouped.provisions)].sort();
        grouped.expense = [...new Set(grouped.expense)].sort();
        grouped.asset = [...new Set(grouped.asset)].sort();
        grouped.liability = [...new Set(grouped.liability)].sort();
        grouped.equity = [...new Set(grouped.equity)].sort();
        
        setAccountCategories(grouped);
        setCategoriesByType(categoriesByType);
        
        // Debug: Verify equity categories are loaded
        if (categoriesByType.equity && categoriesByType.equity.length > 0) {
          console.log('✅ Equity categories loaded:', categoriesByType.equity);
        } else {
          console.log('⚠️ No equity categories found. Equity array:', categoriesByType.equity);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setAccounts([]);
        setAccountCategories({ revenue: [], otherIncome: [], provisions: [], expense: [], asset: [], liability: [], equity: [] });
        setCategoriesByType({ revenue: [], otherIncome: [], provisions: [], expense: [], asset: [], liability: [], equity: [] });
      } finally {
        setAccountsLoading(false);
        setCategoriesLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch vouchers when viewing tab is active
  useEffect(() => {
    if (activeTab === 'view') {
      fetchVouchers();
    } else if (activeTab === 'generalLedger') {
      fetchGeneralLedger();
    } else if (activeTab === 'defineTransaction') {
      fetchTransactionTypes();
      // Refresh account categories in case new ones were added
      const refreshCategories = async () => {
        try {
          setCategoriesLoading(true);
          const [categoriesData, transactionTypesData] = await Promise.all([
            accountCategoryAPI.getAll().catch(() => []),
            accountCategoryAPI.getAllTransactionTypes().catch(() => [])
          ]);
          
          // Group categories by account_type (revenue, otherIncome, provisions, expense, asset, liability, equity)
          const grouped = {
            revenue: [],
            otherIncome: [],
            provisions: [],
            expense: [],
            asset: [],
            liability: [],
            equity: []
          };
          
          const categoriesByType = {
            revenue: [],
            otherIncome: [],
            provisions: [],
            expense: [],
            asset: [],
            liability: [],
            equity: []
          };
          
          // Process top-level categories from database
          categoriesData.forEach(cat => {
            const accountType = cat.account_type?.toLowerCase();
            if (accountType === 'revenue') {
              grouped.revenue.push(cat.category_name);
              categoriesByType.revenue.push(cat);
            } else if (accountType === 'other income') {
              grouped.otherIncome.push(cat.category_name);
              categoriesByType.otherIncome.push(cat);
            } else if (accountType === 'provisions') {
              grouped.provisions.push(cat.category_name);
              categoriesByType.provisions.push(cat);
            } else if (accountType === 'expense') {
              grouped.expense.push(cat.category_name);
              categoriesByType.expense.push(cat);
            } else if (accountType === 'asset') {
              grouped.asset.push(cat.category_name);
              categoriesByType.asset.push(cat);
            } else if (accountType === 'liability') {
              grouped.liability.push(cat.category_name);
              categoriesByType.liability.push(cat);
            } else if (accountType === 'equity') {
              grouped.equity.push(cat.category_name);
              categoriesByType.equity.push(cat);
            }
          });
          
          // Extract sub-categories from transaction types
          const subCategoriesFromTransactionTypes = {
            revenue: [],
            otherIncome: [],
            provisions: [],
            expense: [],
            asset: [],
            liability: [],
            equity: []
          };
          
          transactionTypesData.forEach(tt => {
            const accountType = tt.account_type?.toLowerCase();
            let mappedType = '';
            
            if (accountType === 'revenue') {
              mappedType = 'revenue';
            } else if (accountType === 'other income') {
              mappedType = 'otherIncome';
            } else if (accountType === 'provisions') {
              mappedType = 'provisions';
            } else if (accountType === 'expense') {
              mappedType = 'expense';
            } else if (accountType === 'asset') {
              mappedType = 'asset';
            } else if (accountType === 'liability') {
              mappedType = 'liability';
            } else if (accountType === 'equity') {
              mappedType = 'equity';
            }
            
            if (mappedType && tt.category_name) {
              // Check if this sub-category already exists
              if (!subCategoriesFromTransactionTypes[mappedType].some(cat => cat.category_name === tt.category_name)) {
                // Create a category object from transaction type data
                subCategoriesFromTransactionTypes[mappedType].push({
                  id: tt.id || `tt-${tt.category_name}`,
                  category_name: tt.category_name,
                  account_type: tt.account_type,
                  category_number: tt.category_number
                });
              }
            }
          });
          
          // Merge categories from database with sub-categories from transaction types
          Object.keys(subCategoriesFromTransactionTypes).forEach(type => {
            subCategoriesFromTransactionTypes[type].forEach(subCat => {
              // Add to grouped if not already present
              if (!grouped[type].includes(subCat.category_name)) {
                grouped[type].push(subCat.category_name);
              }
              // Add to categoriesByType if not already present
              if (!categoriesByType[type].some(cat => cat.category_name === subCat.category_name)) {
                categoriesByType[type].push(subCat);
              }
            });
          });
          
          // Remove duplicates and sort
          grouped.revenue = [...new Set(grouped.revenue)].sort();
          grouped.otherIncome = [...new Set(grouped.otherIncome)].sort();
          grouped.provisions = [...new Set(grouped.provisions)].sort();
          grouped.expense = [...new Set(grouped.expense)].sort();
          grouped.asset = [...new Set(grouped.asset)].sort();
          grouped.liability = [...new Set(grouped.liability)].sort();
          grouped.equity = [...new Set(grouped.equity)].sort();
          
          setAccountCategories(grouped);
          setCategoriesByType(categoriesByType);
        } catch (error) {
          console.error('Error refreshing categories:', error);
        } finally {
          setCategoriesLoading(false);
        }
      };
      refreshCategories();
      
      // Fetch Chart of Accounts for GL Account dropdown
      const loadCoA = async () => {
        try {
          setChartAccountsLoading(true);
          const coa = await chartOfAccountsAPI.getAll();
          setChartAccounts(Array.isArray(coa) ? coa : []);
        } catch (e) {
          console.error('Error fetching chart of accounts:', e);
          setChartAccounts([]);
        } finally {
          setChartAccountsLoading(false);
        }
      };
      loadCoA();
    } else if (activeTab === 'reverseTransaction') {
      // Ensure vouchers are available for the voucher dropdown
      fetchVouchers();
    } else if (activeTab === 'create' && activeFormType === 'liabilitySettlement') {
      // Ensure vouchers are available for the liability settlement voucher dropdown
      fetchVouchers();
    } else if (activeTab === 'create' && activeFormType === 'glToGl') {
      // Fetch Chart of Accounts for GL to GL postings
      const loadCoA = async () => {
        try {
          setChartAccountsLoading(true);
          const coa = await chartOfAccountsAPI.getAll();
          setChartAccounts(Array.isArray(coa) ? coa : []);
        } catch (e) {
          console.error('Error fetching chart of accounts:', e);
          setChartAccounts([]);
        } finally {
          setChartAccountsLoading(false);
        }
      };
      loadCoA();
    }
  }, [activeTab, activeFormType]);

  // Fetch general ledger entries for Other Transactions only
  const fetchGeneralLedger = async () => {
    try {
      setGeneralLedgerLoading(true);
      
      // Fetch GL entries specific to Other Transactions for the logged-in user
      const data = await otherTransactionGLEntryAPI.getEntriesByUser();
      setGeneralLedgerEntries(data || []);
    } catch (error) {
      console.error('Error fetching other transaction GL entries:', error);
      setGeneralLedgerEntries([]);
    } finally {
      setGeneralLedgerLoading(false);
    }
  };

  useEffect(() => {
    setGeneralLedgerCurrentPage(1);
  }, [generalLedgerVoucherSearch, generalLedgerEntries]);

  /** GL tab: filter by voucher # (stored in `reference`; also checks `voucher_number` if present) */
  const displayGeneralLedgerEntries = useMemo(() => {
    const q = generalLedgerVoucherSearch.trim().toLowerCase();
    const allRows = q
      ? generalLedgerEntries.filter((entry) => {
          const voucher = String(entry.reference ?? entry.voucher_number ?? '').toLowerCase();
          return voucher.includes(q);
        })
      : generalLedgerEntries;

    const totalCount = allRows.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / generalLedgerEntriesPerPage));
    const safePage = Math.min(Math.max(1, generalLedgerCurrentPage), totalPages);
    const indexOfLast = safePage * generalLedgerEntriesPerPage;
    const indexOfFirst = indexOfLast - generalLedgerEntriesPerPage;
    const rows = allRows.slice(indexOfFirst, indexOfLast);

    return {
      rows,
      isFiltered: Boolean(q),
      matchCount: q ? totalCount : totalCount,
      totalCount,
      totalPages,
      currentPage: safePage,
      indexOfFirst,
      indexOfLast: Math.min(indexOfLast, totalCount)
    };
  }, [
    generalLedgerEntries,
    generalLedgerVoucherSearch,
    generalLedgerCurrentPage,
    generalLedgerEntriesPerPage
  ]);

  // Fetch vouchers based on category filter
  const fetchVouchers = async () => {
    try {
      setVouchersLoading(true);
      const user = authService.getStoredUser();
      const userEmail = user?.email || '';
      
      const data = await otherTransactionAPI.getTransactionsByUser(userEmail);
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      setVouchers([]);
    } finally {
      setVouchersLoading(false);
    }
  };

  // Filter vouchers by active category
  const getFilteredVouchers = () => {
    if (activeCategory === 'all') {
      return vouchers;
    }
    // Filter by base category - handle both old base categories and new specific categories
    return vouchers.filter(v => {
      if (v.account_type === activeCategory) return true; // Exact match for old data
      const baseCategory = getBaseCategory(v.account_type);
      return baseCategory === activeCategory; // Match by base category for new specific categories
    });
  };

  // Filter out reversed transactions and reversals for the Reverse Transaction dropdown
  const getAvailableVouchersForReversal = () => {
    // Group reversals by original voucher number and sum their amounts
    const reversalAmountsByOriginal = {};
    vouchers
      .filter(v => v.voucher_number && v.voucher_number.startsWith('RV-'))
      .forEach(v => {
        const originalVoucherNumber = v.voucher_number.substring(3); // Remove "RV-" prefix
        const reversalAmount = parseFloat(v.amount) || 0;
        if (!reversalAmountsByOriginal[originalVoucherNumber]) {
          reversalAmountsByOriginal[originalVoucherNumber] = 0;
        }
        reversalAmountsByOriginal[originalVoucherNumber] += reversalAmount;
      });
    
    // Filter out:
    // 1. Vouchers that are reversals themselves (start with "RV-")
    // 2. Vouchers that have been fully reversed (total reversed amount >= original amount)
    return vouchers.filter(v => {
      if (!v.voucher_number) return false;
      if (v.voucher_number.startsWith('RV-')) return false; // Exclude reversal vouchers
      
      // Check if this voucher has been fully reversed
      const totalReversed = reversalAmountsByOriginal[v.voucher_number] || 0;
      const originalAmount = parseFloat(v.amount) || 0;
      
      // Only exclude if fully reversed (with small tolerance for floating point)
      if (totalReversed >= originalAmount - 0.01) {
        return false; // Fully reversed, exclude
      }
      
      // Partially reversed or not reversed at all, show it
      return true;
    });
  };

  // Fetch all transaction types
  const fetchTransactionTypes = async () => {
    try {
      setTransactionTypesLoading(true);
      const data = await otherTransactionTypeAPI.getAll();
      console.log('📥 All transaction types fetched:', data);
      
      // Filter to only show active transaction types
      const activeTypes = (data || []).filter(t => t.is_active !== false);
      console.log('✅ Active transaction types:', activeTypes);
      
      setDefinedTransactionTypes(activeTypes);
    } catch (error) {
      console.error('❌ Error fetching transaction types:', error);
      setDefinedTransactionTypes([]);
    } finally {
      setTransactionTypesLoading(false);
    }
  };

  // Handle transaction type form changes
  const handleTransactionTypeChange = (e) => {
    const { name, value } = e.target;
    
    // If category (main category) changes, clear sub_category and transaction_type_name
    if (name === 'category') {
      // Debug: Log when equity is selected
      if (value === 'equity') {
        console.log('🔵 Equity selected. Available categories:', categoriesByType.equity);
        console.log('🔵 categoriesByType object keys:', Object.keys(categoriesByType));
        console.log('🔵 categoriesByType.equity exists?', !!categoriesByType.equity);
        console.log('🔵 categoriesByType.equity length:', categoriesByType.equity?.length || 0);
      }
      setTransactionTypeForm(prev => ({
        ...prev,
        category: value,
        sub_category: '', // Clear sub category when main category changes
        transaction_type_name: '', // Clear transaction type name when category changes
        gl_account_code: '', // Clear GL account code when category changes
        coa_description: '' // Clear COA description when category changes
      }));
    } else if (name === 'sub_category') {
      // If sub_category changes, clear transaction_type_name
      setTransactionTypeForm(prev => ({
        ...prev,
        sub_category: value,
        transaction_type_name: '', // Clear transaction type name when sub category changes
        gl_account_code: '', // Clear GL account code when sub category changes
        coa_description: '' // Clear COA description when sub category changes
      }));
    } else if (name === 'transaction_type_name') {
      // If transaction_type_name changes, clear GL account code and COA description
      // This ensures filtering works correctly when a new transaction type is selected
      setTransactionTypeForm(prev => ({
        ...prev,
        transaction_type_name: value,
        gl_account_code: '', // Clear GL account code when transaction type changes
        coa_description: '', // Clear COA description when transaction type changes
        coaSearchTerm: '' // Clear search term
      }));
      setCoaSearchTerm(''); // Clear the search term state
    } else {
      setTransactionTypeForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle transaction type form submission
  const handleTransactionTypeSubmit = async (e) => {
    e.preventDefault();
    
    if (!transactionTypeForm.category || !transactionTypeForm.sub_category || !transactionTypeForm.transaction_type_name) {
      setTransactionTypeMessage('Category, Sub Category, and Transaction Type Name are required');
      setTimeout(() => setTransactionTypeMessage(''), 3000);
      return;
    }
    // If not using common account, GL code is required
    if (transactionTypeForm.use_common_account === false && !transactionTypeForm.gl_account_code) {
      setTransactionTypeMessage('GL Account Code is required when not using the common account');
      setTimeout(() => setTransactionTypeMessage(''), 3000);
      return;
    }

    try {
      // Prepare data for backend: send base category (income, expense, asset, liability) as category
      // The backend validation expects base categories or specific hardcoded categories
      const submitData = {
        category: normalizeCategoryForApi(transactionTypeForm.category),
        sub_category: transactionTypeForm.sub_category, // Store the sub-category name separately
        transaction_type_name: transactionTypeForm.transaction_type_name,
        gl_account_code: transactionTypeForm.gl_account_code,
        use_common_account: transactionTypeForm.use_common_account,
        description: transactionTypeForm.description,
        coa_description: transactionTypeForm.coa_description || null // Description from Chart of Accounts
      };
      
      // Debug: Log what we're sending
      console.log('📤 Submitting transaction type with coa_description:', {
        gl_account_code: submitData.gl_account_code,
        coa_description: submitData.coa_description,
        has_coa_description: !!submitData.coa_description
      });
      
      if (editingTransactionTypeId) {
        // Update existing transaction type
        await otherTransactionTypeAPI.update(editingTransactionTypeId, submitData);
        setTransactionTypeMessage('Transaction type updated successfully!');
      } else {
        // Create new transaction type
        await otherTransactionTypeAPI.create(submitData);
        setTransactionTypeMessage('Transaction type created successfully!');
      }
      
      // Reset form and fetch updated list
      setTransactionTypeForm({
        category: '',
        sub_category: '',
        transaction_type_name: '',
        gl_account_code: '',
        use_common_account: true,
        description: '',
        coa_description: ''
      });
      setEditingTransactionTypeId(null);
      fetchTransactionTypes();
      
      setTimeout(() => setTransactionTypeMessage(''), 3000);
    } catch (error) {
      console.error('Error saving transaction type:', error);
      setTransactionTypeMessage('Error saving transaction type. Please try again.');
      setTimeout(() => setTransactionTypeMessage(''), 3000);
    }
  };

  // Handle edit transaction type
  const handleEditTransactionType = (transactionType) => {
    // Determine main category from the sub_category (category_name)
    // The backend stores the sub-category name in the 'category' field
    const subCategoryName = transactionType.category || transactionType.sub_category || '';
    
    // Find which main category this sub-category belongs to
    let mainCategory = '';
    for (const [type, categories] of Object.entries(categoriesByType)) {
      if (categories.some(cat => cat.category_name === subCategoryName)) {
        mainCategory = type;
        break;
      }
    }
    
    // Get coa_description from saved transaction type, or find from chart of accounts if not saved
    let coaDescription = transactionType.coa_description || '';
    if (!coaDescription && transactionType.gl_account_code) {
      const selectedCoaAccount = chartAccounts.find(acc => acc.account_code === transactionType.gl_account_code);
      coaDescription = selectedCoaAccount?.description || '';
    }
    
    setTransactionTypeForm({
      category: mainCategory, // Main category (Income, Expense, Asset, Liability)
      sub_category: subCategoryName, // Sub category (the actual category name)
      transaction_type_name: transactionType.transaction_type_name,
      gl_account_code: transactionType.gl_account_code || '',
      use_common_account: transactionType.use_common_account !== undefined ? !!transactionType.use_common_account : true,
      description: transactionType.description || '',
      coa_description: coaDescription
    });
    setEditingTransactionTypeId(transactionType.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete transaction type
  const handleDeleteTransactionType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction type?')) {
      return;
    }

    try {
      await otherTransactionTypeAPI.delete(id);
      setTransactionTypeMessage('Transaction type deleted successfully!');
      fetchTransactionTypes();
      setTimeout(() => setTransactionTypeMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting transaction type:', error);
      setTransactionTypeMessage('Error deleting transaction type. Please try again.');
      setTimeout(() => setTransactionTypeMessage(''), 3000);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setTransactionTypeForm({
      category: '',
      sub_category: '',
      transaction_type_name: '',
      gl_account_code: '',
      use_common_account: true,
      description: '',
      coa_description: ''
    });
    setEditingTransactionTypeId(null);
  };

  // Helper function to get base category from specific category
  const getBaseCategory = (category) => {
    if (!category) return null;
    const catLower = category.toLowerCase();
    if (catLower === 'revenue') return 'revenue';
    if (catLower === 'other income' || catLower === 'otherincome') return 'otherIncome';
    if (catLower === 'provisions') return 'provisions';
    if (catLower === 'income') return 'income';
    if (catLower === 'expense') return 'expense';
    if (catLower === 'asset' || catLower.includes('asset')) return 'asset';
    if (catLower === 'liability' || catLower.includes('liability')) return 'liability';
    if (catLower === 'equity') return 'equity';
    if (catLower === 'gl_to_gl' || catLower === 'gl to gl') return 'gl_to_gl';
    return null;
  };

  // Convert UI category keys to backend/account_categories values.
  const normalizeCategoryForApi = (category) => {
    if (!category) return '';
    const cat = String(category).toLowerCase().trim();
    if (cat === 'otherincome' || cat === 'other income') return 'other income';
    return cat;
  };

  // Group transaction types by base category (for backward compatibility)
  // Use useMemo to ensure it recalculates when definedTransactionTypes changes
  const groupedTransactionTypes = useMemo(() => {
    console.log('🔄 Regrouping transaction types. Total items:', definedTransactionTypes.length);
    
    const groups = {
      revenue: [],
      otherIncome: [],
      provisions: [],
      income: [],
      expense: [],
      asset: [],
      liability: [],
      equity: []
    };
    
    // First, let's see what we're working with
    const allCategories = definedTransactionTypes.map(t => t.category);
    console.log('📋 All categories in data:', allCategories);
    
    definedTransactionTypes.forEach(t => {
      if (!t.category) {
        console.warn('⚠️ Transaction type with no category:', t);
        return;
      }
      
      // Normalize category - handle both original case and lowercase versions
      const originalCategory = String(t.category);
      const cat = originalCategory.toLowerCase().trim();
      
      console.log(`🔍 Processing: "${originalCategory}" -> normalized: "${cat}"`);
      
      // Match revenue / other income / provisions / legacy income
      if (cat === 'revenue') {
        groups.revenue.push(t);
        console.log(`  ✅ Added to revenue`);
        return;
      }
      if (cat === 'other income' || cat === 'otherincome') {
        groups.otherIncome.push(t);
        console.log(`  ✅ Added to otherIncome`);
        return;
      }
      if (cat === 'provisions') {
        groups.provisions.push(t);
        console.log(`  ✅ Added to provisions`);
        return;
      }
      if (cat === 'income') {
        groups.income.push(t);
        console.log(`  ✅ Added to income`);
        return;
      }
      
      // Match expense
      if (cat === 'expense') {
        groups.expense.push(t);
        console.log(`  ✅ Added to expense`);
        return;
      }
      
      // Match asset (including Current Assets, Non-Current Assets, etc.)
      if (cat === 'asset' || cat.includes('asset')) {
        groups.asset.push(t);
        console.log(`  ✅ Added to asset`);
        return;
      }
      
      // Match liability (including Current Liabilities, Non-Current Liabilities, etc.)
      if (cat === 'liability' || cat.includes('liability')) {
        groups.liability.push(t);
        console.log(`  ✅ Added to liability`);
        return;
      }
      
      // If it didn't match any category, log it for debugging
      console.warn(`  ❌ UNMATCHED category:`, {
        id: t.id,
        name: t.transaction_type_name,
        original: originalCategory,
        normalized: cat
      });
    });
    
    // Debug logging - always log to help diagnose
    console.log('=== 📊 FINAL GROUPING RESULTS ===');
    console.log('Income count:', groups.income.length);
    console.log('Expense count:', groups.expense.length);
    console.log('Asset count:', groups.asset.length);
    console.log('Liability count:', groups.liability.length);
    console.log('================================');
    
    return groups;
  }, [definedTransactionTypes]);

  // Fetch transaction types when subCategory changes (for Create Voucher tab)
  useEffect(() => {
    if (form.subCategory && form.category) {
      const fetchTransactionTypesForSubCategory = async () => {
        try {
          // Fetch transaction types by sub category (category_name) and account type
          // Map form.category (income, expense, asset, liability) to account_type
          const accountType = normalizeCategoryForApi(form.category);
          const data = await accountCategoryAPI.getTransactionTypesByCategoryName(form.subCategory, accountType);
          setTransactionTypes(data.map(t => t.transaction_type_name));
        } catch (error) {
          console.error('Error fetching transaction types for sub category:', error);
          setTransactionTypes([]);
        }
      };
      fetchTransactionTypesForSubCategory();
    } else {
      // Clear transaction types when sub category or category is cleared
      setTransactionTypes([]);
    }
  }, [form.subCategory, form.category]);

  // Fetch defined transaction types when transactionType changes (for Create Voucher tab)
  useEffect(() => {
    if (form.transactionType && form.category) {
      const fetchDefinedTransactionTypes = async () => {
        try {
          setDefinedTransactionTypesLoading(true);
          // Fetch all defined transaction types for the current user
          const allDefinedTypes = await otherTransactionTypeAPI.getAll();
          // Filter by transaction_type_name and category, and only show active ones
          const selectedCategory = normalizeCategoryForApi(form.category);
          const filtered = (allDefinedTypes || []).filter(type => 
            type.transaction_type_name === form.transactionType &&
            normalizeCategoryForApi(type.category) === selectedCategory &&
            type.is_active !== false
          );
          setDefinedTransactionTypesForVoucher(filtered);
        } catch (error) {
          console.error('Error fetching defined transaction types:', error);
          setDefinedTransactionTypesForVoucher([]);
        } finally {
          setDefinedTransactionTypesLoading(false);
        }
      };
      fetchDefinedTransactionTypes();
    } else {
      // Clear defined transaction types when transaction type is cleared
      setDefinedTransactionTypesForVoucher([]);
      setForm(prev => ({
        ...prev,
        selectedTransactionTypeId: '',
        glAccountCode: '',
        coaDescription: ''
      }));
    }
  }, [form.transactionType, form.category]);

  // Fetch transaction types when sub_category changes (for Define Transaction tab)
  useEffect(() => {
    if (transactionTypeForm.sub_category && transactionTypeForm.category) {
      const fetchTransactionTypesForSubCategory = async () => {
        try {
          // Fetch transaction types by sub category (category_name) and account type
          // Map transactionTypeForm.category (income, expense, asset, liability) to account_type
          const accountType = normalizeCategoryForApi(transactionTypeForm.category);
          const data = await accountCategoryAPI.getTransactionTypesByCategoryName(transactionTypeForm.sub_category, accountType);
          // Store full objects to access transaction_type_code for filtering
          setTransactionTypesForDefine(data || []);
        } catch (error) {
          console.error('Error fetching transaction types for sub category:', error);
          setTransactionTypesForDefine([]);
        }
      };
      fetchTransactionTypesForSubCategory();
    } else {
      // Clear transaction types when sub category or category is cleared
      setTransactionTypesForDefine([]);
    }
  }, [transactionTypeForm.sub_category, transactionTypeForm.category]);

  // Fetch transaction types when subCategory changes (for Reverse Transaction tab)
  useEffect(() => {
    if (reverseForm.subCategory && reverseForm.category) {
      const fetchTransactionTypesForSubCategory = async () => {
        try {
          // Fetch transaction types by sub category (category_name) and account type
          // Map reverseForm.category (income, expense, asset, liability) to account_type
          const accountType = normalizeCategoryForApi(reverseForm.category);
          const data = await accountCategoryAPI.getTransactionTypesByCategoryName(reverseForm.subCategory, accountType);
          setTransactionTypesForReverse(data.map(t => t.transaction_type_name));
        } catch (error) {
          console.error('Error fetching transaction types for sub category:', error);
          setTransactionTypesForReverse([]);
        }
      };
      fetchTransactionTypesForSubCategory();
    } else {
      // Clear transaction types when sub category or category is cleared
      setTransactionTypesForReverse([]);
    }
  }, [reverseForm.subCategory, reverseForm.category]);

  // Calculate Cash Flow On Settlement when amount or fxRate changes
  useEffect(() => {
    if (form.amount && form.fxRate) {
      const calculatedValue = (parseFloat(form.amount) || 0) * (parseFloat(form.fxRate) || 0);
      setForm(prev => ({
        ...prev,
        cashFlowOnSettlement: calculatedValue.toFixed(2)
      }));
    } else {
      setForm(prev => ({
        ...prev,
        cashFlowOnSettlement: ''
      }));
    }
  }, [form.amount, form.fxRate]);

  // Calculate Cash Flow On Settlement for Liability Settlement form when amount or fxRate changes
  useEffect(() => {
    if (liabilitySettlementForm.amount && liabilitySettlementForm.fxRate) {
      const calculatedValue = (parseFloat(liabilitySettlementForm.amount) || 0) * (parseFloat(liabilitySettlementForm.fxRate) || 0);
      setLiabilitySettlementForm(prev => ({
        ...prev,
        cashFlowOnSettlement: calculatedValue.toFixed(2)
      }));
    } else {
      setLiabilitySettlementForm(prev => ({
        ...prev,
        cashFlowOnSettlement: ''
      }));
    }
  }, [liabilitySettlementForm.amount, liabilitySettlementForm.fxRate]);

  // Fetch transaction types when subCategory changes (for Liability Settlement form)
  useEffect(() => {
    if (liabilitySettlementForm.subCategory && liabilitySettlementForm.category) {
      const fetchTransactionTypesForLiabilitySettlement = async () => {
        try {
          // Fetch transaction types by sub category (category_name) and account type
          const accountType = normalizeCategoryForApi(liabilitySettlementForm.category);
          const data = await accountCategoryAPI.getTransactionTypesByCategoryName(liabilitySettlementForm.subCategory, accountType);
          setTransactionTypesForLiabilitySettlement(data.map(t => t.transaction_type_name));
        } catch (error) {
          console.error('Error fetching transaction types for liability settlement sub category:', error);
          setTransactionTypesForLiabilitySettlement([]);
        }
      };
      fetchTransactionTypesForLiabilitySettlement();
    } else {
      // Clear transaction types when sub category or category is cleared
      setTransactionTypesForLiabilitySettlement([]);
    }
  }, [liabilitySettlementForm.subCategory, liabilitySettlementForm.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Normalize date values to YYYY-MM-DD format to avoid timezone issues
    let normalizedValue = value;
    if (name === 'date' && value) {
      normalizedValue = normalizeDate(value) || value;
    }
    
    // Check for holiday and weekend dates BEFORE updating form - prevent selection
    if (name === 'date' && normalizedValue) {
      // Check if it's a weekend
      if (isWeekend(normalizedValue)) {
        // Reset to previous valid date or today (ensure it's normalized)
        const previousDate = normalizeDate(form.date) || getToday();
        e.target.value = previousDate;
        const date = new Date(normalizedValue + 'T12:00:00');
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        setDateErrors(prev => ({
          ...prev,
          date: `${dayName} is not a business day. Please select a weekday.`
        }));
        return; // Prevent form update
      }
      
      // Check if it's a holiday
      const holiday = isHoliday(normalizedValue);
      if (holiday) {
        // Reset to previous valid date or today (ensure it's normalized)
        const previousDate = normalizeDate(form.date) || getToday();
        e.target.value = previousDate;
        setDateErrors(prev => ({
          ...prev,
          date: `${holiday.name} - ${holiday.type}. Please select a business day.`
        }));
        return; // Prevent form update
      }
      
      // Clear error if date is valid
      setDateErrors(prev => ({
        ...prev,
        date: ''
      }));
    }
    
    // Handle account selection from dropdown
    if (name === 'selectedAccountId') {
      const selectedAccount = accounts.find(acc => acc.id.toString() === value);
      if (selectedAccount) {
        setForm(prev => ({
          ...prev,
          settlementAccount: `${selectedAccount.account_name} - ${selectedAccount.account_number}`,
          paymentAccountName: selectedAccount.account_name,
          paymentAccountNumber: selectedAccount.account_number,
          paymentBankName: selectedAccount.bank_name,
          paymentBranchName: selectedAccount.branch_name
        }));
      }
      return;
    }

    // If main category changes, reset sub category and transaction type
    if (name === 'category') {
      setForm({ ...form, [name]: value, subCategory: '', transactionType: '', selectedTransactionTypeId: '', glAccountCode: '', coaDescription: '' });
      return;
    }
    
    // If sub category changes, reset transaction type
    if (name === 'subCategory') {
      setForm({ ...form, [name]: value, transactionType: '', selectedTransactionTypeId: '', glAccountCode: '', coaDescription: '' });
      return;
    }

    // If transaction type changes, reset selected transaction type details
    if (name === 'transactionType') {
      setForm({ ...form, [name]: value, selectedTransactionTypeId: '', glAccountCode: '', coaDescription: '' });
      return;
    }
    
    // Use normalized value for date fields, original value for others
    setForm({ ...form, [name]: normalizedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = [];
    const missingFields = [];

    if (!form.category || !form.category.trim()) {
      missingFields.push('Category');
    }
    
    if (!form.subCategory || !form.subCategory.trim()) {
      missingFields.push('Sub Category');
    }
    
    if (!form.transactionType || !form.transactionType.trim()) {
      missingFields.push('Transaction Type Name');
    }

    if (!form.selectedTransactionTypeId || !form.selectedTransactionTypeId.toString().trim()) {
      missingFields.push('Select Defined Transaction Account');
    }
    
    if (!form.amount || form.amount === '' || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      missingFields.push('Amount (must be greater than zero)');
    }
    
    if (!form.currency || !form.currency.trim()) {
      missingFields.push('Currency');
    }
    
    if (!form.date || !form.date.trim()) {
      missingFields.push('Transaction Date');
    }

    // Validate date against holidays and weekends
    if (form.date && form.date.trim()) {
      // Check if it's a weekend
      if (isWeekend(form.date)) {
        const date = new Date(normalizeDate(form.date) + 'T12:00:00');
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        validateDateField('date', form.date); // Show error message
        alert(`${dayName} is not a business day. Please select a weekday.`);
        return;
      }

      // Check if it's a holiday
      const holiday = isHoliday(form.date);
      if (holiday) {
        validateDateField('date', form.date); // Show error message
        alert(`${holiday.name} - ${holiday.type}. Please select a business day.`);
        return;
      }
    }

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    // Account selection is optional - if not selected, backend will use default accounts
    // No need to show warning since the field is marked as optional

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Get user email from auth service
      const user = authService.getStoredUser();
      const userEmail = user?.email || '';

      // Prepare transaction data
      // Map main category to accountType for backend compatibility
      const accountType = normalizeCategoryForApi(form.category);
      
      const transactionData = {
        voucherNumber: form.voucherNumber,
        accountType: accountType,
        category: form.subCategory, // Send sub category as category (for backward compatibility)
        transactionType: form.transactionType,
        glAccountCode: form.glAccountCode || null, // Selected GL account code from defined transaction type
        coaDescription: form.coaDescription || null, // Selected COA description from defined transaction type
        description: form.description,
        amount: form.amount,
        date: form.date,
        reference: form.reference,
        currency: form.currency,
        fxRate: form.fxRate,
        counterparty: form.counterparty,
        notes: form.notes,
        cashFlowOnSettlement: form.cashFlowOnSettlement,
        paymentAccountName: form.paymentAccountName,
        paymentAccountNumber: form.paymentAccountNumber,
        paymentBankName: form.paymentBankName,
        paymentBranchName: form.paymentBranchName,
        paymentMethod: form.paymentMethod,
        userEmail: userEmail
      };

      // Call API to save the transaction
      const result = await otherTransactionAPI.createTransaction(transactionData);
      
      console.log('Transaction saved successfully:', result);
      setSubmitMessage('Transaction saved successfully!');
      handleReset();
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      setSubmitMessage(`Error saving transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      voucherNumber: generateVoucherNumber(),
      category: '',
      subCategory: '',
      transactionType: '',
      selectedTransactionTypeId: '',
      glAccountCode: '',
      coaDescription: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      currency: 'LKR',
      fxRate: '1.00',
      counterparty: '',
      notes: '',
      cashFlowOnSettlement: '',
      selectedAccountId: '',
      settlementAccount: '',
      paymentAccountName: '',
      paymentAccountNumber: '',
      paymentBankName: '',
      paymentBranchName: '',
      paymentMethod: ''
    });
    setSubmitMessage('');
  };

  const parseGlToGlLineAmount = (raw) => {
    const n = parseFloat(String(raw || '').replace(/,/g, ''));
    return Number.isFinite(n) ? n : NaN;
  };

  const glToGlLineIsFilled = (line) => {
    const code = (line.accountCode || '').trim();
    const amt = parseGlToGlLineAmount(line.amount);
    return code && Number.isFinite(amt) && amt > 0;
  };

  const validateGlToGlJournalLines = (debitLines, creditLines) => {
    const debitTotals = debitLines.map((line) => ({
      code: (line.accountCode || '').trim(),
      amt: parseGlToGlLineAmount(line.amount)
    }));
    const creditTotals = creditLines.map((line) => ({
      code: (line.accountCode || '').trim(),
      amt: parseGlToGlLineAmount(line.amount)
    }));

    const incompleteDebit = debitTotals.some(
      (d) =>
        (d.code && (!Number.isFinite(d.amt) || d.amt <= 0)) ||
        (Number.isFinite(d.amt) && d.amt > 0 && !d.code)
    );
    const incompleteCredit = creditTotals.some(
      (c) =>
        (c.code && (!Number.isFinite(c.amt) || c.amt <= 0)) ||
        (Number.isFinite(c.amt) && c.amt > 0 && !c.code)
    );

    if (incompleteDebit || incompleteCredit) {
      return {
        valid: false,
        error: 'Each debit/credit line with an account must have a positive amount, and amounts require an account code.'
      };
    }

    const filledDebitCount = debitLines.filter(glToGlLineIsFilled).length;
    const filledCreditCount = creditLines.filter(glToGlLineIsFilled).length;
    const sumDr = debitTotals.reduce(
      (s, d) => s + (d.code && Number.isFinite(d.amt) ? d.amt : 0),
      0
    );
    const sumCr = creditTotals.reduce(
      (s, c) => s + (c.code && Number.isFinite(c.amt) ? c.amt : 0),
      0
    );

    if (filledDebitCount === 0 || filledCreditCount === 0) {
      return {
        valid: false,
        error: 'Add at least one debit line and one credit line with account codes and amounts.'
      };
    }

    if (Math.abs(sumDr - sumCr) > 0.009) {
      return {
        valid: false,
        error: `Total debits (${sumDr.toFixed(2)}) must equal total credits (${sumCr.toFixed(2)}).`
      };
    }

    if (sumDr <= 0) {
      return { valid: false, error: 'Total debit amount must be greater than zero.' };
    }

    return { valid: true, sumDr, sumCr };
  };

  const validateGlToGlSideLines = (lines, sideLabel) => {
    const totals = lines.map((line) => ({
      code: (line.accountCode || '').trim(),
      amt: parseGlToGlLineAmount(line.amount)
    }));

    const incomplete = totals.some(
      (row) =>
        (row.code && (!Number.isFinite(row.amt) || row.amt <= 0)) ||
        (Number.isFinite(row.amt) && row.amt > 0 && !row.code)
    );

    if (incomplete) {
      return {
        valid: false,
        error: `Each ${sideLabel} line needs an account code and a positive amount.`
      };
    }

    const filledCount = lines.filter(glToGlLineIsFilled).length;
    if (filledCount === 0) {
      return {
        valid: false,
        error: `Add at least one ${sideLabel} line with an account code and amount.`
      };
    }

    const sum = totals.reduce(
      (s, row) => s + (row.code && Number.isFinite(row.amt) ? row.amt : 0),
      0
    );

    if (sum <= 0) {
      return { valid: false, error: `${sideLabel} total must be greater than zero.` };
    }

    return { valid: true, sum };
  };

  const handleGlToGlHeaderChange = (e) => {
    const { name, value } = e.target;
    setGlToGlForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGlToGlFixDebitLines = () => {
    const result = validateGlToGlSideLines(glToGlDebitLines, 'debit');
    if (!result.valid) {
      setGlToGlDebitFixMessage(result.error);
      setGlToGlDebitFixed(false);
      return;
    }
    setGlToGlDebitFixed(true);
    setGlToGlDebitFixMessage('Debit lines saved.');
    setSubmitMessage('');
  };

  const handleGlToGlFixCreditLines = () => {
    const result = validateGlToGlSideLines(glToGlCreditLines, 'credit');
    if (!result.valid) {
      setGlToGlCreditFixMessage(result.error);
      setGlToGlCreditFixed(false);
      return;
    }
    setGlToGlCreditFixed(true);
    setGlToGlCreditFixMessage('Credit lines saved.');
    setSubmitMessage('');
  };

  const handleGlToGlUnlockDebitLines = () => {
    setGlToGlDebitFixed(false);
    setGlToGlDebitFixMessage('');
  };

  const handleGlToGlUnlockCreditLines = () => {
    setGlToGlCreditFixed(false);
    setGlToGlCreditFixMessage('');
  };

  const handleGlToGlDebitLineChange = (lineId, field, value) => {
    if (glToGlDebitFixed) return;
    setGlToGlDebitLines(prev =>
      prev.map(line => {
        if (line.id !== lineId) return line;
        if (field === 'accountCode') {
          const code = String(value || '').trim();
          const coa = chartAccounts.find(a => a.account_code === code);
          return {
            ...line,
            accountCode: value,
            accountName: coa?.description || line.accountName
          };
        }
        return { ...line, [field]: value };
      })
    );
  };

  const handleGlToGlCreditLineChange = (lineId, field, value) => {
    if (glToGlCreditFixed) return;
    setGlToGlCreditLines(prev =>
      prev.map(line => {
        if (line.id !== lineId) return line;
        if (field === 'accountCode') {
          const code = String(value || '').trim();
          const coa = chartAccounts.find(a => a.account_code === code);
          return {
            ...line,
            accountCode: value,
            accountName: coa?.description || line.accountName
          };
        }
        return { ...line, [field]: value };
      })
    );
  };

  const addGlToGlDebitLine = () => {
    if (glToGlDebitFixed) return;
    setGlToGlDebitLines(prev => [
      ...prev,
      { id: newGlJournalLineId(), accountCode: '', accountName: '', amount: '' }
    ]);
  };

  const addGlToGlCreditLine = () => {
    if (glToGlCreditFixed) return;
    setGlToGlCreditLines(prev => [
      ...prev,
      { id: newGlJournalLineId(), accountCode: '', accountName: '', amount: '' }
    ]);
  };

  const removeGlToGlDebitLine = (lineId) => {
    if (glToGlDebitFixed) return;
    setGlToGlDebitLines(prev => (prev.length <= 1 ? prev : prev.filter(l => l.id !== lineId)));
  };

  const removeGlToGlCreditLine = (lineId) => {
    if (glToGlCreditFixed) return;
    setGlToGlCreditLines(prev => (prev.length <= 1 ? prev : prev.filter(l => l.id !== lineId)));
  };

  const handleGlToGlReset = () => {
    setGlToGlForm({
      voucherNumber: generateVoucherNumber(),
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      notes: ''
    });
    setGlToGlDebitLines([{ id: newGlJournalLineId(), accountCode: '', accountName: '', amount: '' }]);
    setGlToGlCreditLines([{ id: newGlJournalLineId(), accountCode: '', accountName: '', amount: '' }]);
    setGlToGlDebitFixed(false);
    setGlToGlCreditFixed(false);
    setGlToGlDebitFixMessage('');
    setGlToGlCreditFixMessage('');
    setSubmitMessage('');
  };

  const handleGlToGlSubmit = async (e) => {
    e.preventDefault();

    if (!glToGlDebitFixed || !glToGlCreditFixed) {
      setSubmitMessage('Error: Save both debit and credit lines before posting.');
      return;
    }

    const journalCheck = validateGlToGlJournalLines(glToGlDebitLines, glToGlCreditLines);
    if (!journalCheck.valid) {
      setSubmitMessage(`Error: ${journalCheck.error}`);
      setGlToGlDebitFixed(false);
      setGlToGlCreditFixed(false);
      setGlToGlDebitFixMessage('');
      setGlToGlCreditFixMessage('');
      return;
    }

    const sumDr = journalCheck.sumDr;

    const glDebitLinesPayload = glToGlDebitLines
      .filter(glToGlLineIsFilled)
      .map((line) => ({
        accountCode: (line.accountCode || '').trim(),
        accountName: (line.accountName || '').trim() || null,
        amount: parseGlToGlLineAmount(line.amount)
      }));
    const glCreditLinesPayload = glToGlCreditLines
      .filter(glToGlLineIsFilled)
      .map((line) => ({
        accountCode: (line.accountCode || '').trim(),
        accountName: (line.accountName || '').trim() || null,
        amount: parseGlToGlLineAmount(line.amount)
      }));

    const d0 = glDebitLinesPayload[0];
    const c0 = glCreditLinesPayload[0];

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const user = authService.getStoredUser();
      const userEmail = user?.email || '';

      const payload = {
        voucherNumber: glToGlForm.voucherNumber,
        accountType: 'gl_to_gl',
        transactionType: 'GL_TO_GL',
        description: glToGlForm.description,
        amount: String(sumDr),
        date: glToGlForm.date,
        reference: glToGlForm.reference,
        notes: glToGlForm.notes,
        glDebitLines: glDebitLinesPayload,
        glCreditLines: glCreditLinesPayload,
        debitGlAccountCode: d0.accountCode,
        debitCoaDescription: d0.accountName,
        creditGlAccountCode: c0.accountCode,
        creditCoaDescription: c0.accountName,
        userEmail
      };

      await otherTransactionAPI.createTransaction(payload);
      setSubmitMessage('GL to GL transaction posted successfully!');
      handleGlToGlReset();
    } catch (error) {
      console.error('Error posting GL to GL transaction:', error);
      setSubmitMessage(`Error posting GL to GL transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for Asset Depreciation form changes
  const handleAssetDepreciationChange = (e) => {
    const { name, value } = e.target;
    setAssetDepreciationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for Asset Depreciation form reset
  const handleAssetDepreciationReset = () => {
    setAssetDepreciationForm({
      voucherNumber: generateVoucherNumber(),
      assetAccountCode: '',
      assetAccountName: '',
      depreciationExpenseAccountCode: '',
      depreciationExpenseAccountName: '',
      accumulatedDepreciationAccountCode: '',
      accumulatedDepreciationAccountName: '',
      depreciationAmount: '',
      depreciationDate: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      notes: ''
    });
    setSubmitMessage('');
  };

  // Handler for Asset Derecognition form changes
  const handleAssetDerecognitionChange = (e) => {
    const { name, value } = e.target;
    setAssetDerecognitionForm(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate gain/loss if both book value and sale proceeds are provided
      if (name === 'assetBookValue' || name === 'saleProceeds') {
        const bookValue = parseFloat(name === 'assetBookValue' ? value : prev.assetBookValue) || 0;
        const proceeds = parseFloat(name === 'saleProceeds' ? value : prev.saleProceeds) || 0;
        const gainLoss = proceeds - bookValue;
        updated.gainLossAmount = gainLoss !== 0 ? gainLoss.toFixed(2) : '';
      }
      
      return updated;
    });
  };

  // Handler for Asset Derecognition form reset
  const handleAssetDerecognitionReset = () => {
    setAssetDerecognitionForm({
      voucherNumber: generateVoucherNumber(),
      assetAccountCode: '',
      assetAccountName: '',
      accumulatedDepreciationAccountCode: '',
      accumulatedDepreciationAccountName: '',
      proceedsAccountCode: '',
      proceedsAccountName: '',
      gainLossAccountCode: '',
      gainLossAccountName: '',
      assetBookValue: '',
      saleProceeds: '',
      gainLossAmount: '',
      derecognitionDate: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      notes: ''
    });
    setSubmitMessage('');
  };

  // Handler for Asset Derecognition form submission
  const handleAssetDerecognitionSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = [];

    if (!assetDerecognitionForm.assetAccountCode || !assetDerecognitionForm.assetAccountCode.trim()) {
      missingFields.push('Asset Account Code');
    }

    if (!assetDerecognitionForm.assetAccountName || !assetDerecognitionForm.assetAccountName.trim()) {
      missingFields.push('Asset Account Name');
    }

    if (!assetDerecognitionForm.accumulatedDepreciationAccountCode || !assetDerecognitionForm.accumulatedDepreciationAccountCode.trim()) {
      missingFields.push('Accumulated Depreciation Account Code');
    }

    if (!assetDerecognitionForm.accumulatedDepreciationAccountName || !assetDerecognitionForm.accumulatedDepreciationAccountName.trim()) {
      missingFields.push('Accumulated Depreciation Account Name');
    }

    if (!assetDerecognitionForm.proceedsAccountCode || !assetDerecognitionForm.proceedsAccountCode.trim()) {
      missingFields.push('Proceeds Account Code');
    }

    if (!assetDerecognitionForm.proceedsAccountName || !assetDerecognitionForm.proceedsAccountName.trim()) {
      missingFields.push('Proceeds Account Name');
    }

    if (!assetDerecognitionForm.gainLossAccountCode || !assetDerecognitionForm.gainLossAccountCode.trim()) {
      missingFields.push('Gain/Loss Account Code');
    }

    if (!assetDerecognitionForm.gainLossAccountName || !assetDerecognitionForm.gainLossAccountName.trim()) {
      missingFields.push('Gain/Loss Account Name');
    }

    if (!assetDerecognitionForm.assetBookValue || assetDerecognitionForm.assetBookValue === '' || isNaN(parseFloat(assetDerecognitionForm.assetBookValue)) || parseFloat(assetDerecognitionForm.assetBookValue) < 0) {
      missingFields.push('Asset Book Value (must be greater than or equal to zero)');
    }

    if (!assetDerecognitionForm.saleProceeds || assetDerecognitionForm.saleProceeds === '' || isNaN(parseFloat(assetDerecognitionForm.saleProceeds)) || parseFloat(assetDerecognitionForm.saleProceeds) < 0) {
      missingFields.push('Sale Proceeds (must be greater than or equal to zero)');
    }

    if (!assetDerecognitionForm.derecognitionDate || !assetDerecognitionForm.derecognitionDate.trim()) {
      missingFields.push('Derecognition Date');
    }

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Get user email from auth service
      const user = authService.getStoredUser();
      const userEmail = user?.email || '';

      // Prepare transaction data for asset derecognition
      const transactionData = {
        voucherNumber: assetDerecognitionForm.voucherNumber,
        accountType: 'asset', // Fixed for asset derecognition
        transactionType: 'Asset Derecognition', // Fixed transaction type
        date: assetDerecognitionForm.derecognitionDate,
        reference: assetDerecognitionForm.reference || '',
        description: assetDerecognitionForm.description || '',
        notes: assetDerecognitionForm.notes || '',
        userEmail: userEmail,
        // Asset derecognition specific fields
        assetAccountCode: assetDerecognitionForm.assetAccountCode.trim(),
        assetAccountName: assetDerecognitionForm.assetAccountName.trim(),
        accumulatedDepreciationAccountCode: assetDerecognitionForm.accumulatedDepreciationAccountCode.trim(),
        accumulatedDepreciationAccountName: assetDerecognitionForm.accumulatedDepreciationAccountName.trim(),
        proceedsAccountCode: assetDerecognitionForm.proceedsAccountCode.trim(),
        proceedsAccountName: assetDerecognitionForm.proceedsAccountName.trim(),
        gainLossAccountCode: assetDerecognitionForm.gainLossAccountCode.trim(),
        gainLossAccountName: assetDerecognitionForm.gainLossAccountName.trim(),
        assetBookValue: parseFloat(assetDerecognitionForm.assetBookValue),
        saleProceeds: parseFloat(assetDerecognitionForm.saleProceeds),
        gainLossAmount: parseFloat(assetDerecognitionForm.gainLossAmount || 0)
      };

      // Call API to save the asset derecognition transaction
      const result = await otherTransactionAPI.createTransaction(transactionData);
      
      console.log('Asset derecognition transaction saved successfully:', result);
      setSubmitMessage('Asset derecognition transaction saved successfully!');
      handleAssetDerecognitionReset();
      
    } catch (error) {
      console.error('Error saving asset derecognition transaction:', error);
      setSubmitMessage(`Error saving transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to generate description for liability settlement
  const generateLiabilitySettlementDescription = (originalVoucherNumber, settlementAmount, originalAmount) => {
    if (!originalVoucherNumber) return '';
    
    const settlementAmt = parseFloat(settlementAmount) || 0;
    const originalAmt = parseFloat(originalAmount) || 0;
    
    // If amounts are equal (or very close), it's a full settlement
    if (settlementAmt > 0 && originalAmt > 0 && Math.abs(settlementAmt - originalAmt) < 0.01) {
      return `Settling ${originalVoucherNumber}`;
    } else if (settlementAmt > 0) {
      // Format amount with 2 decimal places
      const formattedAmount = settlementAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `Settling ${formattedAmount} from ${originalVoucherNumber}`;
    }
    
    return '';
  };

// Helper: get total amount already settled for a voucher (sums LS- vouchers referencing it)
const getVoucherSettlementAmount = (voucherNumber) => {
  if (!voucherNumber) return 0;
  const settlementVouchers = vouchers.filter(v => 
    v.voucher_number &&
    v.voucher_number.startsWith('LS-') &&
    v.description &&
    v.description.toLowerCase().includes(voucherNumber.toLowerCase())
  );
  return settlementVouchers.reduce((sum, settlement) => {
    const amt = parseFloat(settlement.amount) || 0;
    const desc = (settlement.description || '').trim();
    // Only count if description references this voucher explicitly
    const fullMatch = desc === `Settling ${voucherNumber}`;
    const partialMatch = new RegExp(`Settling\\s+[\\d,]+(?:\\.\\d+)?\\s+from\\s+${voucherNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(desc);
    return (fullMatch || partialMatch) ? sum + amt : sum;
  }, 0);
};

// Helper: remaining amount = original - settled (never below zero)
const getVoucherRemainingAmount = (voucher) => {
  if (!voucher || !voucher.voucher_number) return 0;
  const originalAmount = parseFloat(voucher.amount) || 0;
  const settled = getVoucherSettlementAmount(voucher.voucher_number);
  return Math.max(originalAmount - settled, 0);
};

// Helper function to check if a liability voucher has been settled (fully)
const isVoucherSettled = (voucher) => {
  return getVoucherRemainingAmount(voucher) <= 0.001;
};

  // Handler for Liability Settlement form changes
  const handleLiabilitySettlementChange = (e) => {
    const { name, value } = e.target; 
    
    // Handle account selection from dropdown
    if (name === 'selectedAccountId') {
      const selectedAccount = accounts.find(acc => acc.id.toString() === value);
      if (selectedAccount) {
        setLiabilitySettlementForm(prev => ({
          ...prev,
          paymentAccountName: selectedAccount.account_name,
          paymentAccountNumber: selectedAccount.account_number,
          paymentBankName: selectedAccount.bank_name,
          paymentBranchName: selectedAccount.branch_name
        }));
      }
      return;
    }

    // Handle voucher selection from dropdown
    if (name === 'selectedVoucherId') {
      const selectedVoucher = vouchers.find(v => v.id.toString() === value);
      if (selectedVoucher) {
        // Determine main category from account_type
        const mainCategory = selectedVoucher.account_type?.toLowerCase() || 'liability';
        const transactionTypeName = selectedVoucher.transaction_type || '';
        
        // Look up sub_category, gl_account_code, and account_name from other_transaction_types and other_transaction_gl_entries tables
        const lookupTransactionTypeDetails = async () => {
          try {
            let subCategoryName = selectedVoucher.category || ''; // Fallback to voucher's category field
            let glAccountCode = selectedVoucher.gl_account_code || ''; // Fallback to voucher's gl_account_code
            let accountName = selectedVoucher.coa_description || selectedVoucher.description || ''; // Fallback to voucher's description
            
            if (transactionTypeName) {
              // Fetch all transaction types for the current user
              const allTransactionTypes = await otherTransactionTypeAPI.getAll();
              
              // Find the transaction type that matches the transaction_type_name
              const matchingTransactionType = allTransactionTypes.find(
                type => type.transaction_type_name === transactionTypeName
              );
              
              // If found, use its sub_category and gl_account_code
              if (matchingTransactionType) {
                if (matchingTransactionType.sub_category) {
                  subCategoryName = matchingTransactionType.sub_category;
                }
                if (matchingTransactionType.gl_account_code) {
                  glAccountCode = matchingTransactionType.gl_account_code;
                  
                  // Look up account_name from other_transaction_gl_entries using the account_code
                  try {
                    const glEntries = await otherTransactionGLEntryAPI.getEntriesByAccountCode(glAccountCode);
                    // Get the account_name from the first entry (all entries for same account_code should have same account_name)
                    if (glEntries && glEntries.length > 0 && glEntries[0].account_name) {
                      accountName = glEntries[0].account_name;
                    }
                  } catch (glError) {
                    console.error('Error fetching account name from GL entries:', glError);
                    // Keep the fallback accountName if GL lookup fails
                  }
                }
              }
            }
            
            // Store original voucher details for description generation
            const originalVoucherNumber = selectedVoucher.voucher_number || '';
            const originalAmount = selectedVoucher.amount || '';
            setOriginalVoucherDetails({ voucherNumber: originalVoucherNumber, amount: originalAmount });
            
            // Generate description based on settlement amount
            const settlementAmount = selectedVoucher.amount || '';
            const generatedDescription = generateLiabilitySettlementDescription(
              originalVoucherNumber,
              settlementAmount,
              originalAmount
            );
            
            const remainingAmount = getVoucherRemainingAmount(selectedVoucher) || settlementAmount;
            const remainingDescription = generateLiabilitySettlementDescription(
              originalVoucherNumber,
              remainingAmount,
              originalAmount
            );
            
            setLiabilitySettlementForm(prev => ({
              ...prev,
              voucherNumber: generateLiabilitySettlementVoucherNumber(), // Generate new liability settlement voucher number
              selectedVoucherId: value,
              category: mainCategory,
              subCategory: subCategoryName,
              transactionType: transactionTypeName,
              glAccountCode: glAccountCode,
              coaDescription: accountName,
              amount: remainingAmount,
              date: selectedVoucher.transaction_date ? selectedVoucher.transaction_date.substring(0, 10) : new Date().toISOString().split('T')[0],
              description: remainingDescription || generatedDescription || selectedVoucher.description || '',
              reference: selectedVoucher.reference || '',
              currency: selectedVoucher.currency || 'LKR',
              fxRate: selectedVoucher.fx_rate || '1.00',
              counterparty: selectedVoucher.counterparty || '',
              notes: selectedVoucher.notes || '',
              cashFlowOnSettlement: selectedVoucher.cash_flow_on_settlement || '',
              paymentAccountName: selectedVoucher.payment_account_name || '',
              paymentAccountNumber: selectedVoucher.payment_account_number || '',
              paymentBankName: selectedVoucher.payment_bank_name || '',
              paymentBranchName: selectedVoucher.payment_branch_name || '',
              paymentMethod: selectedVoucher.payment_method || ''
            }));
          } catch (error) {
            console.error('Error looking up transaction type details:', error);
            // Fallback to voucher's fields if lookup fails
            const subCategoryName = selectedVoucher.category || '';
            const glAccountCode = selectedVoucher.gl_account_code || '';
            const accountName = selectedVoucher.coa_description || selectedVoucher.description || '';
            
            // Store original voucher details for description generation
            const originalVoucherNumber = selectedVoucher.voucher_number || '';
            const originalAmount = selectedVoucher.amount || '';
            setOriginalVoucherDetails({ voucherNumber: originalVoucherNumber, amount: originalAmount });
            
            // Generate description based on remaining amount
            const settlementAmount = selectedVoucher.amount || '';
            const remainingAmount = getVoucherRemainingAmount(selectedVoucher) || settlementAmount;
            const generatedDescription = generateLiabilitySettlementDescription(
              originalVoucherNumber,
              remainingAmount,
              originalAmount
            );
            
            setLiabilitySettlementForm(prev => ({
              ...prev,
              voucherNumber: generateLiabilitySettlementVoucherNumber(),
              selectedVoucherId: value,
              category: mainCategory,
              subCategory: subCategoryName,
              transactionType: transactionTypeName,
              glAccountCode: glAccountCode,
              coaDescription: accountName,
              amount: remainingAmount,
              date: selectedVoucher.transaction_date ? selectedVoucher.transaction_date.substring(0, 10) : new Date().toISOString().split('T')[0],
              description: generatedDescription || selectedVoucher.description || '',
              reference: selectedVoucher.reference || '',
              currency: selectedVoucher.currency || 'LKR',
              fxRate: selectedVoucher.fx_rate || '1.00',
              counterparty: selectedVoucher.counterparty || '',
              notes: selectedVoucher.notes || '',
              cashFlowOnSettlement: selectedVoucher.cash_flow_on_settlement || '',
              paymentAccountName: selectedVoucher.payment_account_name || '',
              paymentAccountNumber: selectedVoucher.payment_account_number || '',
              paymentBankName: selectedVoucher.payment_bank_name || '',
              paymentBranchName: selectedVoucher.payment_branch_name || '',
              paymentMethod: selectedVoucher.payment_method || ''
            }));
          }
        };
        
        lookupTransactionTypeDetails();
      }
      return;
    }

    // If sub category changes, reset transaction type
    if (name === 'subCategory') {
      setLiabilitySettlementForm(prev => ({ 
        ...prev, 
        [name]: value, 
        transactionType: '' 
      }));
      return;
    }

    // If transaction type changes, just update it
    if (name === 'transactionType') {
      setLiabilitySettlementForm(prev => ({ 
        ...prev, 
        [name]: value 
      }));
      return;
    }

    // If amount changes, regenerate description based on full/partial settlement
    if (name === 'amount') {
      const generatedDescription = generateLiabilitySettlementDescription(
        originalVoucherDetails.voucherNumber,
        value,
        originalVoucherDetails.amount
      );
      setLiabilitySettlementForm(prev => ({ 
        ...prev, 
        [name]: value,
        description: generatedDescription || prev.description
      }));
      return;
    }

    // Handle liability account code input with search
    if (name === 'glAccountCode') {
      setLiabilityAccountSearchTerm(value);
      setShowLiabilityAccountList(true);
      
      // Try to find matching account and populate description
      const matchingAccount = chartAccounts.find(acc => 
        acc.account_code && acc.account_code.toLowerCase() === value.toLowerCase().trim()
      );
      if (matchingAccount) {
        setLiabilitySettlementForm(prev => ({ 
          ...prev, 
          glAccountCode: value,
          coaDescription: matchingAccount.description || ''
        }));
      } else {
        // Clear coaDescription if no match found
        setLiabilitySettlementForm(prev => ({ 
          ...prev, 
          glAccountCode: value,
          coaDescription: prev.coaDescription // Keep existing if user is typing
        }));
      }
      return;
    }
    
    setLiabilitySettlementForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for Liability Settlement form reset
  const handleLiabilitySettlementReset = () => {
    setOriginalVoucherDetails({ voucherNumber: '', amount: '' });
    setLiabilitySettlementForm({
      voucherNumber: generateLiabilitySettlementVoucherNumber(),
      selectedVoucherId: '',
      accountType: 'liability',
      category: 'liability',
      subCategory: '',
      transactionType: '',
      glAccountCode: '',
      coaDescription: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      currency: 'LKR',
      fxRate: '1.00',
      counterparty: '',
      notes: '',
      cashFlowOnSettlement: '',
      selectedAccountId: '',
      paymentAccountName: '',
      paymentAccountNumber: '',
      paymentBankName: '',
      paymentBranchName: '',
      paymentMethod: ''
    });
    setLiabilityAccountSearchTerm('');
    setShowLiabilityAccountList(false);
    setTransactionTypesForLiabilitySettlement([]);
    setSubmitMessage('');
  };

  // Handler for Liability Settlement form submission
  const handleLiabilitySettlementSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = [];

    if (!liabilitySettlementForm.selectedVoucherId || !liabilitySettlementForm.selectedVoucherId.toString().trim()) {
      missingFields.push('Select Previous Voucher');
    }

    if (!liabilitySettlementForm.subCategory || !liabilitySettlementForm.subCategory.trim()) {
      missingFields.push('Sub Category');
    }

    if (!liabilitySettlementForm.transactionType || !liabilitySettlementForm.transactionType.trim()) {
      missingFields.push('Transaction Type Name');
    }

    if (!liabilitySettlementForm.glAccountCode || !liabilitySettlementForm.glAccountCode.trim()) {
      missingFields.push('Liability Account Code');
    }

    if (!liabilitySettlementForm.coaDescription || !liabilitySettlementForm.coaDescription.trim()) {
      missingFields.push('Liability Account Name');
    }

    if (!liabilitySettlementForm.amount || liabilitySettlementForm.amount === '' || isNaN(parseFloat(liabilitySettlementForm.amount)) || parseFloat(liabilitySettlementForm.amount) <= 0) {
      missingFields.push('Settlement Amount (must be greater than zero)');
    }

    if (!liabilitySettlementForm.date || !liabilitySettlementForm.date.trim()) {
      missingFields.push('Settlement Date');
    }

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    // Ensure settlement does not exceed remaining balance on the selected voucher
    const selectedVoucher = vouchers.find(v => liabilitySettlementForm.selectedVoucherId && v.id.toString() === liabilitySettlementForm.selectedVoucherId.toString());
    if (selectedVoucher) {
      const remaining = getVoucherRemainingAmount(selectedVoucher);
      const settleAmount = parseFloat(liabilitySettlementForm.amount) || 0;
      if (settleAmount - remaining > 0.001) {
        alert(`Settlement amount exceeds remaining balance. Remaining: ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Get user email from auth service
      const user = authService.getStoredUser();
      const userEmail = user?.email || '';

      // Prepare transaction data matching the other_transactions table structure
      const transactionData = {
        voucherNumber: liabilitySettlementForm.voucherNumber,
        accountType: 'liability', // Fixed for liability settlement
        transactionType: liabilitySettlementForm.transactionType || 'Liability Settlement', // Use selected transaction type or default
        glAccountCode: liabilitySettlementForm.glAccountCode.trim(),
        coaDescription: liabilitySettlementForm.coaDescription.trim(),
        description: liabilitySettlementForm.description,
        amount: liabilitySettlementForm.amount,
        date: liabilitySettlementForm.date,
        reference: liabilitySettlementForm.reference,
        currency: liabilitySettlementForm.currency || 'LKR',
        fxRate: liabilitySettlementForm.fxRate || '1.00',
        counterparty: liabilitySettlementForm.counterparty || '',
        notes: liabilitySettlementForm.notes,
        cashFlowOnSettlement: liabilitySettlementForm.cashFlowOnSettlement || (parseFloat(liabilitySettlementForm.amount) * parseFloat(liabilitySettlementForm.fxRate || 1)).toFixed(2),
        paymentAccountName: liabilitySettlementForm.paymentAccountName,
        paymentAccountNumber: liabilitySettlementForm.paymentAccountNumber,
        paymentBankName: liabilitySettlementForm.paymentBankName,
        paymentBranchName: liabilitySettlementForm.paymentBranchName,
        paymentMethod: liabilitySettlementForm.paymentMethod,
        userEmail: userEmail
      };

      // Call API to save the transaction
      const result = await otherTransactionAPI.createTransaction(transactionData);
      
      console.log('Liability settlement transaction saved successfully:', result);
      setSubmitMessage('Liability settlement transaction saved successfully!');
      handleLiabilitySettlementReset();
      
    } catch (error) {
      console.error('Error saving liability settlement transaction:', error);
      setSubmitMessage(`Error saving transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setInlineDocType(null);
    setInlineDocHtml('');
    setInlineDocEditing(false);
  };

  const handleGenerateVoucher = async () => {
    let glLines = [];
    try {
      const user = authService.getStoredUser();
      const userEmail = user?.email || '';
      if (form.voucherNumber && userEmail) {
        const all = await otherTransactionAPI.getTransactionsByUser(userEmail);
        const match = (all || []).find((t) => t.voucher_number === form.voucherNumber);
        if (match?.id) {
          glLines = await otherTransactionGLEntryAPI.getEntriesByTransactionId(match.id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch GL entries for voucher print:', err);
    }
    setInlineDocTitle(`Payment Voucher - ${form.voucherNumber || ''}`);
    setInlineDocHtml(buildPaymentVoucherDoc(form, glLines));
    setInlineDocType('voucher');
    setInlineDocEditing(false);
  };

  const handleGenerateInvoice = () => {
    setInlineDocTitle(`Invoice - ${form.reference || form.voucherNumber || ''}`);
    setInlineDocHtml(buildInvoiceDoc(form));
    setInlineDocType('invoice');
    setInlineDocEditing(false);
  };

  const handleGenerateRequestLetter = () => {
    setInlineDocTitle(`Request Letter - ${form.voucherNumber || ''}`);
    setInlineDocHtml(buildRequestLetterDoc(form));
    setInlineDocType('letter');
    setInlineDocEditing(false);
  };

  const handleInlineDocBack = () => {
    setInlineDocType(null);
    setInlineDocHtml('');
    setInlineDocEditing(false);
  };

  const toggleInlineDocEdit = () => {
    const next = !inlineDocEditing;
    setInlineDocEditing(next);
    if (next && inlineDocRef.current) {
      setTimeout(() => inlineDocRef.current && inlineDocRef.current.focus(), 0);
    }
  };

  const inlineDocFmt = useCallback((cmd) => {
    if (!inlineDocEditing) return;
    try { document.execCommand(cmd, false, null); } catch (e) {}
    if (inlineDocRef.current) inlineDocRef.current.focus();
    try {
      setInlineDocFmtState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline')
      });
    } catch (e) {}
  }, [inlineDocEditing]);

  useEffect(() => {
    if (!inlineDocEditing) return;
    const handler = () => {
      try {
        setInlineDocFmtState({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline')
        });
      } catch (e) {}
    };
    const keyHandler = (e) => {
      if (!inlineDocRef.current) return;
      const inside = inlineDocRef.current.contains(document.activeElement) || inlineDocRef.current === document.activeElement;
      if (!inside) return;
      const key = e.key && e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === 'b' || key === 'i' || key === 'u')) {
        e.preventDefault();
        inlineDocFmt(key === 'b' ? 'bold' : key === 'i' ? 'italic' : 'underline');
      }
    };
    document.addEventListener('selectionchange', handler);
    document.addEventListener('keyup', handler);
    document.addEventListener('mouseup', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('selectionchange', handler);
      document.removeEventListener('keyup', handler);
      document.removeEventListener('mouseup', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [inlineDocEditing, inlineDocFmt]);

  const handleInlineDocPrint = () => {
    if (!inlineDocRef.current) return;
    const printContents = inlineDocRef.current.innerHTML;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument || iframe.contentWindow.document;
    idoc.open();
    idoc.write(
      '<!doctype html><html><head><meta charset="utf-8"/>' +
      '<title>' + (inlineDocTitle || 'Document') + '</title>' +
      '<style>' + INLINE_DOC_STYLE + '</style>' +
      '</head><body><div class="inline-doc-print-wrap">' + printContents + '</div></body></html>'
    );
    idoc.close();
    const doPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print failed:', err);
      }
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1500);
    };
    if (iframe.contentWindow && iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      setTimeout(doPrint, 120);
    } else {
      iframe.onload = () => setTimeout(doPrint, 120);
    }
  };

  const handleInlineDocExportPdf = async () => {
    if (!inlineDocRef.current) return;
    setInlineDocPdfLoading(true);
    const wasEditing = inlineDocEditing;
    if (wasEditing) setInlineDocEditing(false);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const node = inlineDocRef.current;
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL('image/png');
      if (imgH <= pageH - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
      } else {
        const pageContentH = pageH - margin * 2;
        const pxPerMm = canvas.width / imgW;
        const sliceHpx = pageContentH * pxPerMm;
        let sY = 0;
        while (sY < canvas.height) {
          const sH = Math.min(sliceHpx, canvas.height - sY);
          const slice = document.createElement('canvas');
          slice.width = canvas.width;
          slice.height = sH;
          slice.getContext('2d').drawImage(canvas, 0, sY, canvas.width, sH, 0, 0, canvas.width, sH);
          const sliceData = slice.toDataURL('image/png');
          const sliceMm = sH / pxPerMm;
          if (sY > 0) pdf.addPage();
          pdf.addImage(sliceData, 'PNG', margin, margin, imgW, sliceMm);
          sY += sH;
        }
      }
      const safeTitle = (inlineDocTitle || 'document').replace(/[^a-z0-9\-_ ]/gi, '_');
      pdf.save(`${safeTitle}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(`Failed to export PDF: ${err.message || err}`);
    } finally {
      setInlineDocPdfLoading(false);
      if (wasEditing) setInlineDocEditing(true);
    }
  };

  // Handle view voucher details - reuse the existing preview modal
  const handleViewVoucher = (voucher) => {
    // Determine main category from account_type
    const mainCategory = voucher.account_type?.toLowerCase() || '';
    
    // Find sub category from voucher's category field (which stores the sub category name)
    const subCategoryName = voucher.category || '';
    
    // Populate form with voucher data for preview
    setForm({
      voucherNumber: voucher.voucher_number,
      category: mainCategory,
      subCategory: subCategoryName,
      selectedTransactionTypeId: '',
      transactionType: voucher.transaction_type || '',
      description: voucher.description || '',
      amount: voucher.amount || '',
      date: voucher.transaction_date || '',
      reference: voucher.reference || '',
      currency: voucher.currency || 'LKR',
      fxRate: voucher.fx_rate || '1.00',
      counterparty: voucher.counterparty || '',
      notes: voucher.notes || '',
      cashFlowOnSettlement: voucher.cash_flow_on_settlement || '',
      selectedAccountId: '',
      settlementAccount: `${voucher.payment_account_name || ''} - ${voucher.payment_account_number || ''}`.trim(),
      paymentAccountName: voucher.payment_account_name || '',
      paymentAccountNumber: voucher.payment_account_number || '',
      paymentBankName: voucher.payment_bank_name || '',
      paymentBranchName: voucher.payment_branch_name || '',
      paymentMethod: voucher.payment_method || '',
      glAccountCode: '',
      coaDescription: ''
    });
    setShowPreviewModal(true);
  };

  // Handle delete voucher
  const handleDeleteVoucher = async (id) => {
    if (!window.confirm('Are you sure you want to delete this voucher?')) {
      return;
    }
    
    try {
      await otherTransactionAPI.deleteTransaction(id);
      // Refresh the list
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      alert('Error deleting voucher. Please try again.');
    }
  };

  const filteredVouchers = getFilteredVouchers();

  return (
    <div className="other-trans-page-container">
      <div className="other-trans-content-wrapper">
        <div className="other-trans-header-section">
          <div className="other-trans-header-icon">
            <svg className="other-trans-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="other-trans-header-text-group">
            <h1 className="other-trans-main-title">Non-Trading Transactions</h1>
            <p className="other-trans-subtitle">Manage other income, expenses, and assets. Multi-currency supported.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="other-trans-tab-navigation">
          {[
            { id: 'create', label: 'Create Voucher' },
            { id: 'defineTransaction', label: 'Define Transaction' },
            { id: 'view', label: 'View Vouchers' },
            { id: 'generalLedger', label: 'General Ledger' },
            { id: 'reverseTransaction', label: 'Reverse Transaction' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`other-trans-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conditional Render: Create Form or View List */}
        {activeTab === 'create' ? (
          /* Form Card */
        <div className="other-trans-form-card">
          <div className="other-trans-card-header">
            <h2 className="other-trans-card-title">Transaction Information</h2>
          </div>

          {/* Form Type Selection Buttons */}
          <div className="other-trans-form-type-nav">
            <button
              type="button"
              className={`other-trans-form-type-btn${activeFormType === 'voucher' ? ' active' : ''}`}
              onClick={() => setActiveFormType('voucher')}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
              </svg>
              Create Voucher
            </button>
            <button
              type="button"
              className={`other-trans-form-type-btn${activeFormType === 'assetDepreciation' ? ' active' : ''}`}
              onClick={() => setActiveFormType('assetDepreciation')}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
              Asset Depreciation
            </button>
            <button
              type="button"
              className={`other-trans-form-type-btn${activeFormType === 'assetDerecognition' ? ' active' : ''}`}
              onClick={() => setActiveFormType('assetDerecognition')}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
              </svg>
              Asset Derecognition
            </button>
            <button
              type="button"
              className={`other-trans-form-type-btn${activeFormType === 'liabilitySettlement' ? ' active' : ''}`}
              onClick={() => setActiveFormType('liabilitySettlement')}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm9.707 4.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Liability Settlement
            </button>
            <button
              type="button"
              className={`other-trans-form-type-btn${activeFormType === 'glToGl' ? ' active' : ''}`}
              onClick={() => setActiveFormType('glToGl')}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1h3a2 2 0 012 2v1a1 1 0 11-2 0V6H6v8h8v-1a1 1 0 112 0v1a2 2 0 01-2 2h-3v1a1 1 0 11-2 0v-1H7a2 2 0 01-2-2V6a2 2 0 012-2h3V3a1 1 0 011-1zm-2.707 6.293a1 1 0 010 1.414L6.414 10l.879.879a1 1 0 11-1.414 1.414l-1.586-1.586a1 1 0 010-1.414l1.586-1.586a1 1 0 011.414 0zm5.414 0a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414l-1.586 1.586a1 1 0 11-1.414-1.414L13.586 10l-.879-.879a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              GL to GL
            </button>
          </div>

          <div className={`other-trans-form-content other-trans-form-content--transaction-info${activeFormType === 'glToGl' ? ' other-trans-form-content--gl2gl' : ''}`}>
            {activeFormType === 'voucher' ? (
            <form onSubmit={handleSubmit}>
              <div className="other-trans-form-grid">

                {/* Voucher Number */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="other-trans-field-label" style={{ marginBottom: 0 }}>Voucher Number</label>
                    <button
                      type="button"
                      className="other-trans-btn-regenerate"
                      onClick={() => setForm(prev => ({ ...prev, voucherNumber: generateVoucherNumber() }))}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                      </svg>
                      Regenerate
                    </button>
                  </div>
                  <input
                    name="voucherNumber"
                    value={form.voucherNumber}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                  <small className="other-trans-field-hint">
                    Auto-generated voucher number
                  </small>
                </div>

                {/* Main Category */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="other-trans-form-select"
                    disabled={categoriesLoading}
                  >
                    <option value="">Select Main Category</option>
                    <option value="revenue">Revenue</option>
                    <option value="otherIncome">Other Income</option>
                    <option value="provisions">Provisions</option>
                    <option value="expense">Expense</option>
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                  </select>
                  {categoriesLoading && (
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Loading categories...
                    </small>
                  )}
                </div>

                {/* Sub Category */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Sub Category *</label>
                  <select
                    name="subCategory"
                    value={form.subCategory}
                    onChange={handleChange}
                    className="other-trans-form-select"
                    disabled={!form.category || categoriesLoading}
                  >
                    <option value="">Select Sub Category</option>
                    {form.category && categoriesByType[form.category] && categoriesByType[form.category].map((cat) => (
                      <option key={cat.id || cat.category_name} value={cat.category_name}>
                        {cat.category_name}
                          </option>
                        ))}
                  </select>
                  {!form.category && (
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Please select a main category first
                    </small>
                  )}
                  {form.category && (!categoriesByType[form.category] || categoriesByType[form.category].length === 0) && (
                    <small style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                      No sub-categories found for this main category. Please add categories in the "Account Category" screen first.
                    </small>
                  )}
                </div>

                {/* Transaction Type Name */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Transaction Type Name *</label>
                  <select
                    name="transactionType"
                    value={form.transactionType}
                    onChange={handleChange}
                    className="other-trans-form-select"
                    disabled={!form.subCategory}
                  >
                    <option value="">Select Transaction Type Name</option>
                    {transactionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {!form.subCategory && (
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Please select a Sub Category first
                    </small>
                  )}
                  {form.subCategory && transactionTypes.length === 0 && (
                    <small style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                      No transaction types defined for this sub category. Define one in the "Define Transaction" tab.
                    </small>
                  )}
                </div>

                {/* Defined Transaction Accounts Selection */}
                {form.transactionType && (
                  <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="other-trans-field-label">Select Defined Transaction Account *</label>
                    {definedTransactionTypesLoading ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                        Loading defined transaction accounts...
                      </div>
                    ) : definedTransactionTypesForVoucher.length === 0 ? (
                      <div style={{ 
                        padding: '1rem', 
                        background: '#fee2e2', 
                        border: '1px solid #ef4444', 
                        borderRadius: '0.375rem',
                        color: '#991b1b',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        No defined transaction accounts found for "{form.transactionType}". You must define at least one in the "Define Transaction" tab before creating a voucher.
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gap: '0.75rem',
                        marginTop: '0.5rem'
                      }}>
                        {definedTransactionTypesForVoucher.map((definedType) => (
                          <div
                            key={definedType.id}
                            onClick={() => {
                              setForm(prev => ({
                                ...prev,
                                selectedTransactionTypeId: definedType.id,
                                glAccountCode: definedType.gl_account_code || '',
                                coaDescription: definedType.coa_description || ''
                              }));
                            }}
                            style={{
                              padding: '1rem',
                              border: `2px solid ${form.selectedTransactionTypeId === definedType.id ? '#3b82f6' : '#e5e7eb'}`,
                              borderRadius: '0.5rem',
                              background: form.selectedTransactionTypeId === definedType.id ? '#eff6ff' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (form.selectedTransactionTypeId !== definedType.id) {
                                e.currentTarget.style.borderColor = '#93c5fd';
                                e.currentTarget.style.background = '#f0f9ff';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (form.selectedTransactionTypeId !== definedType.id) {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.background = 'white';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <div style={{
                                width: '1.25rem',
                                height: '1.25rem',
                                borderRadius: '50%',
                                border: `2px solid ${form.selectedTransactionTypeId === definedType.id ? '#3b82f6' : '#d1d5db'}`,
                                background: form.selectedTransactionTypeId === definedType.id ? '#3b82f6' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {form.selectedTransactionTypeId === definedType.id && (
                                  <div style={{
                                    width: '0.625rem',
                                    height: '0.625rem',
                                    borderRadius: '50%',
                                    background: 'white'
                                  }} />
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                {definedType.gl_account_code ? (
                                  <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9375rem' }}>
                                    {definedType.gl_account_code}
                                  </div>
                                ) : (
                                  <div style={{ fontWeight: '600', color: '#6b7280', fontSize: '0.9375rem', fontStyle: 'italic' }}>
                                    Common {form.category.charAt(0).toUpperCase() + form.category.slice(1)} Account
                                  </div>
                                )}
                                {definedType.coa_description && (
                                  <div style={{ color: '#059669', fontSize: '0.875rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                    {definedType.coa_description}
                                  </div>
                                )}
                                {definedType.description && (
                                  <div style={{ color: '#6b7280', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                    {definedType.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {definedTransactionTypesForVoucher.length > 0 && !form.selectedTransactionTypeId && (
                      <small style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', fontWeight: '500' }}>
                        You must select a defined transaction account to proceed.
                      </small>
                    )}
                    {definedTransactionTypesForVoucher.length > 0 && form.selectedTransactionTypeId && (
                      <small style={{ color: '#059669', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                        ✓ Selected account will be used for GL entries.
                      </small>
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Transaction Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className={`other-trans-form-input ${dateErrors.date ? 'error' : ''}`}
                    required
                  />
                  {dateErrors.date && (
                    <div className="other-trans-date-error-message">
                      <svg className="other-trans-error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{dateErrors.date}</span>
                    </div>
                  )}
                </div>

                {/* Currency */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Currency *</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="other-trans-form-select"
                  >
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                  </select>
                </div>

                {/* FX Rate */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">FX Rate → LKR</label>
                  <input
                    type="number"
                    name="fxRate"
                    step="0.0001"
                    placeholder="Enter exchange rate"
                    value={form.fxRate}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Amount */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={handleChange}
                    className="other-trans-form-input"
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Must be greater than zero
                  </small>
                </div>

                {/* Reference */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Reference</label>
                  <input
                    name="reference"
                    placeholder="Enter reference number"
                    value={form.reference}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Counterparty */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Counterparty</label>
                  <input
                    name="counterparty"
                    placeholder="Enter counterparty name"
                    value={form.counterparty}
                    onChange={handleChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Description */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Description</label>
                  <textarea
                    name="description"
                    placeholder="Enter transaction description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    className="other-trans-form-textarea"
                  ></textarea>
                </div>
              </div>

              {/* Payment & Settlement Details Section */}
              <div className="other-trans-section-block other-trans-section-block--spaced">
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
                    borderRadius: '0.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.11)'
                  }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Payment & Settlement Details</h3>
                </div>
                
                <div className="other-trans-form-grid">
                  {/* Cash Flow On Settlement */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Cash Flow On Settlement (Rs.)</label>
                    <input
                      name="cashFlowOnSettlement"
                      value={form.cashFlowOnSettlement}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Account Selection Dropdown */}
                  <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="other-trans-field-label">Select Account</label>
                    <select
                      name="selectedAccountId"
                      value={form.selectedAccountId}
                      onChange={handleChange}
                      className="other-trans-form-select"
                      disabled={accountsLoading}
                    >
                      <option value="">Select an account (optional - defaults will be used if not selected)</option>
                      {accounts.map((account) => {
                        const hasMapping = accountsWithMapping.includes(account.id);
                        return (
                          <option 
                            key={account.id} 
                            value={hasMapping ? account.id : ''}
                            disabled={!hasMapping}
                          >
                          {account.account_name} - {account.account_number} ({account.bank_name})
                            {!hasMapping ? ' - No GL Mapping' : ''}
                        </option>
                        );
                      })}
                    </select>
                    {accountsLoading && <small style={{ color: '#6b7280' }}>Loading accounts...</small>}
                    {accounts.length > 0 && accountsWithMapping.length === 0 && (
                      <small style={{ 
                        display: 'block',
                        marginTop: '0.5rem',
                        color: '#f59e0b',
                        fontSize: '0.875rem'
                      }}>
                        ⚠️ No accounts with GL mappings found. Default accounts will be used for GL entries.
                      </small>
                    )}
                    {accounts.length > 0 && accountsWithMapping.length > 0 && (
                      <small style={{ 
                        display: 'block',
                        marginTop: '0.5rem',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }}>
                        Only accounts with GL mappings are available. If no account is selected, defaults will be used.
                      </small>
                    )}
                  </div>

                  {/* Account Name */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Account Name</label>
                    <input
                      name="paymentAccountName"
                      placeholder="Auto-filled"
                      value={form.paymentAccountName}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Account Number */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Account Number</label>
                    <input
                      name="paymentAccountNumber"
                      placeholder="Auto-filled"
                      value={form.paymentAccountNumber}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Bank Name */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Bank Name</label>
                    <input
                      name="paymentBankName"
                      placeholder="Auto-filled"
                      value={form.paymentBankName}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Branch Name */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Branch Name</label>
                    <input
                      name="paymentBranchName"
                      placeholder="Auto-filled"
                      value={form.paymentBranchName}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={handleChange}
                      className="other-trans-form-select"
                    >
                      <option value="">Select Payment Method</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Online Banking">Online Banking</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="other-trans-notes-section">
                <label className="other-trans-field-label">Notes & Additional Information</label>
                <textarea
                  name="notes"
                  placeholder="Add any additional notes or information..."
                  value={form.notes}
                  onChange={handleChange}
                  rows="4"
                  className="other-trans-form-textarea"
                ></textarea>
              </div>

              {/* Success/Error Message */}
              {submitMessage && (
                <div className={`other-trans-message ${submitMessage.includes('Error') ? 'other-trans-error' : 'other-trans-success'}`}>
                  {submitMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="other-trans-button-section">
                <button
                  type="reset"
                  onClick={handleReset}
                  className="other-trans-btn other-trans-btn-secondary"
                  disabled={isSubmitting}
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  className="other-trans-btn other-trans-btn-tertiary"
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowPreviewModal(true);
                  }}
                >
                  Preview Voucher
                </button>
                <button
                  type="submit"
                  className="other-trans-btn other-trans-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Voucher'}
                </button>
              </div>
            </form>
            ) : activeFormType === 'glToGl' ? (
            /* GL to GL Form — one voucher; multiple debit/credit lines (multi-line post when backend ready) */
            <form onSubmit={handleGlToGlSubmit}>
              <div className="other-trans-form-grid">
                {/* Voucher Number */}
                <div className="other-trans-field-group other-trans-field-group--full">
                  <div className="other-trans-voucher-row">
                    <label className="other-trans-field-label other-trans-field-label--inline">Voucher Number</label>
                    <button
                      type="button"
                      className="other-trans-btn-regenerate"
                      onClick={() => setGlToGlForm(prev => ({ ...prev, voucherNumber: generateVoucherNumber() }))}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                      </svg>
                      Regenerate
                    </button>
                  </div>
                  <input
                    name="voucherNumber"
                    value={glToGlForm.voucherNumber}
                    onChange={handleGlToGlHeaderChange}
                    className="other-trans-form-input"
                  />
                  <small className="other-trans-field-hint">
                    Same voucher number applies to every debit/credit line below
                  </small>
                </div>

                {/* Date */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={glToGlForm.date}
                    onChange={handleGlToGlHeaderChange}
                    className="other-trans-form-input"
                    required
                  />
                </div>

                {/* Totals hint */}
                <div className="other-trans-field-group" style={{ alignSelf: 'end' }}>
                  <label className="other-trans-field-label">Journal balance</label>
                  <div className="other-trans-gl2gl-balance-card">
                    {(() => {
                      const parseAmt = (raw) => {
                        const n = parseFloat(String(raw || '').replace(/,/g, ''));
                        return Number.isFinite(n) ? n : 0;
                      };
                      const dr = glToGlDebitLines.reduce(
                        (s, l) => s + ((l.accountCode || '').trim() ? parseAmt(l.amount) : 0),
                        0
                      );
                      const cr = glToGlCreditLines.reduce(
                        (s, l) => s + ((l.accountCode || '').trim() ? parseAmt(l.amount) : 0),
                        0
                      );
                      const bal = dr - cr;
                      return (
                        <>
                          <div><strong>Debits:</strong> {dr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div><strong>Credits:</strong> {cr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div
                            className={`other-trans-gl2gl-balance-outcome ${Math.abs(bal) < 0.01 ? 'other-trans-gl2gl-balance-ok' : 'other-trans-gl2gl-balance-warn'}`}
                          >
                            <strong>Out of balance:</strong> {bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Debit lines */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <div className="other-trans-gl2gl-section-header">
                    <div className="other-trans-gl2gl-section-title-row">
                      <label className="other-trans-field-label other-trans-gl2gl-section-label">Debit lines</label>
                      {glToGlDebitFixed ? (
                        <>
                          <span className="other-trans-gl2gl-fixed-badge">Saved</span>
                          <button
                            type="button"
                            className="other-trans-gl2gl-edit-lines-btn"
                            onClick={handleGlToGlUnlockDebitLines}
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="other-trans-gl2gl-save-lines-btn"
                          onClick={handleGlToGlFixDebitLines}
                        >
                          Save
                        </button>
                      )}
                    </div>
                    {!glToGlDebitFixed && (
                    <button
                      type="button"
                      onClick={addGlToGlDebitLine}
                      className="other-trans-btn other-trans-btn-secondary"
                    >
                      + Add debit line
                    </button>
                    )}
                  </div>
                  {glToGlDebitFixMessage && (
                    <p
                      className={`other-trans-gl2gl-side-fix-message${
                        glToGlDebitFixed ? ' other-trans-gl2gl-fix-message--ok' : ' other-trans-gl2gl-fix-message--err'
                      }`}
                    >
                      {glToGlDebitFixMessage}
                    </p>
                  )}
                  <datalist id="glToGlDebitAccounts">
                    {chartAccounts.map((a) => (
                      <option key={`dr-${a.account_code}`} value={a.account_code}>
                        {a.description}
                      </option>
                    ))}
                  </datalist>
                  <div className="other-trans-gl2gl-lines">
                    {glToGlDebitLines.map((line, idx) => (
                      <div
                        key={line.id}
                        className={`other-trans-gl2gl-line-card${glToGlDebitFixed ? ' other-trans-gl2gl-line-card--locked' : ''}`}
                      >
                        <div className="other-trans-gl2gl-line-card-header">
                          <span className="other-trans-gl2gl-line-title">Debit line {idx + 1}</span>
                          {!glToGlDebitFixed && glToGlDebitLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeGlToGlDebitLine(line.id)}
                              className="other-trans-gl2gl-remove-btn"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="other-trans-form-grid other-trans-form-grid--compact">
                          <div className="other-trans-field-group">
                            <label className="other-trans-field-label">GL code *</label>
                            <input
                              value={line.accountCode}
                              onChange={(e) => handleGlToGlDebitLineChange(line.id, 'accountCode', e.target.value)}
                              className="other-trans-form-input"
                              list={glToGlDebitFixed ? undefined : 'glToGlDebitAccounts'}
                              placeholder={chartAccountsLoading ? 'Loading…' : 'Account code'}
                              readOnly={glToGlDebitFixed}
                            />
                          </div>
                          <div className="other-trans-field-group">
                            <label className="other-trans-field-label">Amount *</label>
                            <input
                              type="number"
                              value={line.amount}
                              onChange={(e) => handleGlToGlDebitLineChange(line.id, 'amount', e.target.value)}
                              className="other-trans-form-input"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              readOnly={glToGlDebitFixed}
                            />
                          </div>
                          <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="other-trans-field-label">Account name (optional)</label>
                            <input
                              value={line.accountName}
                              onChange={(e) => handleGlToGlDebitLineChange(line.id, 'accountName', e.target.value)}
                              className="other-trans-form-input"
                              placeholder="Defaults from Chart of Accounts when code matches"
                              readOnly={glToGlDebitFixed}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Credit lines */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <div className="other-trans-gl2gl-section-header">
                    <div className="other-trans-gl2gl-section-title-row">
                      <label className="other-trans-field-label other-trans-gl2gl-section-label">Credit lines</label>
                      {glToGlCreditFixed ? (
                        <>
                          <span className="other-trans-gl2gl-fixed-badge">Saved</span>
                          <button
                            type="button"
                            className="other-trans-gl2gl-edit-lines-btn"
                            onClick={handleGlToGlUnlockCreditLines}
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="other-trans-gl2gl-save-lines-btn"
                          onClick={handleGlToGlFixCreditLines}
                        >
                          Save
                        </button>
                      )}
                    </div>
                    {!glToGlCreditFixed && (
                    <button
                      type="button"
                      onClick={addGlToGlCreditLine}
                      className="other-trans-btn other-trans-btn-secondary"
                    >
                      + Add credit line
                    </button>
                    )}
                  </div>
                  {glToGlCreditFixMessage && (
                    <p
                      className={`other-trans-gl2gl-side-fix-message${
                        glToGlCreditFixed ? ' other-trans-gl2gl-fix-message--ok' : ' other-trans-gl2gl-fix-message--err'
                      }`}
                    >
                      {glToGlCreditFixMessage}
                    </p>
                  )}
                  <datalist id="glToGlCreditAccounts">
                    {chartAccounts.map((a) => (
                      <option key={`cr-${a.account_code}`} value={a.account_code}>
                        {a.description}
                      </option>
                    ))}
                  </datalist>
                  <div className="other-trans-gl2gl-lines">
                    {glToGlCreditLines.map((line, idx) => (
                      <div
                        key={line.id}
                        className={`other-trans-gl2gl-line-card${glToGlCreditFixed ? ' other-trans-gl2gl-line-card--locked' : ''}`}
                      >
                        <div className="other-trans-gl2gl-line-card-header">
                          <span className="other-trans-gl2gl-line-title">Credit line {idx + 1}</span>
                          {!glToGlCreditFixed && glToGlCreditLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeGlToGlCreditLine(line.id)}
                              className="other-trans-gl2gl-remove-btn"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="other-trans-form-grid other-trans-form-grid--compact">
                          <div className="other-trans-field-group">
                            <label className="other-trans-field-label">GL code *</label>
                            <input
                              value={line.accountCode}
                              onChange={(e) => handleGlToGlCreditLineChange(line.id, 'accountCode', e.target.value)}
                              className="other-trans-form-input"
                              list={glToGlCreditFixed ? undefined : 'glToGlCreditAccounts'}
                              placeholder={chartAccountsLoading ? 'Loading…' : 'Account code'}
                              readOnly={glToGlCreditFixed}
                            />
                          </div>
                          <div className="other-trans-field-group">
                            <label className="other-trans-field-label">Amount *</label>
                            <input
                              type="number"
                              value={line.amount}
                              onChange={(e) => handleGlToGlCreditLineChange(line.id, 'amount', e.target.value)}
                              className="other-trans-form-input"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              readOnly={glToGlCreditFixed}
                            />
                          </div>
                          <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="other-trans-field-label">Account name (optional)</label>
                            <input
                              value={line.accountName}
                              onChange={(e) => handleGlToGlCreditLineChange(line.id, 'accountName', e.target.value)}
                              className="other-trans-form-input"
                              placeholder="Defaults from Chart of Accounts when code matches"
                              readOnly={glToGlCreditFixed}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="other-trans-gl2gl-helper">
                  Use <strong>Save</strong> beside Debit lines and Credit lines to lock each side locally. Totals must match before posting.
                </p>

                {/* Description */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Description</label>
                  <input
                    name="description"
                    value={glToGlForm.description}
                    onChange={handleGlToGlHeaderChange}
                    className="other-trans-form-input"
                    placeholder="Narration for the journal"
                  />
                </div>

                {/* Reference */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Reference</label>
                  <input
                    name="reference"
                    value={glToGlForm.reference}
                    onChange={handleGlToGlHeaderChange}
                    className="other-trans-form-input"
                    placeholder="Optional reference"
                  />
                </div>

                {/* Notes */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Notes</label>
                  <textarea
                    name="notes"
                    value={glToGlForm.notes}
                    onChange={handleGlToGlHeaderChange}
                    rows="2"
                    className="other-trans-form-textarea"
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              {/* Success/Error Message */}
              {submitMessage && (
                <div className={`other-trans-message ${submitMessage.includes('Error') ? 'other-trans-error' : 'other-trans-success'}`}>
                  {submitMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="other-trans-button-section">
                <button
                  type="button"
                  onClick={handleGlToGlReset}
                  className="other-trans-btn other-trans-btn-secondary"
                  disabled={isSubmitting}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="other-trans-btn other-trans-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Post GL to GL'}
                </button>
              </div>
            </form>
            ) : activeFormType === 'assetDepreciation' ? (
            /* Asset Depreciation Form */
            <form onSubmit={(e) => { e.preventDefault(); setSubmitMessage('Asset Depreciation form submission - Backend integration pending'); }}>
              <div className="other-trans-form-grid">
                
                {/* Voucher Number */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="other-trans-field-label" style={{ marginBottom: 0 }}>Voucher Number</label>
                    <button
                      type="button"
                      onClick={() => setAssetDepreciationForm(prev => ({ ...prev, voucherNumber: generateVoucherNumber() }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.15rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                      </svg>
                      Regenerate
                    </button>
                  </div>
                  <input
                    name="voucherNumber"
                    value={assetDepreciationForm.voucherNumber}
                    onChange={handleAssetDepreciationChange}
                    className="other-trans-form-input"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Auto-generated voucher number
                  </small>
                </div>

                {/* Depreciation Date */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Depreciation Date *</label>
                  <input
                    type="date"
                    name="depreciationDate"
                    value={assetDepreciationForm.depreciationDate}
                    onChange={handleAssetDepreciationChange}
                    className="other-trans-form-input"
                    required
                  />
                </div>

                {/* Reference */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Reference</label>
                  <input
                    name="reference"
                    placeholder="Enter reference number"
                    value={assetDepreciationForm.reference}
                    onChange={handleAssetDepreciationChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Asset Account Section */}
                <div className="other-trans-section-block other-trans-section-block--grid">
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.11)'
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Asset Account</h3>
                  </div>
                  
                  <div className="other-trans-form-grid">
                    {/* Asset Account Code */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Asset Account Code *</label>
                      <input
                        name="assetAccountCode"
                        placeholder="Enter asset account code (e.g., 101-XXX-XXX-XX)"
                        value={assetDepreciationForm.assetAccountCode}
                        onChange={handleAssetDepreciationChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>

                    {/* Asset Account Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Asset Account Name *</label>
                      <input
                        name="assetAccountName"
                        placeholder="Enter asset account name"
                        value={assetDepreciationForm.assetAccountName}
                        onChange={handleAssetDepreciationChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Depreciation Expense Account Section */}
                <div className="other-trans-section-block other-trans-section-block--grid">
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      borderRadius: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.11)'
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Depreciation Expense Account</h3>
                  </div>
                  
                  <div className="other-trans-form-grid">
                    {/* Depreciation Expense Account Code */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Depreciation Expense Account Code *</label>
                      <input
                        name="depreciationExpenseAccountCode"
                        placeholder="Enter depreciation expense account code (e.g., 601-XXX-XXX-XX)"
                        value={assetDepreciationForm.depreciationExpenseAccountCode}
                        onChange={handleAssetDepreciationChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>

                    {/* Depreciation Expense Account Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Depreciation Expense Account Name *</label>
                      <input
                        name="depreciationExpenseAccountName"
                        placeholder="Enter depreciation expense account name"
                        value={assetDepreciationForm.depreciationExpenseAccountName}
                        onChange={handleAssetDepreciationChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Accumulated Depreciation Account Section */}
                <div className="other-trans-section-block other-trans-section-block--grid">
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      borderRadius: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.11)'
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Accumulated Depreciation Account</h3>
                  </div>
                  
                  <div className="other-trans-form-grid">
                    {/* Accumulated Depreciation Account Code */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Accumulated Depreciation Account Code *</label>
                      <input
                        name="accumulatedDepreciationAccountCode"
                        placeholder="Enter accumulated depreciation account code (e.g., 101-XXX-XXX-XX)"
                        value={assetDepreciationForm.accumulatedDepreciationAccountCode}
                        onChange={handleAssetDepreciationChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>

                    {/* Accumulated Depreciation Account Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Accumulated Depreciation Account Name *</label>
                      <input
                        name="accumulatedDepreciationAccountName"
                        placeholder="Enter accumulated depreciation account name"
                        value={assetDepreciationForm.accumulatedDepreciationAccountName}
                        onChange={handleAssetDepreciationChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Depreciation Amount */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Depreciation Amount *</label>
                  <input
                    type="number"
                    name="depreciationAmount"
                    step="0.01"
                    placeholder="Enter depreciation amount"
                    value={assetDepreciationForm.depreciationAmount}
                    onChange={handleAssetDepreciationChange}
                    className="other-trans-form-input"
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Must be greater than zero
                  </small>
                </div>

                {/* Description */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Description</label>
                  <textarea
                    name="description"
                    placeholder="Enter depreciation description (e.g., Monthly depreciation for Machinery)"
                    value={assetDepreciationForm.description}
                    onChange={handleAssetDepreciationChange}
                    rows="3"
                    className="other-trans-form-textarea"
                  ></textarea>
                </div>

                {/* Notes */}
                <div className="other-trans-notes-section" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Notes & Additional Information</label>
                  <textarea
                    name="notes"
                    placeholder="Add any additional notes or information..."
                    value={assetDepreciationForm.notes}
                    onChange={handleAssetDepreciationChange}
                    rows="4"
                    className="other-trans-form-textarea"
                  ></textarea>
                </div>
              </div>

              {/* Success/Error Message */}
              {submitMessage && (
                <div className={`other-trans-message ${submitMessage.includes('Error') ? 'other-trans-error' : 'other-trans-success'}`}>
                  {submitMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="other-trans-button-section">
                <button
                  type="button"
                  onClick={handleAssetDepreciationReset}
                  className="other-trans-btn other-trans-btn-secondary"
                  disabled={isSubmitting}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="other-trans-btn other-trans-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Depreciation Entry'}
                </button>
              </div>
            </form>
            ) : activeFormType === 'assetDerecognition' ? (
            /* Asset Derecognition Form */
            <form onSubmit={handleAssetDerecognitionSubmit}>
              <div className="other-trans-form-grid">
                
                {/* Voucher Number */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="other-trans-field-label" style={{ marginBottom: 0 }}>Voucher Number</label>
                    <button
                      type="button"
                      onClick={() => setAssetDerecognitionForm(prev => ({ ...prev, voucherNumber: generateVoucherNumber() }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.15rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                      </svg>
                      Regenerate
                    </button>
                  </div>
                  <input
                    name="voucherNumber"
                    value={assetDerecognitionForm.voucherNumber}
                    onChange={handleAssetDerecognitionChange}
                    className="other-trans-form-input"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Auto-generated voucher number
                  </small>
                </div>

                {/* Derecognition Date */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Derecognition Date *</label>
                  <input
                    type="date"
                    name="derecognitionDate"
                    value={assetDerecognitionForm.derecognitionDate}
                    onChange={handleAssetDerecognitionChange}
                    className="other-trans-form-input"
                    required
                  />
                </div>

                {/* Reference */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Reference</label>
                  <input
                    name="reference"
                    placeholder="Enter reference number"
                    value={assetDerecognitionForm.reference}
                    onChange={handleAssetDerecognitionChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Asset Account Section */}
                <div className="other-trans-section-block other-trans-section-block--grid">
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.11)'
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Asset Being Sold/Disposed</h3>
                  </div>
                  
                  <div className="other-trans-form-grid">
                    {/* Asset Account Code */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Asset Account Code *</label>
                      <input
                        name="assetAccountCode"
                        placeholder="Enter asset account code (e.g., 101-XXX-XXX-XX)"
                        value={assetDerecognitionForm.assetAccountCode}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>

                    {/* Asset Account Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Asset Account Name *</label>
                      <input
                        name="assetAccountName"
                        placeholder="Enter asset account name"
                        value={assetDerecognitionForm.assetAccountName}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>

                    {/* Accumulated Depreciation Account Code */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Accumulated Depreciation Account Code *</label>
                      <input
                        name="accumulatedDepreciationAccountCode"
                        placeholder="Enter accumulated depreciation account code"
                        value={assetDerecognitionForm.accumulatedDepreciationAccountCode}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>

                    {/* Accumulated Depreciation Account Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Accumulated Depreciation Account Name *</label>
                      <input
                        name="accumulatedDepreciationAccountName"
                        placeholder="Enter accumulated depreciation account name"
                        value={assetDerecognitionForm.accumulatedDepreciationAccountName}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Details Section */}
                <div className="other-trans-section-block other-trans-section-block--grid">
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      borderRadius: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.11)'
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Financial Details</h3>
                  </div>
                  
                  <div className="other-trans-form-grid">
                    {/* Asset Book Value */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Asset Book Value *</label>
                      <input
                        type="number"
                        name="assetBookValue"
                        step="0.01"
                        placeholder="Enter asset book value"
                        value={assetDerecognitionForm.assetBookValue}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Net book value of the asset
                      </small>
                    </div>

                    {/* Sale Proceeds */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Sale Proceeds *</label>
                      <input
                        type="number"
                        name="saleProceeds"
                        step="0.01"
                        placeholder="Enter sale proceeds"
                        value={assetDerecognitionForm.saleProceeds}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Amount received from sale
                      </small>
                    </div>

                    {/* Gain/Loss Amount */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Gain/Loss Amount</label>
                      <input
                        type="number"
                        name="gainLossAmount"
                        step="0.01"
                        placeholder="Auto-calculated"
                        value={assetDerecognitionForm.gainLossAmount}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        readOnly
                        style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                      />
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {parseFloat(assetDerecognitionForm.gainLossAmount || 0) > 0 ? 'Gain' : parseFloat(assetDerecognitionForm.gainLossAmount || 0) < 0 ? 'Loss' : 'Calculated automatically'}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Proceeds Account Section */}
                <div className="other-trans-section-block other-trans-section-block--grid">
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.11)'
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Proceeds Account (Cash/Bank)</h3>
                  </div>
                  
                  <div className="other-trans-form-grid">
                    {/* Proceeds Account Code */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Proceeds Account Code *</label>
                      <input
                        name="proceedsAccountCode"
                        placeholder="Enter proceeds account code (e.g., 101-XXX-XXX-XX)"
                        value={assetDerecognitionForm.proceedsAccountCode}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>

                    {/* Proceeds Account Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Proceeds Account Name *</label>
                      <input
                        name="proceedsAccountName"
                        placeholder="Enter proceeds account name"
                        value={assetDerecognitionForm.proceedsAccountName}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Gain/Loss Account Section */}
                <div className="other-trans-section-block other-trans-section-block--grid">
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      borderRadius: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.11)'
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Gain/Loss on Disposal Account</h3>
                  </div>
                  
                  <div className="other-trans-form-grid">
                    {/* Gain/Loss Account Code */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Gain/Loss Account Code *</label>
                      <input
                        name="gainLossAccountCode"
                        placeholder="Enter gain/loss account code (e.g., 401-XXX-XXX-XX for gain, 601-XXX-XXX-XX for loss)"
                        value={assetDerecognitionForm.gainLossAccountCode}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>

                    {/* Gain/Loss Account Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Gain/Loss Account Name *</label>
                      <input
                        name="gainLossAccountName"
                        placeholder="Enter gain/loss account name"
                        value={assetDerecognitionForm.gainLossAccountName}
                        onChange={handleAssetDerecognitionChange}
                        className="other-trans-form-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Description</label>
                  <textarea
                    name="description"
                    placeholder="Enter asset derecognition description (e.g., Sale of Machinery - Invoice #12345)"
                    value={assetDerecognitionForm.description}
                    onChange={handleAssetDerecognitionChange}
                    rows="3"
                    className="other-trans-form-textarea"
                  ></textarea>
                </div>

                {/* Notes */}
                <div className="other-trans-notes-section" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Notes & Additional Information</label>
                  <textarea
                    name="notes"
                    placeholder="Add any additional notes or information..."
                    value={assetDerecognitionForm.notes}
                    onChange={handleAssetDerecognitionChange}
                    rows="4"
                    className="other-trans-form-textarea"
                  ></textarea>
                </div>
              </div>

              {/* Success/Error Message */}
              {submitMessage && (
                <div className={`other-trans-message ${submitMessage.includes('Error') ? 'other-trans-error' : 'other-trans-success'}`}>
                  {submitMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="other-trans-button-section">
                <button
                  type="button"
                  onClick={handleAssetDerecognitionReset}
                  className="other-trans-btn other-trans-btn-secondary"
                  disabled={isSubmitting}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="other-trans-btn other-trans-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Derecognition Entry'}
                </button>
              </div>
            </form>
            ) : (
            /* Liability Settlement Form */
            <form onSubmit={handleLiabilitySettlementSubmit}>
              <div className="other-trans-form-grid">
                
                {/* Select Previous Voucher */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Select Previous Voucher *</label>
                  <select
                    name="selectedVoucherId"
                    value={liabilitySettlementForm.selectedVoucherId}
                    onChange={handleLiabilitySettlementChange}
                    className="other-trans-form-select"
                    disabled={vouchersLoading}
                    required
                  >
                    <option value="">Select a previous liability settlement voucher to copy details</option>
                    {vouchers
                      .filter(v => {
                        // Filter for liability transactions only
                        const accountType = (v.account_type || '').toLowerCase();
                        if (accountType !== 'liability') return false;
                        
                        // Exclude reversal vouchers (those starting with "RV-")
                        if (v.voucher_number && v.voucher_number.startsWith('RV-')) return false;
                        
                        // Exclude settlement vouchers themselves (those starting with "LS-")
                        if (v.voucher_number && v.voucher_number.startsWith('LS-')) return false;
                        
                        // Exclude vouchers that have already been fully settled
                        if (isVoucherSettled(v)) return false;
                        
                        // Keep if there is a remaining balance to settle
                        const remaining = getVoucherRemainingAmount(v);
                        return remaining > 0;
                      })
                      .map(v => {
                        const remaining = getVoucherRemainingAmount(v);
                        const originalAmt = parseFloat(v.amount) || 0;
                        return (
                          <option key={v.id} value={v.id}>
                            {v.voucher_number} — {v.transaction_type || 'Liability Settlement'} — Original: {originalAmt ? `${originalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${v.currency || 'LKR'}` : 'N/A'} — Remaining: {remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {v.currency || 'LKR'} — {v.transaction_date ? v.transaction_date.substring(0, 10) : 'N/A'}
                          </option>
                        );
                      })}
                  </select>
                  {vouchersLoading && (
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Loading vouchers...
                    </small>
                  )}
                  {!vouchersLoading && vouchers.filter(v => {
                    const accountType = (v.account_type || '').toLowerCase();
                    if (accountType !== 'liability') return false;
                    if (v.voucher_number && v.voucher_number.startsWith('RV-')) return false;
                    if (v.voucher_number && v.voucher_number.startsWith('LS-')) return false;
                    if (isVoucherSettled(v)) return false;
                    if (getVoucherRemainingAmount(v) <= 0) return false;
                    return true;
                  }).length === 0 && (
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      No previous liability settlement vouchers found
                    </small>
                  )}
                </div>

                {/* New Voucher Number */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Voucher Number</label>
                  <input
                    name="voucherNumber"
                    value={liabilitySettlementForm.voucherNumber}
                    onChange={handleLiabilitySettlementChange}
                    className="other-trans-form-input"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Auto-generated voucher number (new voucher will be created)
                  </small>
                </div>

                {/* Settlement Date */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Settlement Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={liabilitySettlementForm.date}
                    onChange={handleLiabilitySettlementChange}
                    className="other-trans-form-input"
                    required
                  />
                </div>

                {/* Reference */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Reference</label>
                  <input
                    name="reference"
                    placeholder="Enter reference number"
                    value={liabilitySettlementForm.reference}
                    onChange={handleLiabilitySettlementChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Liability Account Section */}
                <div className="other-trans-section-block other-trans-section-block--grid">
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      borderRadius: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.11)'
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Liability Account</h3>
                  </div>
                  
                  <div className="other-trans-form-grid">
                    {/* Category */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Category *</label>
                      <select
                        name="category"
                        value={liabilitySettlementForm.category}
                        className="other-trans-form-select"
                        disabled
                      >
                        <option value="liability">Liability</option>
                      </select>
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Fixed to Liability for settlement transactions
                      </small>
                    </div>

                    {/* Sub Category */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Sub Category *</label>
                      <select
                        name="subCategory"
                        value={liabilitySettlementForm.subCategory}
                        onChange={handleLiabilitySettlementChange}
                        className="other-trans-form-select"
                        disabled={categoriesLoading}
                        required
                      >
                        <option value="">Select Sub Category</option>
                        {liabilitySettlementForm.category && categoriesByType[liabilitySettlementForm.category] && categoriesByType[liabilitySettlementForm.category].map((cat) => (
                          <option key={cat.id || cat.category_name} value={cat.category_name}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                      {categoriesLoading && (
                        <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          Loading categories...
                        </small>
                      )}
                      {!liabilitySettlementForm.category && (
                        <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          Please select a main category first
                        </small>
                      )}
                      {liabilitySettlementForm.category && (!categoriesByType[liabilitySettlementForm.category] || categoriesByType[liabilitySettlementForm.category].length === 0) && (
                        <small style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                          No sub-categories found for this main category. Please add categories in the "Account Category" screen first.
                        </small>
                      )}
                    </div>

                    {/* Transaction Type Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Transaction Type Name *</label>
                      <select
                        name="transactionType"
                        value={liabilitySettlementForm.transactionType}
                        onChange={handleLiabilitySettlementChange}
                        className="other-trans-form-select"
                        disabled={!liabilitySettlementForm.subCategory}
                        required
                      >
                        <option value="">Select Transaction Type Name</option>
                        {transactionTypesForLiabilitySettlement.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {!liabilitySettlementForm.subCategory && (
                        <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          Please select a Sub Category first
                        </small>
                      )}
                      {liabilitySettlementForm.subCategory && transactionTypesForLiabilitySettlement.length === 0 && (
                        <small style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                          No transaction types defined for this sub category. Define one in the "Define Transaction" tab.
                        </small>
                      )}
                    </div>

                    {/* Liability Account Code with Search */}
                    <div className="other-trans-field-group" style={{ position: 'relative' }}>
                      <label className="other-trans-field-label">Liability Account Code *</label>
                      <input
                        type="text"
                        name="glAccountCode"
                        value={liabilitySettlementForm.glAccountCode}
                        onChange={handleLiabilitySettlementChange}
                        onBlur={() => {
                          // When user leaves the field, try to find exact match
                          if (liabilitySettlementForm.glAccountCode) {
                            const matchingAccount = chartAccounts.find(acc => 
                              acc.account_code && acc.account_code.toLowerCase() === liabilitySettlementForm.glAccountCode.toLowerCase().trim()
                            );
                            if (matchingAccount) {
                              setLiabilitySettlementForm(prev => ({ 
                                ...prev, 
                                coaDescription: matchingAccount.description || ''
                              }));
                            }
                          }
                          setShowLiabilityAccountList(false);
                        }}
                        onFocus={() => setShowLiabilityAccountList(true)}
                        className="other-trans-form-input"
                        placeholder="Type to search code or name"
                        disabled={chartAccountsLoading}
                        autoComplete="off"
                        required
                      />
                      {(!chartAccountsLoading && showLiabilityAccountList) && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.25rem',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          zIndex: 10,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                          {(() => {
                            // Filter chart accounts by liability accounts (account_type = 'liability')
                            const term = (liabilityAccountSearchTerm || liabilitySettlementForm.glAccountCode || '').toLowerCase();
                            const filteredAccounts = chartAccounts.filter((acc) => {
                              // Filter by account_type = liability
                              const accType = (acc.account_type || '').toLowerCase();
                              if (accType !== 'liability') {
                                return false;
                              }
                              
                              // Then filter by search term
                              if (!term) return true;
                              return (
                                (acc.account_code || '').toLowerCase().includes(term) ||
                                (acc.description || '').toLowerCase().includes(term)
                              );
                            });

                            if (chartAccounts.length === 0) {
                              return <div style={{ padding: '0.5rem 0.75rem', color: '#6b7280' }}>No accounts loaded</div>;
                            }
                            if (filteredAccounts.length === 0) {
                              return <div style={{ padding: '0.5rem 0.75rem', color: '#6b7280' }}>
                                No liability accounts found matching "{liabilityAccountSearchTerm || liabilitySettlementForm.glAccountCode}"
                              </div>;
                            }

                            return filteredAccounts.map((acc) => (
                              <div
                                key={acc.account_code}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setLiabilitySettlementForm(prev => ({ 
                                    ...prev, 
                                    glAccountCode: acc.account_code,
                                    coaDescription: acc.description || ''
                                  }));
                                  setLiabilityAccountSearchTerm(`${acc.account_code} - ${acc.description}`);
                                  setShowLiabilityAccountList(false);
                                }}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f3f4f6'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                              >
                                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{acc.account_code}</div>
                                <div style={{ color: '#6b7280', fontSize: '0.8125rem' }}>{acc.description}</div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                      {chartAccountsLoading && (
                        <small style={{ color: '#6b7280' }}>Loading Chart of Accounts...</small>
                      )}
                      <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                        Type to search for liability accounts from Chart of Accounts
                      </small>
                    </div>

                    {/* Liability Account Name (Auto-filled) */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Liability Account Name *</label>
                      <input
                        name="coaDescription"
                        placeholder="Auto-filled from Chart of Accounts"
                        value={liabilitySettlementForm.coaDescription}
                        onChange={handleLiabilitySettlementChange}
                        className="other-trans-form-input"
                        required
                      />
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Auto-filled when you select an account code, or enter manually
                      </small>
                    </div>
                  </div>
                </div>

                {/* Payment Account Section */}
                <div className="other-trans-section-block other-trans-section-block--grid">
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.11)'
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Payment Account (Cash/Bank)</h3>
                  </div>
                  
                  <div className="other-trans-form-grid">
                    {/* Cash Flow On Settlement */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Cash Flow On Settlement (Rs.)</label>
                      <input
                        name="cashFlowOnSettlement"
                        value={liabilitySettlementForm.cashFlowOnSettlement}
                        readOnly
                        className="other-trans-form-input other-trans-readonly-field"
                      />
                    </div>

                    {/* Account Selection Dropdown */}
                    <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="other-trans-field-label">Select Payment Account</label>
                      <select
                        name="selectedAccountId"
                        value={liabilitySettlementForm.selectedAccountId}
                        onChange={handleLiabilitySettlementChange}
                        className="other-trans-form-select"
                        disabled={accountsLoading}
                      >
                        <option value="">Select an account (optional - defaults will be used if not selected)</option>
                        {accounts.map((account) => {
                          const hasMapping = accountsWithMapping.includes(account.id);
                          return (
                            <option 
                              key={account.id} 
                              value={hasMapping ? account.id : ''}
                              disabled={!hasMapping}
                            >
                              {account.account_name} - {account.account_number} ({account.bank_name})
                              {!hasMapping ? ' - No GL Mapping' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {accountsLoading && <small style={{ color: '#6b7280' }}>Loading accounts...</small>}
                      {accounts.length > 0 && accountsWithMapping.length === 0 && (
                        <small style={{ 
                          display: 'block',
                          marginTop: '0.5rem',
                          color: '#f59e0b',
                          fontSize: '0.875rem'
                        }}>
                          ⚠️ No accounts with GL mappings found. Default accounts will be used for GL entries.
                        </small>
                      )}
                      {accounts.length > 0 && accountsWithMapping.length > 0 && (
                        <small style={{ 
                          display: 'block',
                          marginTop: '0.5rem',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          Only accounts with GL mappings are available. If no account is selected, defaults will be used.
                        </small>
                      )}
                    </div>

                    {/* Account Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Account Name</label>
                      <input
                        name="paymentAccountName"
                        placeholder="Auto-filled"
                        value={liabilitySettlementForm.paymentAccountName}
                        readOnly
                        className="other-trans-form-input other-trans-readonly-field"
                      />
                    </div>

                    {/* Account Number */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Account Number</label>
                      <input
                        name="paymentAccountNumber"
                        placeholder="Auto-filled"
                        value={liabilitySettlementForm.paymentAccountNumber}
                        readOnly
                        className="other-trans-form-input other-trans-readonly-field"
                      />
                    </div>

                    {/* Bank Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Bank Name</label>
                      <input
                        name="paymentBankName"
                        placeholder="Auto-filled"
                        value={liabilitySettlementForm.paymentBankName}
                        readOnly
                        className="other-trans-form-input other-trans-readonly-field"
                      />
                    </div>

                    {/* Branch Name */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Branch Name</label>
                      <input
                        name="paymentBranchName"
                        placeholder="Auto-filled"
                        value={liabilitySettlementForm.paymentBranchName}
                        readOnly
                        className="other-trans-form-input other-trans-readonly-field"
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="other-trans-field-group">
                      <label className="other-trans-field-label">Payment Method</label>
                      <select
                        name="paymentMethod"
                        value={liabilitySettlementForm.paymentMethod}
                        onChange={handleLiabilitySettlementChange}
                        className="other-trans-form-select"
                      >
                        <option value="">Select Payment Method</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Online Banking">Online Banking</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Settlement Amount */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Settlement Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    placeholder="Enter settlement amount"
                    value={liabilitySettlementForm.amount}
                    onChange={handleLiabilitySettlementChange}
                    className="other-trans-form-input"
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Must be greater than zero
                  </small>
                </div>

                {/* Currency */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Currency *</label>
                  <select
                    name="currency"
                    value={liabilitySettlementForm.currency}
                    onChange={handleLiabilitySettlementChange}
                    className="other-trans-form-select"
                  >
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                  </select>
                </div>

                {/* FX Rate */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">FX Rate → LKR</label>
                  <input
                    type="number"
                    name="fxRate"
                    step="0.0001"
                    placeholder="Enter exchange rate"
                    value={liabilitySettlementForm.fxRate}
                    onChange={handleLiabilitySettlementChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Counterparty (Optional) */}
                <div className="other-trans-field-group">
                  <label className="other-trans-field-label">Counterparty</label>
                  <input
                    name="counterparty"
                    placeholder="Enter counterparty name (optional)"
                    value={liabilitySettlementForm.counterparty}
                    onChange={handleLiabilitySettlementChange}
                    className="other-trans-form-input"
                  />
                </div>

                {/* Description */}
                <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Description</label>
                  <textarea
                    name="description"
                    placeholder="Enter liability settlement description (e.g., Settlement of Accounts Payable - Invoice #12345)"
                    value={liabilitySettlementForm.description}
                    onChange={handleLiabilitySettlementChange}
                    rows="3"
                    className="other-trans-form-textarea"
                  ></textarea>
                </div>

                {/* Notes */}
                <div className="other-trans-notes-section" style={{ gridColumn: '1 / -1' }}>
                  <label className="other-trans-field-label">Notes & Additional Information</label>
                  <textarea
                    name="notes"
                    placeholder="Add any additional notes or information..."
                    value={liabilitySettlementForm.notes}
                    onChange={handleLiabilitySettlementChange}
                    rows="4"
                    className="other-trans-form-textarea"
                  ></textarea>
                </div>
              </div>

              {/* Success/Error Message */}
              {submitMessage && (
                <div className={`other-trans-message ${submitMessage.includes('Error') ? 'other-trans-error' : 'other-trans-success'}`}>
                  {submitMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="other-trans-button-section">
                <button
                  type="button"
                  onClick={handleLiabilitySettlementReset}
                  className="other-trans-btn other-trans-btn-secondary"
                  disabled={isSubmitting}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="other-trans-btn other-trans-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Settlement Entry'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
        ) : activeTab === 'defineTransaction' ? (
          /* Define Transaction Tab */
          <div className="other-trans-form-card">
            <div className="other-trans-card-header">
              <h2 className="other-trans-card-title">Define Transaction Types</h2>
              <p className="other-trans-card-subtitle">
                Define custom transaction types for Income, Expense, and Asset categories
              </p>
            </div>
            <div className="other-trans-form-content">
              {/* Transaction Type Form */}
              <form onSubmit={handleTransactionTypeSubmit} style={{ marginBottom: '2rem' }}>
                <div className="other-trans-form-grid">
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Category *</label>
                    <select
                      name="category"
                      value={transactionTypeForm.category}
                      onChange={handleTransactionTypeChange}
                      className="other-trans-form-select"
                      required
                      disabled={categoriesLoading}
                    >
                      <option value="">Select Main Category</option>
                      <option value="revenue">Revenue</option>
                      <option value="otherIncome">Other Income</option>
                      <option value="provisions">Provisions</option>
                      <option value="expense">Expense</option>
                      <option value="asset">Asset</option>
                      <option value="liability">Liability</option>
                      <option value="equity">Equity</option>
                    </select>
                    {categoriesLoading && (
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Loading categories...
                      </small>
                    )}
                  </div>

                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Sub Category *</label>
                    <select
                      name="sub_category"
                      value={transactionTypeForm.sub_category}
                      onChange={handleTransactionTypeChange}
                      className="other-trans-form-select"
                      required
                      disabled={!transactionTypeForm.category || categoriesLoading}
                    >
                      <option value="">Select Sub Category</option>
                      {transactionTypeForm.category && categoriesByType[transactionTypeForm.category]?.map((cat) => (
                        <option key={cat.id || cat.category_name} value={cat.category_name}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                    {!transactionTypeForm.category && (
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Please select a main category first
                      </small>
                    )}
                    {transactionTypeForm.category && (!categoriesByType[transactionTypeForm.category] || categoriesByType[transactionTypeForm.category]?.length === 0) && (
                      <small style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                        No sub-categories found for this main category. Please add categories in the "Account Category" screen first.
                      </small>
                    )}
                  </div>

                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Transaction Type Name *</label>
                    <select
                      name="transaction_type_name"
                      value={transactionTypeForm.transaction_type_name}
                      onChange={handleTransactionTypeChange}
                      className="other-trans-form-select"
                      required
                      disabled={!transactionTypeForm.sub_category}
                    >
                      <option value="">Select Transaction Type Name</option>
                      {transactionTypesForDefine.map((type) => (
                        <option key={type.transaction_type_name || type.id} value={type.transaction_type_name}>
                          {type.transaction_type_name}
                        </option>
                      ))}
                    </select>
                    {!transactionTypeForm.sub_category && (
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Please select a Sub Category first
                      </small>
                    )}
                    {transactionTypeForm.sub_category && transactionTypesForDefine.length === 0 && (
                      <small style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                        No transaction types defined for this sub category. Define one in the "Account Category" screen first.
                      </small>
                    )}
                  </div>

                  <div className="other-trans-field-group" style={{ position: 'relative' }}>
                    <label className="other-trans-field-label">GL Account Code *</label>
                    <input
                      type="text"
                      name="gl_account_code"
                      value={transactionTypeForm.gl_account_code}
                      onChange={(e) => {
                        handleTransactionTypeChange(e);
                        setCoaSearchTerm(e.target.value);
                        setShowCoaList(true);
                        // Try to find matching account and populate description
                        const matchingAccount = chartAccounts.find(acc => 
                          acc.account_code && acc.account_code.toLowerCase() === e.target.value.toLowerCase().trim()
                        );
                        if (matchingAccount) {
                          setTransactionTypeForm(prev => ({ 
                            ...prev, 
                            gl_account_code: e.target.value,
                            coa_description: matchingAccount.description || ''
                          }));
                        } else {
                          // Clear coa_description if no match found
                          setTransactionTypeForm(prev => ({ ...prev, coa_description: '' }));
                        }
                      }}
                      onBlur={() => {
                        // When user leaves the field, try to find exact match
                        if (transactionTypeForm.gl_account_code) {
                          const matchingAccount = chartAccounts.find(acc => 
                            acc.account_code && acc.account_code.toLowerCase() === transactionTypeForm.gl_account_code.toLowerCase().trim()
                          );
                          if (matchingAccount) {
                            setTransactionTypeForm(prev => ({ 
                              ...prev, 
                              coa_description: matchingAccount.description || ''
                            }));
                          }
                        }
                        setShowCoaList(false);
                      }}
                      onFocus={() => setShowCoaList(true)}
                      className="other-trans-form-input"
                      placeholder="Type to search code or name"
                      disabled={transactionTypeForm.use_common_account || chartAccountsLoading}
                      autoComplete="off"
                    />
                    {(!transactionTypeForm.use_common_account && !chartAccountsLoading && showCoaList) && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.25rem',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 10
                      }}>
                        {(() => {
                          // Filter by Category (account_type), Sub Category (account_category), and Transaction Type Name (transaction_type)
                          const selectedCategory = normalizeCategoryForApi(transactionTypeForm.category);
                          const selectedSubCategory = transactionTypeForm.sub_category;
                          const selectedTransactionTypeName = transactionTypeForm.transaction_type_name;

                          return chartAccounts
                            .filter((acc) => {
                              // First filter by Category (account_type) if one is selected
                              if (selectedCategory) {
                                const accType = (acc.account_type || '').toLowerCase();
                                // Map form category to account_type
                                // income/revenue -> income, expense -> expense, asset -> asset, liability -> liability, equity -> equity
                                let expectedAccountType = selectedCategory;
                                if (selectedCategory === 'income') {
                                  // Income can be 'income' or 'revenue'
                                  if (accType !== 'income' && accType !== 'revenue') {
                                    return false;
                                  }
                                } else if (selectedCategory === 'other income') {
                                  if (accType !== 'other income') {
                                    return false;
                                  }
                                } else if (accType !== expectedAccountType) {
                                  return false;
                                }
                              }

                              // Filter by Sub Category (account_category)
                              if (selectedSubCategory) {
                                const accCategory = (acc.account_category || '').trim();
                                if (accCategory && accCategory !== selectedSubCategory) {
                                  return false;
                                }
                              }

                              // Filter by Transaction Type Name (transaction_type column in chart_of_accounts)
                              if (selectedTransactionTypeName) {
                                const accTransactionType = (acc.transaction_type || '').trim();
                                if (accTransactionType && accTransactionType !== selectedTransactionTypeName) {
                                  return false;
                                }
                              }

                              // Then filter by search term
                              const term = (coaSearchTerm || '').toLowerCase();
                              if (!term) return true;
                              return (
                                (acc.account_code || '').toLowerCase().includes(term) ||
                                (acc.description || '').toLowerCase().includes(term)
                              );
                            })
                            .map((acc) => (
                            <div
                              key={acc.account_code}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTransactionTypeForm(prev => ({ 
                                  ...prev, 
                                  gl_account_code: acc.account_code,
                                  coa_description: acc.description || ''
                                }));
                                setCoaSearchTerm(`${acc.account_code} - ${acc.description}`);
                                setShowCoaList(false);
                              }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                            >
                              <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{acc.account_code}</div>
                              <div style={{ color: '#6b7280', fontSize: '0.8125rem' }}>{acc.description}</div>
                            </div>
                          ));
                        })()}
                        {(() => {
                          // Filter by Category (account_type), Sub Category (account_category), and Transaction Type Name (transaction_type)
                          const selectedCategory = normalizeCategoryForApi(transactionTypeForm.category);
                          const selectedSubCategory = transactionTypeForm.sub_category;
                          const selectedTransactionTypeName = transactionTypeForm.transaction_type_name;

                          // Filter accounts by Category, Sub Category, and Transaction Type Name
                          const filteredAccounts = chartAccounts.filter((acc) => {
                            // Filter by Category (account_type) if one is selected
                            if (selectedCategory) {
                              const accType = (acc.account_type || '').toLowerCase();
                              let expectedAccountType = selectedCategory;
                              if (selectedCategory === 'income') {
                                // Income can be 'income' or 'revenue'
                                if (accType !== 'income' && accType !== 'revenue') {
                                  return false;
                                }
                              } else if (selectedCategory === 'other income') {
                                if (accType !== 'other income') {
                                  return false;
                                }
                              } else if (accType !== expectedAccountType) {
                                return false;
                              }
                            }

                            // Filter by Sub Category (account_category)
                            if (selectedSubCategory) {
                              const accCategory = (acc.account_category || '').trim();
                              if (accCategory && accCategory !== selectedSubCategory) {
                                return false;
                              }
                            }

                            // Filter by Transaction Type Name (transaction_type column in chart_of_accounts)
                            if (selectedTransactionTypeName) {
                              const accTransactionType = (acc.transaction_type || '').trim();
                              if (accTransactionType && accTransactionType !== selectedTransactionTypeName) {
                                return false;
                              }
                            }

                            return true;
                          });

                          // Filter by search term
                          const term = (coaSearchTerm || '').toLowerCase();
                          const searchFiltered = term 
                            ? filteredAccounts.filter(acc => 
                                (acc.account_code || '').toLowerCase().includes(term) ||
                                (acc.description || '').toLowerCase().includes(term)
                              )
                            : filteredAccounts;

                          if (chartAccounts.length === 0) {
                            return <div style={{ padding: '0.5rem 0.75rem', color: '#6b7280' }}>No accounts loaded</div>;
                          }
                          if ((selectedCategory || selectedSubCategory || selectedTransactionTypeName) && searchFiltered.length === 0) {
                            const filterText = [];
                            if (selectedCategory) filterText.push(`Category: ${transactionTypeForm.category}`);
                            if (selectedSubCategory) filterText.push(`Sub Category: ${selectedSubCategory}`);
                            if (selectedTransactionTypeName) filterText.push(`Transaction Type: ${selectedTransactionTypeName}`);
                            return <div style={{ padding: '0.5rem 0.75rem', color: '#6b7280' }}>
                              No accounts found matching {filterText.join(', ')}{term ? ` and search term "${coaSearchTerm}"` : ''}
                            </div>;
                          }
                          return null;
                        })()}
                      </div>
                    )}
                    {chartAccountsLoading && (
                      <small style={{ color: '#6b7280' }}>Loading Chart of Accounts...</small>
                    )}
                  </div>

                  {/* Use common account toggle */}
                  <div className="other-trans-field-group" style={{ alignSelf: 'end' }}>
                    <label className="other-trans-field-label" style={{ display: 'block' }}>
                      &nbsp;
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!transactionTypeForm.use_common_account}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setTransactionTypeForm(prev => ({
                            ...prev,
                            use_common_account: checked,
                            gl_account_code: checked ? '' : prev.gl_account_code,
                            coa_description: checked ? '' : prev.coa_description
                          }));
                        }}
                        style={{ width: '1rem', height: '1rem' }}
                      />
                      <span>
                        {transactionTypeForm.category
                          ? `Use the common ${transactionTypeForm.category.charAt(0).toUpperCase() + transactionTypeForm.category.slice(1)} Account`
                          : 'Use the common account'}
                      </span>
                    </label>
                    <small style={{ color: '#6b7280' }}>
                      Turn off to select a specific GL Account Code
                    </small>
                  </div>

                  <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="other-trans-field-label">Description from Chart of Accounts</label>
                    <textarea
                      name="coa_description"
                      value={transactionTypeForm.coa_description}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                      placeholder="Description will appear here when you select an account code"
                      rows="2"
                      style={{ resize: 'vertical', background: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Auto-filled from selected Chart of Accounts entry
                    </small>
                  </div>

                  <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="other-trans-field-label">Description (Optional)</label>
                    <textarea
                      name="description"
                      value={transactionTypeForm.description}
                      onChange={handleTransactionTypeChange}
                      className="other-trans-form-input"
                      placeholder="Brief description of this transaction type"
                      rows="2"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                {transactionTypeMessage && (
                  <div style={{
                    padding: '0.75rem',
                    marginTop: '1rem',
                    backgroundColor: transactionTypeMessage.includes('Error') ? '#fee2e2' : '#d1fae5',
                    color: transactionTypeMessage.includes('Error') ? '#dc2626' : '#059669',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}>
                    {transactionTypeMessage}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    type="submit"
                    className="other-trans-submit-btn"
                  >
                    {editingTransactionTypeId ? 'Update Transaction Type' : 'Add Transaction Type'}
                  </button>
                  {editingTransactionTypeId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="other-trans-cancel-btn"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Transaction Types List */}
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Defined Transaction Types
                  </h3>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      console.log('🎯 ========== CATEGORY FILTER CHANGED ==========');
                      console.log('Selected value:', newValue);
                      console.log('📦 Available groups:', {
                        income: groupedTransactionTypes.income?.length || 0,
                        expense: groupedTransactionTypes.expense?.length || 0,
                        asset: groupedTransactionTypes.asset?.length || 0,
                        liability: groupedTransactionTypes.liability?.length || 0
                      });
                      console.log('==========================================');
                      setSelectedCategoryFilter(newValue);
                    }}
                    className="other-trans-form-select"
                    style={{ width: 'auto', minWidth: '200px' }}
                  >
                    <option value="">Select Category to View</option>
                    <option value="revenue">Revenue</option>
                    <option value="otherIncome">Other Income</option>
                    <option value="provisions">Provisions</option>
                    <option value="income">Income (Legacy)</option>
                    <option value="expense">Expense</option>
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                  </select>
                </div>

                {transactionTypesLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    Loading transaction types...
                  </div>
                ) : !selectedCategoryFilter ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    Please select a category from the dropdown above to view transaction types.
                  </div>
                ) : definedTransactionTypes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No transaction types defined yet. Add your first transaction type above.
                  </div>
                ) : (() => {
                  // Debug the display logic
                  const selectedGroup = groupedTransactionTypes[selectedCategoryFilter];
                  const hasItems = selectedGroup && selectedGroup.length > 0;
                  
                  console.log('🎨 Display logic check:', {
                    selectedCategoryFilter,
                    hasGroup: !!selectedGroup,
                    itemCount: selectedGroup?.length || 0,
                    hasItems,
                    items: selectedGroup?.map(t => ({ id: t.id, name: t.transaction_type_name, category: t.category }))
                  });
                  
                  if (!selectedGroup || selectedGroup.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                          No transaction types defined for {selectedCategoryFilter}
                        </div>
                        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                          {selectedGroup ? 
                            `Found ${selectedGroup.length} items` : 
                            'Category group not found. Check console for details.'}
                        </div>
                        <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                          Add one using the form above.
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                      {[selectedCategoryFilter].map(category => {
                        const items = groupedTransactionTypes[category] || [];
                        console.log(`🎯 Rendering category "${category}" with ${items.length} items:`, items.map(t => t.transaction_type_name));
                        if (items.length === 0) return null;
                      return (
                        <div key={category} style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          padding: '1rem'
                        }}>
                          <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                            color: '#374151',
                            textTransform: 'capitalize'
                          }}>
                            {category}
                          </h4>
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {items.map(type => (
                              <div key={type.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '0.375rem',
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                                    {type.transaction_type_name}
                                  </div>
                                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>
                                    {(() => {
                                      // Determine main category from sub-category
                                      const subCatName = type.category || type.sub_category || '';
                                      let mainCat = '';
                                      for (const [typeKey, categories] of Object.entries(categoriesByType)) {
                                        if (categories.some(cat => cat.category_name === subCatName)) {
                                          mainCat = typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
                                          break;
                                        }
                                      }
                                      return mainCat ? `${mainCat} > ${subCatName}` : subCatName;
                                    })()}
                                  </div>
                                  {type.gl_account_code && (
                                    <div style={{ fontSize: '0.8125rem', color: '#3b82f6', marginTop: '0.25rem', fontWeight: '500' }}>
                                      GL Account: {type.gl_account_code}
                                    </div>
                                  )}
                                  {type.coa_description && (
                                    <div style={{ 
                                      fontSize: '0.875rem', 
                                      color: '#059669', 
                                      marginTop: '0.25rem',
                                      fontStyle: 'italic',
                                      padding: '0.5rem',
                                      background: '#f0fdf4',
                                      borderRadius: '0.25rem',
                                      borderLeft: '3px solid #059669'
                                    }}>
                                      <strong>Chart of Accounts:</strong> {type.coa_description}
                                    </div>
                                  )}
                                  {type.description && (
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                      {type.description}
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleEditTransactionType(type)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      background: '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransactionType(type.id)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : activeTab === 'view' ? (
          /* Voucher List View */
          <div className="other-trans-data-card">
            <div className="other-trans-card-header">
              <h2 className="other-trans-card-title">View Vouchers</h2>
              <p className="other-trans-card-subtitle">Browse and filter vouchers by account category</p>
            </div>
            <div className="other-trans-form-content other-trans-form-content--view">
            <div className="other-trans-category-bar">
              {[
                { key: 'all', label: 'All', color: '#3b82f6' },
                { key: 'revenue', label: 'Revenue', color: '#10b981' },
                { key: 'other income', label: 'Other Income', color: '#14b8a6' },
                { key: 'provisions', label: 'Provisions', color: '#f97316' },
                { key: 'expense', label: 'Expense', color: '#ef4444' },
                { key: 'asset', label: 'Asset', color: '#8b5cf6' },
                { key: 'liability', label: 'Liability', color: '#f59e0b' },
                { key: 'equity', label: 'Equity', color: '#ec4899' },
                { key: 'gl_to_gl', label: 'GL_TO_GL', color: '#0ea5e9' }
              ].map((chip) => {
                const isActive = activeCategory === chip.key;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    className={`other-trans-category-chip${isActive ? ' active' : ''}`}
                    style={{ '--chip-color': chip.color }}
                    onClick={() => setActiveCategory(chip.key)}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {vouchersLoading ? (
              <div className="other-trans-loading-state">
                <p>Loading vouchers...</p>
              </div>
            ) : filteredVouchers.length === 0 ? (
              <div className="other-trans-empty-state">
                <p>No vouchers found. Create one using the &quot;Create Voucher&quot; tab.</p>
              </div>
            ) : (
              <div className="other-trans-voucher-grid">
                {filteredVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="other-trans-voucher-card"
                    onClick={() => handleViewVoucher(voucher)}
                  >
                    <div className="other-trans-voucher-meta">
                      <div>
                        <h3 className="other-trans-voucher-number">
                          {voucher.voucher_number}
                        </h3>
                        <p className="other-trans-voucher-date">
                          {voucher.transaction_date ? voucher.transaction_date.substring(0, 10) : 'N/A'}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        background: (() => {
                          const baseCat = getBaseCategory(voucher.account_type);
                          return baseCat === 'income' || baseCat === 'revenue' || baseCat === 'otherIncome' ? '#d1fae5' : 
                                 baseCat === 'expense' || baseCat === 'provisions' ? '#fee2e2' :
                                 baseCat === 'asset' ? '#ede9fe' :
                                 baseCat === 'gl_to_gl' ? '#e0f2fe' :
                                 baseCat === 'equity' ? '#fce7f3' : '#fef3c7';
                        })(),
                        color: (() => {
                          const baseCat = getBaseCategory(voucher.account_type);
                          return baseCat === 'income' || baseCat === 'revenue' || baseCat === 'otherIncome' ? '#065f46' : 
                                 baseCat === 'expense' || baseCat === 'provisions' ? '#991b1b' :
                                 baseCat === 'asset' ? '#6d28d9' :
                                 baseCat === 'gl_to_gl' ? '#075985' :
                                 baseCat === 'equity' ? '#9d174d' : '#92400e';
                        })()
                      }}>
                        {voucher.account_type}
                      </span>
                    </div>

                    <h4 className="other-trans-voucher-type">
                      {voucher.transaction_type || 'N/A'}
                    </h4>

                    {voucher.amount && (
                      <div className="other-trans-voucher-amount-box">
                        <div className="other-trans-voucher-amount-label">Amount</div>
                        <div className="other-trans-voucher-amount-value">
                          {parseFloat(voucher.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {voucher.currency}
                        </div>
                      </div>
                    )}

                    {voucher.counterparty && (
                      <p className="other-trans-voucher-counterparty">
                        Counterparty: {voucher.counterparty}
                      </p>
                    )}

                    <div className="other-trans-voucher-actions">
                      <button
                        type="button"
                        className="other-trans-btn other-trans-btn-secondary"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8125rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewVoucher(voucher);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        ) : activeTab === 'generalLedger' ? (
          <div>
            {generalLedgerLoading ? (
              <div className="other-trans-loading-state">
                <p>Loading general ledger entries...</p>
              </div>
            ) : generalLedgerEntries.length === 0 ? (
              <div className="other-trans-empty-state">
                <p>No general ledger entries found.</p>
              </div>
            ) : (
              <div className="other-trans-data-card">
                <div className="other-trans-card-header">
                  <h2 className="other-trans-card-title">
                    General Ledger Entries ({displayGeneralLedgerEntries.totalCount}
                    {displayGeneralLedgerEntries.isFiltered
                      ? ` · ${displayGeneralLedgerEntries.matchCount} matching line${displayGeneralLedgerEntries.matchCount === 1 ? '' : 's'}`
                      : ''}
                    )
                  </h2>
                </div>
                <div className="other-trans-gl-toolbar">
                  <label htmlFor="other-trans-gl-voucher-search">
                    Search by voucher number
                  </label>
                  <input
                    id="other-trans-gl-voucher-search"
                    className="other-trans-gl-search"
                    type="search"
                    placeholder="Type voucher # (partial match)…"
                    value={generalLedgerVoucherSearch}
                    onChange={(e) => setGeneralLedgerVoucherSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {generalLedgerVoucherSearch.trim() ? (
                    <button
                      type="button"
                      className="other-trans-gl-clear-btn"
                      onClick={() => setGeneralLedgerVoucherSearch('')}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                {displayGeneralLedgerEntries.isFiltered && displayGeneralLedgerEntries.rows.length === 0 ? (
                  <div className="other-trans-empty-state" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
                    No general ledger lines match voucher &quot;{generalLedgerVoucherSearch.trim()}&quot;.
                  </div>
                ) : (
                  <>
                    <div className="other-trans-table-wrap">
                      <table className="other-trans-data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Voucher #</th>
                            <th>Account Code</th>
                            <th>Account Name</th>
                            <th className="text-right">Debit</th>
                            <th className="text-right">Credit</th>
                            <th>Description</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayGeneralLedgerEntries.rows.map((entry, index) => (
                            <tr key={entry.id || index}>
                              <td style={{ color: '#64748b' }}>
                                {(() => {
                                  const dateToDisplay = entry.transaction_date || entry.date || null;
                                  return dateToDisplay ? dateToDisplay.substring(0, 10) : 'N/A';
                                })()}
                              </td>
                              <td className="other-trans-cell-voucher">
                                {entry.reference || entry.voucher_number || 'N/A'}
                              </td>
                              <td style={{ fontWeight: 600, color: '#1f2937' }}>
                                {entry.account_code || 'N/A'}
                              </td>
                              <td>{entry.account_name || 'N/A'}</td>
                              <td className={entry.debit > 0 ? 'other-trans-cell-debit' : 'other-trans-cell-muted'}>
                                {entry.debit && entry.debit > 0 ? parseFloat(entry.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                              </td>
                              <td className={entry.credit > 0 ? 'other-trans-cell-credit' : 'other-trans-cell-muted'}>
                                {entry.credit && entry.credit > 0 ? parseFloat(entry.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                              </td>
                              <td style={{ color: '#64748b' }}>{entry.description || 'N/A'}</td>
                              <td>
                                <span className={`other-trans-status-badge ${entry.status === 'Posted' ? 'posted' : 'other'}`}>
                                  {entry.status || 'Unknown'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {displayGeneralLedgerEntries.totalPages > 1 && (
                      <div className="other-trans-pagination">
                        <div className="other-trans-pagination-info">
                          Showing {displayGeneralLedgerEntries.indexOfFirst + 1}-{displayGeneralLedgerEntries.indexOfLast} of{' '}
                          {displayGeneralLedgerEntries.totalCount}
                        </div>

                        <div className="other-trans-pagination-controls">
                          <button
                            type="button"
                            className="other-trans-page-btn"
                            onClick={() =>
                              setGeneralLedgerCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={displayGeneralLedgerEntries.currentPage === 1}
                          >
                            Previous
                          </button>

                          {(() => {
                            const total = displayGeneralLedgerEntries.totalPages;
                            const current = displayGeneralLedgerEntries.currentPage;
                            const pages = [];

                            const addPage = (n) => pages.push({ type: 'page', n });
                            const addEllipsis = (key) => pages.push({ type: 'ellipsis', key });

                            if (total <= 7) {
                              for (let i = 1; i <= total; i++) addPage(i);
                            } else {
                              addPage(1);
                              if (current > 4) addEllipsis('left');

                              const start = Math.max(2, current - 1);
                              const end = Math.min(total - 1, current + 1);
                              for (let i = start; i <= end; i++) addPage(i);

                              if (current < total - 3) addEllipsis('right');
                              addPage(total);
                            }

                            return pages.map((item) => {
                              if (item.type === 'ellipsis') {
                                return (
                                  <span key={item.key} style={{ padding: '0 0.25rem', color: '#94a3b8' }}>
                                    …
                                  </span>
                                );
                              }

                              const isActive = item.n === current;
                              return (
                                <button
                                  key={item.n}
                                  type="button"
                                  className={`other-trans-page-btn${isActive ? ' active' : ''}`}
                                  onClick={() => setGeneralLedgerCurrentPage(item.n)}
                                >
                                  {item.n}
                                </button>
                              );
                            });
                          })()}

                          <button
                            type="button"
                            className="other-trans-page-btn"
                            onClick={() =>
                              setGeneralLedgerCurrentPage((p) =>
                                Math.min(displayGeneralLedgerEntries.totalPages, p + 1)
                              )
                            }
                            disabled={
                              displayGeneralLedgerEntries.currentPage ===
                              displayGeneralLedgerEntries.totalPages
                            }
                          >
                            Next
                          </button>

                          <div className="other-trans-pagination-info" style={{ marginLeft: '0.25rem' }}>
                            Page {displayGeneralLedgerEntries.currentPage} of {displayGeneralLedgerEntries.totalPages}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'reverseTransaction' ? (
          /* Reverse Transaction Tab */
          <div className="other-trans-form-card">
            <div className="other-trans-card-header">
              <h2 className="other-trans-card-title">Reverse Transaction</h2>
              <p className="other-trans-card-subtitle">
                Reverse or cancel an existing transaction by creating an opposite entry
              </p>
            </div>
            <div className="other-trans-form-content">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!reverseForm.category) {
                  setReverseMessage('Please select category');
                  setTimeout(() => setReverseMessage(''), 2500);
                  return;
                }
                if (!reverseForm.subCategory) {
                  setReverseMessage('Please select sub category');
                  setTimeout(() => setReverseMessage(''), 2500);
                  return;
                }
                if (!reverseForm.transactionType) {
                  setReverseMessage('Please select transaction type name');
                  setTimeout(() => setReverseMessage(''), 2500);
                  return;
                }
                if (!reverseForm.voucherNumber) {
                  setReverseMessage('Please select a voucher');
                  setTimeout(() => setReverseMessage(''), 2500);
                  return;
                }
                setReverseSubmitting(true);
                setReverseMessage('');
                try {
                  const payload = {
                    voucherNumber: reverseForm.voucherNumber,
                    amount: reverseForm.amount ? parseFloat(reverseForm.amount) : undefined,
                    cashFlowOnSettlement: reverseForm.cashFlowOnSettlement ? parseFloat(reverseForm.cashFlowOnSettlement) : undefined,
                    date: reverseForm.date,
                    notes: reverseForm.notes
                  };
                  await otherTransactionAPI.reverse(payload);
                  setReverseMessage('Reversal posted successfully');
                  setReverseForm({ category: '', subCategory: '', transactionType: '', voucherId: '', voucherNumber: '', amount: '', cashFlowOnSettlement: '', date: new Date().toISOString().split('T')[0], notes: '' });
                  // Refresh GL and vouchers tabs data after reversal
                  fetchGeneralLedger();
                  fetchVouchers();
                } catch (err) {
                  setReverseMessage(err.message || 'Failed to post reversal');
                } finally {
                  setReverseSubmitting(false);
                }
              }}>
                <div className="other-trans-form-grid">
                  {/* Main Category */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Category *</label>
                    <select
                      value={reverseForm.category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setReverseForm(prev => ({ ...prev, category: cat, subCategory: '', transactionType: '', voucherId: '', voucherNumber: '', amount: '', cashFlowOnSettlement: '' }));
                      }}
                      className="other-trans-form-select"
                      disabled={categoriesLoading}
                    >
                      <option value="">Select Main Category</option>
                      <option value="revenue">Revenue</option>
                      <option value="otherIncome">Other Income</option>
                      <option value="provisions">Provisions</option>
                      <option value="expense">Expense</option>
                      <option value="asset">Asset</option>
                      <option value="liability">Liability</option>
                      <option value="equity">Equity</option>
                    </select>
                    {categoriesLoading && (
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Loading categories...
                      </small>
                    )}
                  </div>

                  {/* Sub Category */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Sub Category *</label>
                    <select
                      value={reverseForm.subCategory}
                      onChange={(e) => {
                        const subCat = e.target.value;
                        setReverseForm(prev => ({ ...prev, subCategory: subCat, transactionType: '', voucherId: '', voucherNumber: '', amount: '', cashFlowOnSettlement: '' }));
                      }}
                      className="other-trans-form-select"
                      disabled={!reverseForm.category || categoriesLoading}
                    >
                      <option value="">Select Sub Category</option>
                      {reverseForm.category && categoriesByType[reverseForm.category] && categoriesByType[reverseForm.category].map((cat) => (
                        <option key={cat.id || cat.category_name} value={cat.category_name}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                    {!reverseForm.category && (
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Please select a main category first
                      </small>
                    )}
                    {reverseForm.category && (!categoriesByType[reverseForm.category] || categoriesByType[reverseForm.category].length === 0) && (
                      <small style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                        No sub-categories found for this main category. Please add categories in the "Account Category" screen first.
                      </small>
                    )}
                  </div>

                  {/* Transaction Type Name */}
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Transaction Type Name *</label>
                    <select
                      value={reverseForm.transactionType}
                      onChange={(e) => {
                        setReverseForm(prev => ({ ...prev, transactionType: e.target.value }));
                      }}
                      className="other-trans-form-select"
                      disabled={!reverseForm.subCategory}
                    >
                      <option value="">Select Transaction Type Name</option>
                      {transactionTypesForReverse.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {!reverseForm.subCategory && (
                      <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        Please select a Sub Category first
                      </small>
                    )}
                    {reverseForm.subCategory && transactionTypesForReverse.length === 0 && (
                      <small style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                        No transaction types defined for this sub category. Define one in the "Define Transaction" tab.
                      </small>
                    )}
                  </div>
                  <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="other-trans-field-label">Voucher *</label>
                    <select
                      value={reverseForm.voucherId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const v = vouchers.find(x => String(x.id) === String(id));
                        if (v) {
                          // Calculate remaining amount if partially reversed
                          const totalReversed = vouchers
                            .filter(rev => rev.voucher_number && rev.voucher_number.startsWith('RV-') && rev.voucher_number.substring(3) === v.voucher_number)
                            .reduce((sum, rev) => sum + (parseFloat(rev.amount) || 0), 0);
                          const originalAmount = parseFloat(v.amount) || 0;
                          const remainingAmount = originalAmount - totalReversed;
                          
                          setReverseForm(prev => ({
                            ...prev,
                            voucherId: id,
                            voucherNumber: v.voucher_number,
                            amount: remainingAmount > 0 ? remainingAmount.toFixed(2) : '',
                            cashFlowOnSettlement: v.cash_flow_on_settlement != null ? (parseFloat(v.cash_flow_on_settlement).toFixed(2)) : ''
                          }));
                        } else {
                          setReverseForm(prev => ({ ...prev, voucherId: id }));
                        }
                      }}
                      className="other-trans-form-select"
                      disabled={!reverseForm.category || !reverseForm.subCategory || !reverseForm.transactionType}
                    >
                      <option value="">Select voucher</option>
                      {getAvailableVouchersForReversal()
                        .filter(v => {
                          // Filter by transaction type name
                          if (!reverseForm.transactionType) return false;
                          // Match transaction type name (case-insensitive)
                          const voucherTransactionType = v.transaction_type || '';
                          return voucherTransactionType.toLowerCase().trim() === reverseForm.transactionType.toLowerCase().trim();
                        })
                        .map(v => {
                          // Calculate remaining amount if partially reversed
                          const reversalAmountsByOriginal = {};
                          vouchers
                            .filter(rev => rev.voucher_number && rev.voucher_number.startsWith('RV-'))
                            .forEach(rev => {
                              const origVoucher = rev.voucher_number.substring(3);
                              const revAmount = parseFloat(rev.amount) || 0;
                              if (!reversalAmountsByOriginal[origVoucher]) {
                                reversalAmountsByOriginal[origVoucher] = 0;
                              }
                              reversalAmountsByOriginal[origVoucher] += revAmount;
                            });
                          const totalReversed = reversalAmountsByOriginal[v.voucher_number] || 0;
                          const originalAmount = parseFloat(v.amount) || 0;
                          const remainingAmount = originalAmount - totalReversed;
                          const displayAmount = totalReversed > 0 
                            ? `${remainingAmount.toFixed(2)} (of ${originalAmount.toFixed(2)})`
                            : originalAmount.toFixed(2);
                          
                          return (
                            <option key={v.id} value={v.id}>
                              {v.voucher_number} — {v.transaction_type || v.account_type} — {displayAmount}
                            </option>
                          );
                        })}
                    </select>
                    {(!reverseForm.category || !reverseForm.subCategory || !reverseForm.transactionType) && (
                      <small style={{ color: '#6b7280' }}>Please select Category, Sub Category, and Transaction Type Name first</small>
                    )}
                  </div>
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Reversal Amount (Optional)</label>
                    <input
                      type="number"
                      value={reverseForm.amount}
                      onChange={(e) => setReverseForm(prev => ({ ...prev, amount: e.target.value }))}
                      onBlur={() => setReverseForm(prev => ({ ...prev, amount: prev.amount !== '' && prev.amount != null ? (parseFloat(prev.amount).toFixed(2)) : '' }))}
                      className="other-trans-form-input"
                      placeholder="Leave empty to use original amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Cash Flow On Settlement (Rs.)</label>
                    <input
                      type="number"
                      value={reverseForm.cashFlowOnSettlement}
                      readOnly
                      className="other-trans-form-input other-trans-readonly-field"
                      placeholder="Auto-filled"
                      step="0.01"
                    />
                  </div>
                  <div className="other-trans-field-group">
                    <label className="other-trans-field-label">Reversal Date</label>
                    <input
                      type="date"
                      value={reverseForm.date}
                      onChange={(e) => setReverseForm(prev => ({ ...prev, date: e.target.value }))}
                      className="other-trans-form-input"
                    />
                  </div>
                  <div className="other-trans-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="other-trans-field-label">Notes</label>
                    <textarea
                      value={reverseForm.notes}
                      onChange={(e) => setReverseForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="other-trans-form-textarea"
                      rows="3"
                      placeholder="Reason for reversal"
                    />
                  </div>
                </div>
                {reverseMessage && (
                  <div className={`other-trans-message ${reverseMessage.toLowerCase().includes('fail') || reverseMessage.toLowerCase().includes('error') ? 'other-trans-error' : 'other-trans-success'}`}>
                    {reverseMessage}
                  </div>
                )}
                <div className="other-trans-button-section">
                  <button
                    type="submit"
                    className="other-trans-btn other-trans-btn-primary"
                    disabled={reverseSubmitting}
                  >
                    {reverseSubmitting ? 'Posting...' : 'Post Reversal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

              {/* Footer */}
        <div className="other-trans-footer-section">
          <p>Company Name • Non-Trading Transactions Management • All data is encrypted and protected</p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="other-trans-preview-modal-overlay" 
          onClick={closePreviewModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            overflow: 'auto'
          }}
        >
          <div 
            className="other-trans-preview-modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '0.18rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxWidth: '1040px',
              width: '92%',
              maxHeight: '92vh',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div className="other-trans-preview-modal-header no-print">
              <h2 className="other-trans-preview-modal-title">
                <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
                Voucher Preview
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  className="other-trans-preview-close-btn"
                  type="button"
                  onClick={closePreviewModal}
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="other-trans-preview-modal-body">
              {inlineDocType ? (
                <div className="other-trans-inline-doc-wrap">
                  <div className="other-trans-inline-doc-toolbar no-print">
                    <button
                      type="button"
                      className="other-trans-inline-doc-back"
                      onClick={handleInlineDocBack}
                    >
                      Back to Details
                    </button>
                    <span className="other-trans-inline-doc-title">
                      {inlineDocType === 'voucher' ? 'Payment Voucher' : inlineDocType === 'invoice' ? 'Invoice' : 'Request Letter'}
                    </span>
                    <div className="other-trans-inline-doc-actions">
                      {inlineDocEditing && (
                        <div className="other-trans-inline-doc-fmt" role="toolbar" aria-label="Text formatting">
                          <button
                            type="button"
                            className={`fmt-btn fmt-b ${inlineDocFmtState.bold ? 'active' : ''}`}
                            title="Bold (Ctrl+B)"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => inlineDocFmt('bold')}
                          >B</button>
                          <button
                            type="button"
                            className={`fmt-btn fmt-i ${inlineDocFmtState.italic ? 'active' : ''}`}
                            title="Italic (Ctrl+I)"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => inlineDocFmt('italic')}
                          >I</button>
                          <button
                            type="button"
                            className={`fmt-btn fmt-u ${inlineDocFmtState.underline ? 'active' : ''}`}
                            title="Underline (Ctrl+U)"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => inlineDocFmt('underline')}
                          >U</button>
                          <span className="fmt-sep" />
                          <button
                            type="button"
                            className="fmt-btn fmt-clear"
                            title="Remove formatting"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => inlineDocFmt('removeFormat')}
                          >Normal</button>
                        </div>
                      )}
                      <button
                        type="button"
                        className={`other-trans-inline-doc-btn edit ${inlineDocEditing ? 'active' : ''}`}
                        onClick={toggleInlineDocEdit}
                      >
                        {inlineDocEditing ? 'Done Editing' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        className="other-trans-inline-doc-btn print"
                        onClick={handleInlineDocPrint}
                      >Print</button>
                      <button
                        type="button"
                        className="other-trans-inline-doc-btn pdf"
                        onClick={handleInlineDocExportPdf}
                        disabled={inlineDocPdfLoading}
                      >
                        {inlineDocPdfLoading ? 'Preparing…' : 'Export PDF'}
                      </button>
                    </div>
                  </div>
                  {inlineDocEditing && (
                    <div className="other-trans-inline-doc-edit-hint no-print">
                      Edit mode: click any text to change it. Use <strong>B</strong> / <strong>I</strong> / <strong>U</strong> to format, or <strong>Normal</strong> to clear styling.
                    </div>
                  )}
                  <div
                    ref={inlineDocRef}
                    className={`inline-doc-render ${inlineDocEditing ? 'editing' : ''}`}
                    contentEditable={inlineDocEditing}
                    suppressContentEditableWarning
                    spellCheck={false}
                  />
                </div>
              ) : (
                <>
              <div className="other-trans-preview-section no-print">
                <h3 className="other-trans-preview-section-title">Transaction Details</h3>
                <div className="other-trans-preview-grid">
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Voucher Number:</span>
                    <span className={`other-trans-preview-value ${!form.voucherNumber ? 'empty-value' : ''}`}>
                      {form.voucherNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Category:</span>
                    <span className={`other-trans-preview-value ${!form.category ? 'empty-value' : ''}`}>
                      {form.category || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Transaction Type:</span>
                    <span className={`other-trans-preview-value ${!form.transactionType ? 'empty-value' : ''}`}>
                      {form.transactionType || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Date:</span>
                    <span className={`other-trans-preview-value ${!form.date ? 'empty-value' : ''}`}>
                      {form.date || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Amount:</span>
                    <span className={`other-trans-preview-value ${!form.amount ? 'empty-value' : ''}`}>
                      {form.amount ? `${form.amount} ${form.currency || 'LKR'}` : 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Currency:</span>
                    <span className="other-trans-preview-value">{form.currency || 'LKR'}</span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">FX Rate:</span>
                    <span className={`other-trans-preview-value ${!form.fxRate ? 'empty-value' : ''}`}>
                      {form.fxRate || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Reference:</span>
                    <span className={`other-trans-preview-value ${!form.reference ? 'empty-value' : ''}`}>
                      {form.reference || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Counterparty:</span>
                    <span className={`other-trans-preview-value ${!form.counterparty ? 'empty-value' : ''}`}>
                      {form.counterparty || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="other-trans-preview-label">Description:</span>
                    <span className={`other-trans-preview-value ${!form.description ? 'empty-value' : ''}`}>
                      {form.description || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="other-trans-preview-section no-print">
                <h3 className="other-trans-preview-section-title">Payment & Settlement Details</h3>
                <div className="other-trans-preview-grid">
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Cash Flow On Settlement:</span>
                    <span className={`other-trans-preview-value ${!form.cashFlowOnSettlement ? 'empty-value' : ''}`}>
                      {form.cashFlowOnSettlement ? `Rs. ${form.cashFlowOnSettlement}` : 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="other-trans-preview-label">Account:</span>
                    <span className={`other-trans-preview-value ${!form.settlementAccount ? 'empty-value' : ''}`}>
                      {form.settlementAccount || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Account Name:</span>
                    <span className={`other-trans-preview-value ${!form.paymentAccountName ? 'empty-value' : ''}`}>
                      {form.paymentAccountName || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Account Number:</span>
                    <span className={`other-trans-preview-value ${!form.paymentAccountNumber ? 'empty-value' : ''}`}>
                      {form.paymentAccountNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Bank Name:</span>
                    <span className={`other-trans-preview-value ${!form.paymentBankName ? 'empty-value' : ''}`}>
                      {form.paymentBankName || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Branch Name:</span>
                    <span className={`other-trans-preview-value ${!form.paymentBranchName ? 'empty-value' : ''}`}>
                      {form.paymentBranchName || 'N/A'}
                    </span>
                  </div>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-label">Payment Method:</span>
                    <span className={`other-trans-preview-value ${!form.paymentMethod ? 'empty-value' : ''}`}>
                      {form.paymentMethod || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {form.notes && (
                <div className="other-trans-preview-section no-print">
                  <h3 className="other-trans-preview-section-title">Notes</h3>
                  <div className="other-trans-preview-field">
                    <span className="other-trans-preview-value" style={{ paddingLeft: 0 }}>{form.notes}</span>
                  </div>
                </div>
              )}
                </>
              )}
            </div>

            {!inlineDocType && (
            <div className="other-trans-preview-modal-footer no-print">
              <button
                type="button"
                className="other-trans-doc-btn other-trans-doc-btn-voucher"
                onClick={handleGenerateVoucher}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ marginRight: '0.4rem' }}>
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v2H7V5zm0 4h6v2H7V9zm0 4h4v2H7v-2z" clipRule="evenodd" />
                </svg>
                Generate Voucher
              </button>
              <button
                type="button"
                className="other-trans-doc-btn other-trans-doc-btn-invoice"
                onClick={handleGenerateInvoice}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ marginRight: '0.4rem' }}>
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v12l3-1.5L9 16l3-1.5 3 1.5V4a2 2 0 00-2-2H5zm2.5 5a.5.5 0 000 1h5a.5.5 0 000-1h-5zm0 3a.5.5 0 000 1h5a.5.5 0 000-1h-5z" clipRule="evenodd" />
                </svg>
                Invoice
              </button>
              <button
                type="button"
                className="other-trans-doc-btn other-trans-doc-btn-letter"
                onClick={handleGenerateRequestLetter}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ marginRight: '0.4rem' }}>
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Request Letter
              </button>
            </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default OtherTransactions;
