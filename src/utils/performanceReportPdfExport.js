import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Rasterizes the report sheet to a PDF file. Avoids browser print headers
 * (page title, URL, date/time) that appear with window.print().
 */
export async function downloadPerformanceReportPdf(
  element,
  filename = 'Portfolio-Performance-Report.pdf'
) {
  if (!element) return;

  const scrollFix = [];
  element.querySelectorAll('.fr-table-scroll').forEach((el) => {
    scrollFix.push({
      el,
      overflow: el.style.overflow,
      overflowX: el.style.overflowX,
      maxHeight: el.style.maxHeight,
    });
    el.style.overflow = 'visible';
    el.style.overflowX = 'visible';
    el.style.maxHeight = 'none';
  });

  const docPrevOverflow = element.style.overflow;
  element.style.overflow = 'visible';

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentW = pdfW - 2 * margin;
    const pageHeight = pdfH - 2 * margin;

    const imgWidth = contentW;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPos = 0;
    while (yPos < imgHeight) {
      if (yPos > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, margin - yPos, imgWidth, imgHeight);
      yPos += pageHeight;
    }

    pdf.save(filename);
  } finally {
    element.style.overflow = docPrevOverflow;
    scrollFix.forEach(({ el, overflow, overflowX, maxHeight }) => {
      el.style.overflow = overflow;
      el.style.overflowX = overflowX;
      el.style.maxHeight = maxHeight;
    });
  }
}
