import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { tradeSummaryAPI } from '../../services/api';
import cseApi from '../../services/cseApi';
import './Styles/TradeSummaryUpload.css';

const REFRESH_MS = 3 * 60 * 1000;

const formatCompact = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${abs.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
};

const formatNumber = (value, digits = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-LK', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const TradeSummaryUpload = () => {
  const [tradeDate, setTradeDate] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [marketLoading, setMarketLoading] = useState(true);
  const [marketNote, setMarketNote] = useState('');
  const [marketStatus, setMarketStatus] = useState({ status: 'unknown', label: '—' });
  const [summary, setSummary] = useState(null);
  const [prices, setPrices] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [priceQuery, setPriceQuery] = useState('');

  const loadLiveMarket = useCallback(async (silent = false) => {
    if (!silent) setMarketLoading(true);
    try {
      const [summaryRes, statusRes, pricesRes] = await Promise.all([
        cseApi.liveMarketSummary(),
        cseApi.marketStatus(),
        cseApi.sharePrices(),
      ]);

      setSummary(summaryRes?.summary || null);
      setMarketStatus({
        status: statusRes?.status || 'unknown',
        label: statusRes?.label || 'Unknown',
      });
      setPrices(Array.isArray(pricesRes?.items) ? pricesRes.items : []);
      setLastUpdated(
        pricesRes?.lastUpdated || summaryRes?.lastUpdated || statusRes?.lastUpdated || null
      );
      setMarketNote(pricesRes?.note || summaryRes?.note || statusRes?.note || '');
    } catch (err) {
      setSummary(null);
      setPrices([]);
      setMarketNote(err?.message || 'Live CSE market data is temporarily unavailable.');
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveMarket();
    const id = setInterval(() => loadLiveMarket(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [loadLiveMarket]);

  const filteredPrices = useMemo(() => {
    const q = priceQuery.trim().toUpperCase();
    if (!q) return prices;
    return prices.filter((row) => {
      const symbol = String(row.symbol || row.symbolFull || '').toUpperCase();
      const name = String(row.name || '').toUpperCase();
      return symbol.includes(q) || name.includes(q);
    });
  }, [prices, priceQuery]);

  const handleDateChange = (e) => setTradeDate(e.target.value);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
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
      setMessage('');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !tradeDate) {
      setMessage('Please select a date and file.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setMessage('');

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 100);

      const result = await tradeSummaryAPI.uploadTradeSummary(file, tradeDate);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setMessage(
          `Upload successful! ${result.rowsProcessed} rows processed for ${new Date(tradeDate).toLocaleDateString(
            'en-US',
            { year: 'numeric', month: 'long', day: 'numeric' }
          )}.`
        );
        setFile(null);
        setTradeDate('');
        setUploadProgress(0);
        document.getElementById('file-input').value = '';
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      setUploadProgress(0);

      if (error.response && error.response.data) {
        const errorData = error.response.data;

        if (errorData.error === 'Duplicate entries found') {
          const tradeDateFormatted = new Date(tradeDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          setMessage(
            `Trade summaries for ${tradeDateFormatted} have already been uploaded.

The system detected duplicate entries for the same date and symbols.

If you need to update existing data, please contact your administrator or use a different trade date.`
          );
        } else if (errorData.error === 'Duplicate check failed') {
          setMessage(`System error: ${errorData.details}`);
        } else {
          setMessage(errorData.message || errorData.error || 'Upload failed. Please try again.');
        }
      } else {
        setMessage(error.message || 'Upload failed. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    document.getElementById('file-input').value = '';
    setMessage('');
  };

  const messageTone = message.includes('successful')
    ? 'success'
    : message.includes('already been uploaded')
      ? 'info'
      : 'error';

  const statusClass =
    marketStatus?.status === 'open'
      ? 'is-open'
      : marketStatus?.status === 'closed'
        ? 'is-closed'
        : 'is-unknown';

  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="tsu-page">
      <section className="tsu-panel tsu-panel--upload" aria-label="Upload trade summary">
        <div className="tsu-panel__head">
          <div>
            <p className="tsu-panel__eyebrow">Primary action · Daily import</p>
            <h2>Upload Trade Summary</h2>
            <p>Import today’s CSE trade summary file here. Choose the trade date, attach .xlsx / .csv, then upload.</p>
          </div>
          <a
            href="https://www.cse.lk/equity/trade-summary"
            target="_blank"
            rel="noopener noreferrer"
            className="tsu-link-btn"
          >
            Download from CSE
          </a>
        </div>

        <form className="tsu-form" onSubmit={handleSubmit}>
          <div className="tsu-form__row">
            <label className="tsu-field tsu-field--date">
              <span className="tsu-label">Trade date</span>
              <input
                type="date"
                className="tsu-input"
                value={tradeDate}
                onChange={handleDateChange}
                required
              />
            </label>

            <div className="tsu-field tsu-field--file">
              <span className="tsu-label">Document file</span>
              <div
                className={`tsu-drop${isDragOver ? ' tsu-drop--active' : ''}${file ? ' tsu-drop--ready' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById('file-input').click();
                  }
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  className="tsu-file-input"
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                  required
                />
                {!file ? (
                  <span className="tsu-drop__hint">
                    Drop file or <em>browse</em> · .xlsx, .csv
                  </span>
                ) : (
                  <div className="tsu-file">
                    <span>
                      <strong>{file.name}</strong>
                      <small>{formatFileSize(file.size)}</small>
                    </span>
                    <button
                      type="button"
                      className="tsu-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="tsu-field tsu-field--action">
              <span className="tsu-label tsu-label--spacer" aria-hidden>
                &nbsp;
              </span>
              <button
                type="submit"
                className="tsu-submit"
                disabled={!file || !tradeDate || isSubmitting}
              >
                {isSubmitting ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>

          {isSubmitting && (
            <div className="tsu-progress">
              <div className="tsu-progress__track">
                <div className="tsu-progress__fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
          )}

          {message && (
            <div className={`tsu-message tsu-message--${messageTone}`} role="status">
              <div style={{ whiteSpace: 'pre-line' }}>{message}</div>
            </div>
          )}
        </form>
      </section>

      <section className="tsu-desk" aria-label="Live CSE market">
        <div className="tsu-desk__head">
          <div>
            <h3>Live market</h3>
            <p>
              Live prices for all listed securities
              {prices.length ? ` · ${prices.length.toLocaleString('en-LK')} companies` : ''}
              {updatedLabel ? ` · updated ${updatedLabel}` : ''}
              {' · auto-refreshes every 3 min'}
            </p>
          </div>
          <div className="tsu-desk__actions">
            <span className={`tsu-live-badge ${statusClass}`}>
              <span className="tsu-live-badge__dot" aria-hidden />
              {marketStatus?.label || 'Market'}
            </span>
            <button
              type="button"
              className="tsu-refresh"
              onClick={() => loadLiveMarket()}
              disabled={marketLoading}
            >
              {marketLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="tsu-stats">
          <article className="tsu-stat">
            <span>Turnover</span>
            <strong>
              <small className="tsu-stat__currency">LKR</small>
              {marketLoading && !summary ? '…' : formatCompact(summary?.tradeVolume)}
            </strong>
          </article>
          <article className="tsu-stat">
            <span>Share volume</span>
            <strong>{marketLoading && !summary ? '…' : formatCompact(summary?.shareVolume)}</strong>
          </article>
          <article className="tsu-stat">
            <span>Trades</span>
            <strong>{marketLoading && !summary ? '…' : formatCompact(summary?.trades)}</strong>
          </article>
          <article className="tsu-stat">
            <span>Securities</span>
            <strong>
              {marketLoading && prices.length === 0
                ? '…'
                : prices.length.toLocaleString('en-LK')}
            </strong>
          </article>
        </div>

        <div className="tsu-board-toolbar">
          <label className="tsu-board-search">
            <span className="tsu-label">Filter</span>
            <input
              type="text"
              className="tsu-input"
              value={priceQuery}
              onChange={(e) => setPriceQuery(e.target.value)}
              placeholder="Search symbol or company…"
            />
          </label>
          <p className="tsu-board-meta">
            Showing {filteredPrices.length.toLocaleString('en-LK')} of{' '}
            {prices.length.toLocaleString('en-LK')}
          </p>
        </div>

        <div className="tsu-table-wrap tsu-table-wrap--board">
          {marketLoading && prices.length === 0 ? (
            <div className="tsu-empty">Loading live prices…</div>
          ) : marketNote && prices.length === 0 ? (
            <div className="tsu-empty tsu-empty--error">{marketNote}</div>
          ) : filteredPrices.length === 0 ? (
            <div className="tsu-empty">
              {priceQuery.trim()
                ? `No securities match “${priceQuery.trim()}”.`
                : 'No live share prices available right now.'}
            </div>
          ) : (
            <table className="tsu-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th className="num">Open</th>
                  <th className="num">High</th>
                  <th className="num">Low</th>
                  <th className="num">Last</th>
                  <th className="num">Change</th>
                  <th className="num">Change %</th>
                  <th className="num">Volume</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrices.map((row, index) => {
                  const pct = Number(row.changePercentage);
                  const changeClass =
                    Number.isFinite(pct) && pct > 0 ? 'up' : Number.isFinite(pct) && pct < 0 ? 'down' : '';
                  return (
                    <tr key={row.id || `${row.symbol}-${index}`}>
                      <td className="symbol">{row.symbol || '—'}</td>
                      <td>{row.name || '—'}</td>
                      <td className="num">{formatNumber(row.open)}</td>
                      <td className="num">{formatNumber(row.high)}</td>
                      <td className="num">{formatNumber(row.low)}</td>
                      <td className="num">{formatNumber(row.lastTradedPrice)}</td>
                      <td className={`num ${changeClass}`}>{formatNumber(row.change)}</td>
                      <td className={`num ${changeClass}`}>
                        {Number.isFinite(pct) ? `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%` : '—'}
                      </td>
                      <td className="num">{formatNumber(row.quantity, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default TradeSummaryUpload;
