import { authService } from '../services/authService';

export const GSEC_SOURCES = {
  LEDGER: 'gsec_ledger_entries',
  MANUAL: 'gsec_manual_entry',
  BULK: 'gsec_bulk_entry_grid',
};

export const GSEC_SOURCE_LABELS = {
  [GSEC_SOURCES.LEDGER]: 'GSec Ledger Entries',
  [GSEC_SOURCES.MANUAL]: 'GSec Manual Entry Posting',
  [GSEC_SOURCES.BULK]: 'GSec Bulk Entry Grid',
};

export function getGsecSessionUser() {
  return authService.getStoredUser();
}

export function isCompanyOwner(user = getGsecSessionUser()) {
  return user?.company_role === 'company_owner';
}

export function isCompanyMember(user = getGsecSessionUser()) {
  return user?.account_kind === 'company_member' || !!user?.company_role;
}

/** Admin/user company accounts must submit for approval; owner and legacy users post directly. */
export function shouldSubmitGsecForApproval(user = getGsecSessionUser()) {
  return isCompanyMember(user) && !isCompanyOwner(user);
}

export function gsecSaveButtonLabel(user = getGsecSessionUser()) {
  return shouldSubmitGsecForApproval(user) ? 'Submit for Approval' : 'Save to DB';
}

export function gsecSubmittingLabel(user = getGsecSessionUser()) {
  return shouldSubmitGsecForApproval(user) ? 'Submitting…' : 'Saving…';
}
