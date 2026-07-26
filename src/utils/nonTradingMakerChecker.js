import { authService } from '../services/authService';

export const NON_TRADING_SOURCES = {
  VOUCHER: 'voucher',
  GL_TO_GL: 'gl_to_gl',
  LIABILITY_SETTLEMENT: 'liability_settlement',
  ASSET_DERECOGNITION: 'asset_derecognition',
  REVERSE: 'reverse',
  SINGLE_ENTRY: 'single_entry',
};

export const NON_TRADING_SOURCE_LABELS = {
  [NON_TRADING_SOURCES.VOUCHER]: 'Payment Voucher',
  [NON_TRADING_SOURCES.GL_TO_GL]: 'GL to GL',
  [NON_TRADING_SOURCES.LIABILITY_SETTLEMENT]: 'Liability Settlement',
  [NON_TRADING_SOURCES.ASSET_DERECOGNITION]: 'Asset Derecognition',
  [NON_TRADING_SOURCES.REVERSE]: 'Reverse Transaction',
  [NON_TRADING_SOURCES.SINGLE_ENTRY]: 'Single Entry',
};

export function getNonTradingSessionUser() {
  return authService.getStoredUser();
}

export function isCompanyOwner(user = getNonTradingSessionUser()) {
  return user?.company_role === 'company_owner';
}

export function isCompanyMember(user = getNonTradingSessionUser()) {
  return user?.account_kind === 'company_member' || !!user?.company_role;
}

/** Admin/user company accounts must submit for approval; owner and legacy users post directly. */
export function shouldSubmitNonTradingForApproval(user = getNonTradingSessionUser()) {
  return isCompanyMember(user) && !isCompanyOwner(user);
}

export function nonTradingSaveButtonLabel(user = getNonTradingSessionUser()) {
  return shouldSubmitNonTradingForApproval(user) ? 'Submit for Approval' : 'Save Voucher';
}

export function nonTradingSubmittingLabel(user = getNonTradingSessionUser()) {
  return shouldSubmitNonTradingForApproval(user) ? 'Submitting…' : 'Saving…';
}

export function nonTradingPostButtonLabel(defaultLabel, user = getNonTradingSessionUser()) {
  return shouldSubmitNonTradingForApproval(user) ? 'Submit for Approval' : defaultLabel;
}

export function nonTradingPostingLabel(defaultLabel, user = getNonTradingSessionUser()) {
  return shouldSubmitNonTradingForApproval(user) ? 'Submitting…' : defaultLabel;
}
