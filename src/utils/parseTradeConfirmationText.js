/**
 * Parse broker TRADE CONFIRMATION PDF text (Purchase of / Sale of fills)
 * into the same row shape Trade Report uses for ATS .txt files.
 */

const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;
const MONEY_RE = /^-?[\d,]+\.\d{2}$/;
const QTY_RE = /^(?:\d{1,3}(?:,\d{3})+|\d+)$/;
const PRICE_RE = /^\d+\.\d+$/;
const SECTION_RE =
  /^(Sale|Purchase)\s+of\s+(.+)\s+\(\s*([A-Z][A-Z0-9]*(?:\.[A-Z0-9]+)?)\s*\/\s*([A-Z0-9]+)\s*\)\s*$/i;
const SECTION_START_RE = /^(Sale|Purchase)\s+of\s+/i;
const SECTION_CODE_RE = /\(\s*([A-Z][A-Z0-9]*(?:\.[A-Z0-9]+)?)\s*\/\s*([A-Z0-9]+)\s*\)/;

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const n = parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const toAtsDate = (value) => {
  const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return String(value || '').trim();
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const splitSecurityCode = (code) => {
  const raw = String(code || '').trim();
  const dot = raw.lastIndexOf('.');
  if (dot === -1) {
    return {
      companyId: raw.slice(0, 4),
      mainType: '',
      subType: '',
      companySymbol: raw.slice(0, 4)
    };
  }
  const symbol = raw.slice(0, dot);
  const rest = raw.slice(dot + 1);
  return {
    companyId: symbol.slice(0, 4),
    mainType: rest.charAt(0) || '',
    subType: rest.slice(1, 5),
    companySymbol: symbol.slice(0, 4)
  };
};

const makeSyntheticExecutionId = (fileName, index) => {
  const src = `${fileName || 'pdf'}:${index}`;
  let hash = 0;
  for (let i = 0; i < src.length; i += 1) {
    hash = (hash << 5) - hash + src.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
  const seq = String(index + 1).padStart(4, '0');
  return `P${hex}${seq}`.slice(0, 16);
};

const normalizeLines = (text) => {
  const raw = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const lines = [];
  for (let i = 0; i < raw.length; i += 1) {
    let line = raw[i];
    if (SECTION_START_RE.test(line) && !SECTION_CODE_RE.test(line)) {
      while (i + 1 < raw.length && !SECTION_CODE_RE.test(line)) {
        const next = raw[i + 1];
        if (DATE_RE.test(next.split(' ')[0])) break;
        i += 1;
        line = `${line} ${next}`;
      }
    }
    lines.push(line);
  }
  return lines;
};

const parseFillLine = (line) => {
  const match = String(line || '').trim().match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/);
  if (!match) return null;

  const tradeDate = match[1];
  const tokens = match[2].trim().split(/\s+/);
  if (tokens.length < 11) return null;

  let foreign = '0.00';
  let settlement;
  let mid;

  if (DATE_RE.test(tokens[tokens.length - 1])) {
    settlement = tokens[tokens.length - 1];
    mid = tokens.slice(0, -1);
  } else if (DATE_RE.test(tokens[tokens.length - 2]) && MONEY_RE.test(tokens[tokens.length - 1])) {
    foreign = tokens[tokens.length - 1];
    settlement = tokens[tokens.length - 2];
    mid = tokens.slice(0, -2);
  } else {
    return null;
  }
  let contract = '';
  let fields = mid;

  if (mid.length === 11 && /^\d+$/.test(mid[0]) && QTY_RE.test(mid[1])) {
    contract = mid[0];
    fields = mid.slice(1);
  }

  if (fields.length !== 10) return null;

  const [shares, price, gross, brokerage, sec, exchange, cds, gov, clearing, net] = fields;
  if (!QTY_RE.test(shares) || !PRICE_RE.test(price)) return null;
  if (![gross, brokerage, sec, exchange, cds, gov, clearing, net].every((value) => MONEY_RE.test(value))) {
    return null;
  }

  return {
    tradeDate,
    contract,
    shares: parseNumber(shares),
    price: parseFloat(price),
    gross: parseNumber(gross),
    brokerage: parseNumber(brokerage),
    sec: parseNumber(sec),
    exchange: parseNumber(exchange),
    cds: parseNumber(cds),
    gov: parseNumber(gov),
    clearing: parseNumber(clearing),
    net: parseNumber(net),
    settlement,
    foreign: parseNumber(foreign)
  };
};

const extractHeaderMeta = (text) => {
  const accountMatch = String(text || '').match(/Client A\/C No\.?\s*:\s*(\S+)/i);
  const tradeDateMatch = String(text || '').match(/Trade Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  const broker = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || '';

  return {
    account: accountMatch ? accountMatch[1].trim() : '',
    headerTradeDate: tradeDateMatch ? tradeDateMatch[1] : '',
    broker
  };
};

export const mapConfirmationFillToParsedRow = (fill, index, extras = {}) => {
  const contract = String(fill.contract || '').trim();
  const executionId = (contract || makeSyntheticExecutionId(extras.fileName, index)).slice(0, 16);
  const contract8 = contract.slice(0, 8);
  const isBuy = fill.side === 'B';
  const security = splitSecurityCode(fill.code);

  return {
    id: index + 1,
    tradeDate: toAtsDate(fill.tradeDate),
    tradeTime: '',
    buySell: fill.side,
    executionId,
    companyId: security.companyId,
    mainType: security.mainType,
    subType: security.subType,
    quantity: fill.shares,
    price: fill.price,
    lotType: '',
    buyingBroker: '',
    sellingBroker: '',
    buyingContractNo: isBuy ? contract8 : '',
    sellingContractNo: isBuy ? '' : contract8,
    clientPrefix: '',
    clientSuffix: '',
    jointAcNo: '',
    participantId: '',
    foreignFlag: '',
    brokerage: fill.brokerage,
    cdsFees: fill.cds,
    cseFees: fill.exchange,
    clearingFees: fill.clearing,
    secCess: fill.sec,
    foreignBrokerage: fill.foreign,
    orderId: '',
    status: '',
    governmentCess: fill.gov,
    tradeReportId: String(extras.fileName || '').slice(0, 50),
    orderSource: 'PDFConfirm',
    consolidationNo: '',
    settlementDate: toAtsDate(fill.settlement),
    companySymbol: security.companySymbol,
    clientAccount: extras.account || ''
  };
};

export const parseTradeConfirmationText = (text, options = {}) => {
  const fileName = options.fileName || '';
  const meta = extractHeaderMeta(text);
  const lines = normalizeLines(text);
  const fills = [];
  let current = null;

  lines.forEach((line) => {
    if (
      /^Total\b/i.test(line) ||
      /^Purchase Total\b/i.test(line) ||
      /^Sales Total\b/i.test(line) ||
      /^Net Settlement Value\b/i.test(line) ||
      /^Trade Date\b/i.test(line) ||
      line === 'Foreign' ||
      line === 'Brokerage'
    ) {
      return;
    }

    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      current = {
        side: sectionMatch[1].toLowerCase() === 'sale' ? 'S' : 'B',
        company: sectionMatch[2].trim(),
        code: sectionMatch[3].trim(),
        isin: sectionMatch[4].trim()
      };
      return;
    }

    const fill = parseFillLine(line);
    if (fill && current) {
      fills.push({
        ...fill,
        side: current.side,
        company: current.company,
        code: current.code,
        isin: current.isin
      });
    }
  });

  return fills.map((fill, index) =>
    mapConfirmationFillToParsedRow(fill, index, {
      fileName,
      account: meta.account
    })
  );
};
