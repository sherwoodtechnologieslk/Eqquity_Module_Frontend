import * as pdfjsLib from 'pdfjs-dist';
import { parseTradeConfirmationText } from './parseTradeConfirmationText';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

const LINE_Y_TOLERANCE = 3.5;

const itemsToLines = (items) => {
  const rows = [];

  (items || []).forEach((item) => {
    const str = String(item.str || '').replace(/\s+/g, ' ').trim();
    if (!str) return;

    const x = item.transform ? item.transform[4] : 0;
    const y = item.transform ? item.transform[5] : 0;
    let row = rows.find((entry) => Math.abs(entry.y - y) <= LINE_Y_TOLERANCE);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, str });
  });

  rows.sort((a, b) => b.y - a.y);
  return rows
    .map((row) => {
      row.parts.sort((a, b) => a.x - b.x);
      return row.parts.map((part) => part.str).join(' ');
    })
    .join('\n');
};

export const extractConfirmationPdfText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer)
  });
  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(itemsToLines(content.items));
  }

  return pages.join('\n');
};

export const readTradeConfirmationPdf = async (file, fileName) => {
  const text = await extractConfirmationPdfText(file);
  const transactions = parseTradeConfirmationText(text, {
    fileName: fileName || file?.name || ''
  });
  return { text, transactions };
};

export { parseTradeConfirmationText };
