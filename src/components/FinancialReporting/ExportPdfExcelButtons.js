import React from 'react';
import './Styles/FinancialReportsExport.css';

const ExportPdfExcelButtons = ({
  exportDisabled,
  onExportExcel,
  onExportPdf,
  excelLabel = 'Export Excel',
  pdfLabel = 'Export PDF'
}) => {
  const actions = [
    { id: 'excel', label: excelLabel, onClick: onExportExcel },
    { id: 'pdf', label: pdfLabel, onClick: onExportPdf }
  ];

  return (
    <>
      {actions.map(({ id, label, onClick }) => (
        <button
          key={id}
          type="button"
          className={`fre-export-btn fre-export-${id}`}
          disabled={exportDisabled}
          onClick={onClick}
        >
          {label}
        </button>
      ))}
    </>
  );
};

export default ExportPdfExcelButtons;

