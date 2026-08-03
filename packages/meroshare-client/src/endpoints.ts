export const ENDPOINTS = {
  AUTH: '/auth',
  CAPITAL: '/capital',
  CURRENT_ISSUES: '/companyShare/active',
  ISSUE_DETAIL: (id: number) => `/companyShare/active/${id}`,
  OWN_DETAIL: '/ownDetail/',
  BANK_REQUEST: '/myBankRequest/',
  PORTFOLIO: '/portfolio/',
  SUBMIT_APPLICATION: '/applicantForm/form/',
  SEARCH_APPLICATIONS: '/applicantForm/active/search/',
  SEARCH_MIGRATED_APPLICATIONS: '/migrated/applicantForm/search/',
}
