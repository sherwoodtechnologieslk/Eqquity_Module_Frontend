/**
 * Central registry mapping financial statement lines to disclosure note numbers.
 * Numbering aligned with published notes (year ended 31 March).
 */

export const NOTE_SOURCE_TABS = {
  SOFP: 'Statement of Financial Position',
  SOCI: 'Statement of Comprehensive Income',
  CASH_FLOW: 'Cash Flow'
};

/** @type {Array<{ id: string, number: number, title: string, mappings?: object }>} */
export const FINANCIAL_NOTES = [
  {
    id: 'note-3',
    number: 3,
    title: 'Revenue',
    mappings: {
      soci: ['revenue'],
      sofp: { patterns: ['revenue', 'sales', 'turnover'] }
    }
  },
  {
    id: 'note-4',
    number: 4,
    title: 'Other income',
    mappings: {
      soci: ['otherIncome'],
      sofp: { patterns: ['other income', 'other revenue', 'dividend income', 'interest income'] }
    }
  },
  {
    id: 'note-5',
    number: 5,
    title: 'Finance cost',
    mappings: {
      soci: ['financeCost'],
      cashFlow: ['interestExpense', 'interestPaid'],
      sofp: { patterns: ['finance cost', 'interest expense', 'borrowing cost', 'interest payable'] }
    }
  },
  {
    id: 'note-6',
    number: 6,
    title: 'Income tax',
    mappings: {
      soci: ['incomeTaxExpense'],
      cashFlow: ['incomeTaxPaid'],
      sofp: { patterns: ['income tax', 'tax expense', 'taxation', 'deferred tax'] }
    }
  },
  {
    id: 'note-7',
    number: 7,
    title: 'Property, plant and equipment',
    mappings: {
      cashFlow: ['depreciation', 'purchaseOfProperty', 'purchaseOfEquipment'],
      sofp: {
        patterns: [
          'property plant',
          'ppe',
          'fixed asset',
          'plant and equipment',
          'equipment',
          'motor vehicle',
          'furniture',
          'office computer'
        ]
      }
    }
  },
  {
    id: 'note-8',
    number: 8,
    title: 'Deferred tax liability',
    mappings: {
      soci: ['deferredTaxEffect'],
      sofp: { patterns: ['deferred tax'] }
    }
  },
  {
    id: 'note-9',
    number: 9,
    title: 'Right of use asset',
    mappings: {
      sofp: { patterns: ['right of use', 'right-of-use', 'rou asset'] }
    }
  },
  {
    id: 'note-10',
    number: 10,
    title: 'Other receivables',
    mappings: {
      sofp: { patterns: ['receivable', 'prepayment', 'deposit', 'withholding tax receivable'] }
    }
  },
  {
    id: 'note-11',
    number: 11,
    title: 'Financial assets at fair value through profit or loss',
    mappings: {
      soci: ['changeInFairValueOfFinancialAssets', 'changeInFairValueOfInvestmentInShares'],
      cashFlow: ['changeInFairValue', 'purchaseOfFinancialAssets', 'saleOfFinancialAssets'],
      sofp: {
        patterns: [
          'fair value through profit',
          'fvtpl',
          'government securit',
          'treasury',
          'equity securit',
          'investment in shares',
          'quoted'
        ]
      }
    }
  },
  {
    id: 'note-12',
    number: 12,
    title: 'Cash and cash equivalents',
    mappings: {
      cashFlow: ['cashAtBeginning', 'cashAtEnd', 'netIncreaseInCash'],
      sofp: {
        patterns: ['cash and cash', 'cash at bank', 'cash equivalent', 'bank balance', 'bank overdraft', 'overdraft']
      }
    }
  },
  {
    id: 'note-13',
    number: 13,
    title: 'Stated capital',
    mappings: {
      sofp: { patterns: ['stated capital', 'share capital', 'ordinary share', 'issued capital'] }
    }
  },
  {
    id: 'note-14',
    number: 14,
    title: 'Employee benefits liabilities',
    mappings: {
      soci: ['actuarialLossOnDefinedBenefitPlans'],
      sofp: { patterns: ['employee benefit', 'gratuity', 'defined benefit', 'pension'] }
    }
  },
  {
    id: 'note-15',
    number: 15,
    title: 'Lease creditor',
    mappings: {
      cashFlow: ['paymentOfLeaseLiabilities'],
      sofp: { patterns: ['lease liabilit', 'lease creditor', 'right-of-use'] }
    }
  },
  {
    id: 'note-16',
    number: 16,
    title: 'Other payables',
    mappings: {
      cashFlow: ['tradePayables'],
      sofp: {
        patterns: ['trade payable', 'other payable', 'creditor', 'accounts payable', 'accrued']
      }
    }
  },
  {
    id: 'note-17',
    number: 17,
    title: 'Interest-bearing loans and borrowings',
    mappings: {
      cashFlow: ['proceedsFromBorrowings', 'repaymentOfBorrowings'],
      sofp: {
        patterns: ['borrowing', 'loan', 'reverse repo', 'repurchase', 'sell buy', 'sell-buy', 'term loan']
      }
    }
  },
  {
    id: 'note-18',
    number: 18,
    title: 'Related party disclosures',
    mappings: {
      sofp: { patterns: ['related party', 'director', 'key management'] }
    }
  }
];

const notesById = new Map(FINANCIAL_NOTES.map((n) => [n.id, n]));
const notesByNumber = new Map(FINANCIAL_NOTES.map((n) => [n.number, n]));

export const getNoteById = (id) => notesById.get(id) || null;
export const getNoteByNumber = (number) => notesByNumber.get(Number(number)) || null;

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const matchesPatterns = (text, patterns = []) => {
  if (!text || !patterns.length) return false;
  return patterns.some((p) => text.includes(normalizeText(p)));
};

export const resolveNoteForSociLine = (lineKey) => {
  const key = String(lineKey || '').trim();
  if (!key) return null;
  return FINANCIAL_NOTES.find((note) => note.mappings?.soci?.includes(key)) || null;
};

export const resolveNoteForCashFlowLine = (lineKey) => {
  const key = String(lineKey || '').trim();
  if (!key) return null;
  return FINANCIAL_NOTES.find((note) => note.mappings?.cashFlow?.includes(key)) || null;
};

export const resolveNoteForSofpLine = ({
  transactionTypeName = '',
  accountCategory = '',
  accountName = ''
} = {}) => {
  const text = normalizeText(
    `${transactionTypeName} ${accountCategory} ${accountName}`
  );
  if (!text) return null;
  return (
    FINANCIAL_NOTES.find((note) =>
      matchesPatterns(text, note.mappings?.sofp?.patterns)
    ) || null
  );
};

export const getSourceTabName = (source) =>
  NOTE_SOURCE_TABS[source] || NOTE_SOURCE_TABS.SOFP;

export const formatNoteLabel = (note) =>
  note ? `Note ${note.number} — ${note.title}` : '';

export const enrichNotesContext = (base = {}) => {
  const note =
    base.note ||
    (base.noteId ? getNoteById(base.noteId) : null) ||
    (base.lineKey && base.source === 'SOCI'
      ? resolveNoteForSociLine(base.lineKey)
      : null) ||
    (base.lineKey && base.source === 'CASH_FLOW'
      ? resolveNoteForCashFlowLine(base.lineKey)
      : null) ||
    (base.source === 'SOFP'
      ? resolveNoteForSofpLine({
          transactionTypeName: base.transactionTypeName,
          accountCategory: base.accountCategory,
          accountName: base.accountName
        })
      : null);

  const displayLabel =
    base.displayLabel ||
    (note ? formatNoteLabel(note) : '') ||
    base.lineLabel ||
    base.accountName ||
    '';

  return {
    ...base,
    noteId: note?.id || base.noteId || '',
    noteNumber: note?.number ?? base.noteNumber ?? null,
    noteTitle: note?.title || base.noteTitle || '',
    displayLabel
  };
};

export const notesContextKey = (ctx) => {
  if (!ctx) return '';
  return [
    ctx.noteId || '',
    ctx.accountCode || '',
    ctx.lineKey || '',
    ctx.asOfDate || '',
    ctx.source || '',
    ctx.portfolioId || '',
    ctx.displayLabel || ''
  ].join('|');
};

/** Full note catalog for landing index (notes 3–18). */
export const getNotesIndexGroups = () => [
  {
    source: 'ALL',
    title: 'All notes',
    notes: [...FINANCIAL_NOTES]
  }
];
