import React from 'react';
import './Styles/FinancialReportsExport.css';

const ExportPdfExcelButtons = ({
  exportDisabled,
  onExportExcel,
  onExportPdf,
  excelLabel = 'Export Excel',
  pdfLabel = 'Export PDF'
}) => {
  return (
    <div className="fre-header-actions">
      <button
        type="button"
        className="fre-export-btn fre-export-excel"
        disabled={exportDisabled}
        onClick={onExportExcel}
      >
        {excelLabel}
      </button>
      <button
        type="button"
        className="fre-export-btn fre-export-pdf"
        disabled={exportDisabled}
        onClick={onExportPdf}
      >
        {pdfLabel}
      </button>
    </div>
  );
};

export default ExportPdfExcelButtons;

