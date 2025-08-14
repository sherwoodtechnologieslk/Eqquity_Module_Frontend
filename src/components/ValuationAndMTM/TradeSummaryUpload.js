import React, { useState } from "react";
import { tradeSummaryAPI } from '../../services/api';
import './Styles/TradeSummaryUpload.css';

const TradeSummaryUpload = () => {
  const [tradeDate, setTradeDate] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDateChange = (e) => setTradeDate(e.target.value);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.includes('csv') || droppedFile.name.endsWith('.xlsx'))) {
      setFile(droppedFile);
      setMessage("");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !tradeDate) {
      setMessage("Please select a date and file.");
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    setMessage("");
    
    try {
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 100);

      // Upload to backend
      const result = await tradeSummaryAPI.uploadTradeSummary(file, tradeDate);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setMessage(
          `Upload successful! ${result.rowsProcessed} rows processed for ${new Date(tradeDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}.`
        );
        setFile(null);
        setTradeDate("");
        setUploadProgress(0);
        document.getElementById("file-input").value = "";
        setIsSubmitting(false);
      }, 500);
      
    } catch (error) {
      setUploadProgress(0);
      
      console.log('Error caught:', error); // Debug log
      
      // Handle different types of errors
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        console.log('Error data:', errorData); // Debug log
        
        if (errorData.error === 'Duplicate entries found') {
          // User-friendly duplicate error message
          const tradeDateFormatted = new Date(tradeDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          setMessage(`Trade summaries for ${tradeDateFormatted} have already been uploaded. 
          
          The system detected duplicate entries for the same date and symbols. 
          
          If you need to update existing data, please contact your administrator or use a different trade date.`);
        } else if (errorData.error === 'Duplicate check failed') {
          setMessage(`❌ System error: ${errorData.details}`);
        } else {
          setMessage(`❌ Upload failed: ${errorData.error}`);
        }
      } else if (error.message && error.message.includes('409')) {
        // Handle HTTP 409 status in error message
        const tradeDateFormatted = new Date(tradeDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
                 setMessage(`Trade summaries for ${tradeDateFormatted} have already been uploaded. 
         
         The system detected duplicate entries for the same date and symbols. 
         
         If you need to update existing data, please contact your administrator or use a different trade date.`);
      } else {
        setMessage(`❌ Upload failed: ${error.message}`);
      }
      
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    document.getElementById("file-input").value = "";
    setMessage("");
  };

  return (
    <div className="upload-page-bg">
      <div className="upload-container">
        <div className="upload-header">
  <div className="upload-icon">
    <svg  fill="currentColor" viewBox="0 0 20 20">
  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
</svg>
  </div>
  <div className="upload-header-text-group">
    <h2 className="upload-form-title">Upload Trade Summary</h2>
    <p className="upload-subtitle">Upload your trade summary document for processing</p>
  </div>
</div>
        
        <form className="upload-form-card" onSubmit={handleSubmit}>
          {/* Single row for Trade Date and Document File */}
          <div className="upload-field-row">
            <div className="upload-field-group upload-field-half">
              <label className="upload-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Trade Date <span className="required">*</span>
              </label>
              <input
                type="date"
                className="upload-input date-input"
                value={tradeDate}
                onChange={handleDateChange}
                required
              />
            </div>

            <div className="upload-field-group upload-field-half">
              <label className="upload-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Document File <span className="required">*</span>
              </label>
              
              <div 
                className={`file-drop-zone ${isDragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input").click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="file-input-hidden"
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                  required
                />
                
                {!file ? (
                  <div className="file-drop-content">
                    <div className="file-drop-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17,8 12,3 7,8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div className="file-drop-text">
                      <p className="primary-text">Drop file or <span>browse</span></p>
                      <p className="secondary-text">.xlsx, .csv</p>
                    </div>
                  </div>
                ) : (
                  <div className="file-preview">
                    <div className="file-info">
                      <div className="file-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                        </svg>
                      </div>
                      <div className="file-details">
                        <p className="file-name">{file.name}</p>
                        <p className="file-size">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="remove-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isSubmitting && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="progress-text">{Math.round(uploadProgress)}% uploaded</p>
            </div>
          )}

          <button
            type="submit"
            className={`upload-btn ${isSubmitting ? 'uploading' : ''}`}
            disabled={!file || !tradeDate || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="btn-spinner"></div>
                Uploading...
              </>
            ) : (
              <>
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                   <polyline points="7,8 12,3 17,8"/>
                   <line x1="12" y1="3" x2="12" y2="15"/>
                 </svg>
                Upload Document
              </>
            )}
          </button>

                     {message && (
             <div className={`upload-message ${
               message.includes('successful') ? 'success' : 
               message.includes('already been uploaded') ? 'info' : 'error'
             }`}>
               <div className="message-icon">
                 {message.includes('successful') ? (
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <polyline points="20,6 9,17 4,12"/>
                   </svg>
                 ) : message.includes('already been uploaded') ? (
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <circle cx="12" cy="12" r="10"/>
                     <path d="M12 16v-4"/>
                     <path d="M12 8h.01"/>
                   </svg>
                 ) : (
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <circle cx="12" cy="12" r="10"/>
                     <line x1="15" y1="9" x2="9" y2="15"/>
                     <line x1="9" y1="9" x2="15" y2="15"/>
                   </svg>
                 )}
               </div>
               <div style={{ whiteSpace: 'pre-line' }}>{message}</div>
             </div>
           )}
        </form>
        {/* Footer */}
        <div className="buy-footer-section">
          <p>  ALCYONE TREASURY SOLUTIONS (PVT) LTD • Secure transaction recording • All calculations are automated and verified</p>
        </div>
      </div>
    </div>
  );
};

export default TradeSummaryUpload;