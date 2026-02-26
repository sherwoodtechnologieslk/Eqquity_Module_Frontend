import React, { useState } from 'react';
import './Styles/ClientDocumentUploadForm.css';

const ClientDocumentUploadForm = ({ onNext, onPrevious, initialData = {} }) => {
  const [activeTab, setActiveTab] = useState('nic'); // 'nic' | 'bank'
  const [nicFront, setNicFront] = useState(initialData.nicFront || null);
  const [nicBack, setNicBack] = useState(initialData.nicBack || null);
  const [bankStatement, setBankStatement] = useState(
    initialData.bankStatement || null
  );
  const [nicFrontKey, setNicFrontKey] = useState(0);
  const [nicBackKey, setNicBackKey] = useState(0);
  const [bankStatementKey, setBankStatementKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null); // 'image' | 'pdf' | 'other'

  const handleFileChange = (setter) => (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setter(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) {
      onNext({
        nicFront,
        nicBack,
        bankStatement
      });
    }
  };

  const renderFileSize = (file) => {
    if (!file) return null;
    return (
      <span className="cp-doc-file-info">
        {Math.round(file.size / 1024)} KB
      </span>
    );
  };

  const handlePreview = (file) => {
    if (!file) return;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    const type = file.type;
    let kind = 'other';
    if (type && type.startsWith('image/')) {
      kind = 'image';
    } else if (type === 'application/pdf') {
      kind = 'pdf';
    }
    setPreviewUrl(url);
    setPreviewType(kind);
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewType(null);
  };

  return (
    <div className="cp-signup-form-container">
      <div className="cp-signup-form-wrapper">
        <div className="cp-signup-form-header">
          <h1>Document Upload</h1>
          <p>Upload your identification documents securely for verification.</p>
        </div>

        <div className="cp-signup-form-content">
          {/* Reuse Pro Tips layout space with guidance text */}
          <div className="cp-pro-tips-section">
            <div className="cp-tips-header">
              <div className="cp-tips-icon">
                <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
                  <path
                    fillRule="evenodd"
                    d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-4a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2>Upload Guidelines</h2>
            </div>
            <div className="cp-tips-content">
              <div className="cp-tip-item">
                <div className="cp-tip-number">01</div>
                <div className="cp-tip-text">
                  <p>Use original, full-size, unedited images of your documents.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">02</div>
                <div className="cp-tip-text">
                  <p>Ensure the document is readable, well-lit, and in colour.</p>
                </div>
              </div>
              <div className="cp-tip-item">
                <div className="cp-tip-number">03</div>
                <div className="cp-tip-text">
                  <p>Avoid reflections or blurry images and use a solid background.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form className="cp-signup-form" onSubmit={handleSubmit}>
            <div className="cp-doc-tabs">
              <button
                type="button"
                className={
                  activeTab === 'nic'
                    ? 'cp-doc-tab cp-doc-tab-active'
                    : 'cp-doc-tab'
                }
                onClick={() => setActiveTab('nic')}
              >
                NIC
              </button>
              <button
                type="button"
                className={
                  activeTab === 'bank'
                    ? 'cp-doc-tab cp-doc-tab-active'
                    : 'cp-doc-tab'
                }
                onClick={() => setActiveTab('bank')}
              >
                Bank Statement
              </button>
            </div>

            {activeTab === 'nic' && (
              <div className="cp-form-section">
                <div className="cp-form-row cp-doc-row">
                  <div className="cp-form-group cp-doc-upload-group">
                    <label>Front side of NIC</label>
                    <div className="cp-doc-upload-box">
                      <input
                        key={nicFrontKey}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange(setNicFront)}
                      />
                      <div className="cp-doc-meta">
                        {renderFileSize(nicFront)}
                        <div className="cp-doc-actions">
                          <button
                            type="button"
                            className="cp-doc-btn"
                            onClick={() => handlePreview(nicFront)}
                          >
                            Preview
                          </button>
                          <button type="button" className="cp-doc-btn">
                            File Re-upload
                          </button>
                          {nicFront && (
                            <button
                              type="button"
                              className="cp-doc-btn"
                              onClick={() => {
                                setNicFront(null);
                                setNicFrontKey((k) => k + 1);
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="cp-form-group cp-doc-upload-group">
                    <label>Rear side of NIC</label>
                    <div className="cp-doc-upload-box">
                      <input
                        key={nicBackKey}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange(setNicBack)}
                      />
                      <div className="cp-doc-meta">
                        {renderFileSize(nicBack)}
                        <div className="cp-doc-actions">
                          <button
                            type="button"
                            className="cp-doc-btn"
                            onClick={() => handlePreview(nicBack)}
                          >
                            Preview
                          </button>
                          <button type="button" className="cp-doc-btn">
                            File Re-upload
                          </button>
                          {nicBack && (
                            <button
                              type="button"
                              className="cp-doc-btn"
                              onClick={() => {
                                setNicBack(null);
                                setNicBackKey((k) => k + 1);
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="cp-doc-standards-title">
                  Ensure the uploaded / captured document meets these standards:
                </p>
                <ul className="cp-doc-standards-list">
                  <li>
                    Document should be within{' '}
                    <strong>3 months</strong> (maximum 3 months old).
                  </li>
                  <li>
                    Online banking screenshots will be accepted if they contain the{' '}
                    <strong>Bank Name</strong>, <strong>your name</strong> and{' '}
                    <strong>bank account number</strong>.
                  </li>
                  <li>
                    <strong>Password protected PDFs</strong> cannot be uploaded.
                  </li>
                  <li>Place image in solid colour background.</li>
                </ul>
                <p className="cp-doc-standards-title">
                  Automated checks on your uploaded statement:
                </p>
                <ul className="cp-doc-standards-list">
                  <li>
                    Our automated check verifies that the required fields are present in
                    the uploaded statement.
                  </li>
                  <li>
                    If any fields are not detected but you’re sure they are, you may
                    proceed. However, even if all fields are detected, some details may
                    still be missed.
                  </li>
                  <li>
                    If needed, we may ask you to re-upload the statement for clarity.
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="cp-form-section">
                <div className="cp-form-group cp-doc-upload-group">
                  <label>Bank Statement</label>
                  <div className="cp-doc-upload-box">
                    <input
                      key={bankStatementKey}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange(setBankStatement)}
                    />
                    <div className="cp-doc-meta">
                      {renderFileSize(bankStatement)}
                      <div className="cp-doc-actions">
                        <button
                          type="button"
                          className="cp-doc-btn"
                          onClick={() => handlePreview(bankStatement)}
                        >
                          Preview
                        </button>
                        <button type="button" className="cp-doc-btn">
                          File Re-upload
                        </button>
                        {bankStatement && (
                          <button
                            type="button"
                            className="cp-doc-btn"
                            onClick={() => {
                              setBankStatement(null);
                              setBankStatementKey((k) => k + 1);
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="cp-doc-standards-title">
                  Bank Statements / E-Statements / Passbook details page or Online
                  Banking screenshots with the below details are accepted:
                </p>
                <ul className="cp-doc-standards-list">
                  <li>
                    Clear visibility of the <strong>bank name</strong>,{' '}
                    <strong>account holder&apos;s name</strong>, and{' '}
                    <strong>account number</strong> is essential.
                  </li>
                </ul>

                <p className="cp-doc-standards-title">
                  Ensure the Uploaded/Captured image meets these standards:
                </p>
                <ul className="cp-doc-standards-list">
                  <li>Original, full-size unedited images.</li>
                  <li>Readable, well-lit, coloured images.</li>
                  <li>Not reflective or blurry.</li>
                  <li>Place image in solid colour background.</li>
                </ul>
              </div>
            )}

            <div className="cp-form-actions">
              <button
                type="button"
                className="cp-previous-btn"
                onClick={onPrevious}
              >
                <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Previous
              </button>
              <button type="submit" className="cp-next-btn">
                Next
                <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {previewUrl && (
        <div className="cp-doc-modal-backdrop" onClick={closePreview}>
          <div
            className="cp-doc-modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="cp-doc-modal-header">
              <h3>Document Preview</h3>
              <button
                type="button"
                className="cp-doc-modal-close"
                onClick={closePreview}
              >
                ✕
              </button>
            </div>
            <div className="cp-doc-modal-body">
              {previewType === 'image' && (
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="cp-doc-preview-image"
                />
              )}
              {previewType === 'pdf' && (
                <iframe
                  src={previewUrl}
                  title="Document preview"
                  className="cp-doc-preview-frame"
                />
              )}
              {previewType === 'other' && (
                <p className="cp-doc-preview-fallback">
                  Preview is not available for this file type. Please download and
                  open the file locally.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDocumentUploadForm;

