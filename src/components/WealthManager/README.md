# Wealth Manager Module

A unit-trust / wealth-management product layered on top of the same React shell that powers the Equity Manager. It provides:

- An **Admin / RM cockpit** (the default view) for relationship managers, fund operations and master-data teams.
- A **Client Portal** (toggled from the sidebar) covering pre-onboarding marketing, a full KYC onboarding flow, and a logged-in client gateway for portfolio, subscriptions, redemptions, transfers and statements.

Today the entire module is **UI-only with mocked data** — there are no `fetch` / `axios` calls anywhere under `WealthManager/`. Form submissions resolve via `setTimeout`-based fake API calls. This makes it ideal for design / UX iteration, but a backend wiring pass will be required before launch.

---

## 1. Where it lives in the app

The module is **not** routed with `react-router`. The whole app is driven by tab state held in `src/App.js`:

```17:25:equity-module-ui/equity-module-ui/src/App.js
import WealthSidebar from './components/WealthManager/Layout/WealthSidebar';
import WealthNavbar from './components/WealthManager/Layout/WealthNavbar';
import './components/WealthManager/Layout/WealthLayout.css';
import Dashboard from './components/Dashboard';
import WealthManagerDashboard from './components/WealthManager/WM Dashboard/WealthManagerDashboard';
import WMPortfolioOverview from './components/WealthManager/WM Dashboard/WMPortfolioOverview';
import FundPerformance from './components/WealthManager/WM Dashboard/FundPerformance';
import ClientSummary from './components/WealthManager/WM Dashboard/ClientSummary';
import AUMOverview from './components/WealthManager/WM Dashboard/AUMOverview';
```

`App.js` keeps three pieces of state that select what is rendered:

| State | Values | Purpose |
|---|---|---|
| `selectedManager` | `'equity' \| 'wealth'` | Top-level product switch (Equity Manager vs. Wealth Manager). Toggled from the sidebar brand dropdown. |
| `isClientView` | `boolean` | When `selectedManager === 'wealth'`, flips the UI into the Client Portal. Currently a manual toggle; eventually meant to be driven by `user.role === 'client'`. |
| `activeTab` | tab name | Within the admin shell, picks which screen renders from a giant `tabToComponent` map. |

The render decision tree in `App.js` is:

```362:399:equity-module-ui/equity-module-ui/src/App.js
  // Show Client Portal if in wealth manager mode and client view is enabled
  // TODO: Replace isClientView with user.role === 'client' check when backend is ready
  if (selectedManager === 'wealth' && isClientView) {
    return <ClientPortal user={user} onLogout={handleLogout} />;
  }

  return (
    <div className={selectedManager === 'wealth' ? 'wm-root' : 'dashboard-root'}>
      {selectedManager === 'wealth' ? (
        <WealthSidebar
          onSelect={handleSidebarSelect}
          activeIndex={activeSidebarItem}
          onLogout={handleLogout}
          onManagerChange={handleManagerChange}
          isClientView={isClientView}
          onClientViewToggle={setIsClientView}
        />
      ) : (
        <Sidebar ... />
      )}
```

---

## 2. Folder layout

```
WealthManager/
├── Layout/                  # Admin shell (sidebar + topbar)
│   ├── WealthSidebar.js
│   ├── WealthSidebar.css
│   ├── WealthNavbar.js
│   └── WealthLayout.css
│
├── WM Dashboard/            # RM/Admin cockpit screens
│   ├── WealthManagerDashboard.js   (the Dashboard landing)
│   ├── WMPortfolioOverview.js
│   ├── FundPerformance.js
│   ├── ClientSummary.js
│   ├── AUMOverview.js
│   └── Styles/*.css
│
├── ClientManagement/
│   ├── ClientAccounts.js           (list + filter of all client accounts)
│   ├── ClientPortfolio.js          (per-client portfolio drill-down)
│   └── Styles/*.css
│
├── Fund Master/
│   ├── FundMaster.js               (create/list funds)
│   ├── FundCategories.js
│   ├── FundPerfMetrics.js          (advanced perf tables: Sharpe/Sortino/Treynor…)
│   └── Styles/*.css
│
├── Portfolio Master/
│   ├── WealthPortfolioMaster.js    (create/list portfolios)
│   └── Styles/*.css
│
├── Expense Master/
│   ├── ExpenseMaster.js            (list/filter expenses)
│   ├── DefineExpenses.js           (create form)
│   └── Styles/*.css
│
├── Styles/
│   └── WealthManagerDashboard.css  (orphan css, see Known Issues)
│
└── ClientPortal/                   # Entire client-facing experience
    ├── ClientPortal.js             (1300+ line orchestrator)
    ├── ClientNavbar.js
    ├── ClientSidebar.js
    ├── FundInformation.js          (fund catalogue)
    ├── SIPCalculator.js            (Systematic Investment Plan planner)
    │
    ├── PreOnboarding/              # Public marketing pages
    │   ├── PreOnboardingHome.js
    │   ├── PreOnboardingAbout.js
    │   ├── PreOnboardingFundDocuments.js
    │   ├── PreOnboardingContact.js
    │   └── Styles/*.css
    │
    ├── ClientOnboarding/           # 9-step KYC wizard
    │   ├── ClientSignupForm.js          (1. Personal)
    │   ├── ClientContactForm.js         (2. Contact)
    │   ├── ClientEmploymentForm.js      (3. Employment)
    │   ├── ClientBankForm.js            (4. Bank & Fund)
    │   ├── ClientAdditionalDetailsForm.js  (5. Additional)
    │   ├── ClientOtherProductsForm.js   (6. T&C / Other products)
    │   ├── ClientDocumentUploadForm.js  (7. Documents)
    │   ├── ClientVideoVerificationForm.js (8. Video KYC)
    │   ├── ClientSubmitForm.js          (9. Submit)
    │   └── Styles/*.css
    │
    └── ClientGateway/              # Logged-in client experience
        ├── ClientDashboard.js
        ├── MyPortfolio.js
        ├── Create.js               (subscription / purchase)
        ├── Redeem.js
        ├── Transfer.js             (between funds / accounts)
        ├── Statements.js
        ├── ClientTransactions.js
        ├── ClientSettings.js
        └── Styles/*.css
```

---

## 3. Admin / RM cockpit

### 3.1 Layout shell

| File | Responsibility |
|---|---|
| `Layout/WealthSidebar.js` | Reuses `wealthManagerMenuItems` from `components/Home/Sidebar.js`. Renders the brand dropdown (Equity ↔ Wealth switcher), the **Client Portal / Admin View** toggle, the nav list and a logout button. |
| `Layout/WealthNavbar.js` | Compact top bar: current section title, pill-tab strip for the section's sub-topics, an AUM / Clients / Funds KPI chip (placeholders `—` today) and a user avatar that opens the profile modal. |
| `Layout/WealthLayout.css` | `wm-root`, `wm-main`, `wm-content`, `wm-navbar`, etc. — the grid that pairs `WealthSidebar` with `WealthNavbar` and the content area. |

### 3.2 Navigation tree

The sidebar tree lives in `components/Home/Sidebar.js` as the exported `wealthManagerMenuItems`. The high-level groups are:

1. **Dashboard** — Dashboard · Portfolio Overview · Fund Performance · Client Summary · AUM Overview
2. **Client Management** — Client Accounts · Client Portfolio · Client Statements · Client Onboarding · KYC Management *(only the first two have components today)*
3. **Unit Trust Operations** — Purchase/Subscription · Redemption · Switch/Transfer · Dividend Distribution · SIP · SWP *(placeholders)*
4. **Fund Master** — Fund Master · Fund Categories · Fund Pricing · NAV Management · Fund Performance Metrics
5. **Portfolio Master** — Portfolio Master · Client Portfolios · Portfolio Allocation · Portfolio Performance · Portfolio Reports
6. **Expense Master** — Expense Master · Define Expenses
7. **Transactions** *(placeholders)*
8. **Valuation & NAV** *(placeholders)*
9. **Reporting** *(placeholders)*
10. **Accounting Entries** *(placeholders — share screens with Equity)*
11. **Risk & Compliance** *(placeholders)*
12. **Settings & Configuration** *(placeholders)*

Sub-topics get wired to components via the `tabToComponent` dictionary in `App.js`. Any sub-topic that is not in the map falls through to the generic *Component Not Found* fallback.

### 3.3 Screens that exist today

**WM Dashboard** — the RM cockpit landing page (`WealthManagerDashboard.js`):

- Two-column layout. Left column = NAV trend bar chart + Top Funds list + Latest Activity feed. Right column = KPI tiles (AUM / Clients / Funds / Today) + Asset-class allocation bars + Operations Health & Alerts panel.
- Computes an OPEN/CLOSED ops-status pill from local time vs. 09:00–15:00 window.
- Three `MOCK_OPS_*` constants drive the alerts panel.
- Refreshes a live clock once per second.

**WMPortfolioOverview** — table + chart view of client portfolios, asset allocation, time-series performance and top fund holdings. All driven from one local `useState({...})` blob.

**FundPerformance** — fund vs. category vs. benchmark performance metrics with Sharpe, Sortino, Treynor, Information Ratio, beta, alpha, max drawdown, etc. Filters: category, horizon, benchmark, view mode.

**ClientSummary** — paginated client roster with segment and risk-profile filters; shows AUM, YTD return and RM per client.

**AUMOverview** — AUM by client segment / asset class / fund, plus a 1-month net-flow figure (currently hard-coded at ~2.2% of total AUM).

**ClientAccounts** *(Client Management)* — searchable, status- and segment-filtered accounts grid with summary cards (Total Clients, Active, Pending KYC, Inactive, AUM in LKR/USD). Selecting a row promotes that account for a detail pane.

**ClientPortfolio** *(Client Management)* — pick a client from the list on the left, see their holdings, allocation chart, transaction history and performance on the right.

**FundMaster / FundCategories / WealthPortfolioMaster / FundPerfMetrics / DefineExpenses / ExpenseMaster** — they all follow the same recipe:

1. Local `form` state (one field per input).
2. Required-fields validator in `isRequired()`.
3. `handleSubmit` runs `await new Promise(r => setTimeout(r, 1000))` to *fake* an API and pushes the row into a local `[xxxList, setXxxList]` array.
4. A "List View / Form View" toggle (`showListView`) flips between the entry form and a card/table list of seeded mock rows.

That same recipe is repeated four times — a strong candidate for a generic `MasterFormPage` HOC if/when these are wired to real APIs.

---

## 4. Client Portal

`ClientPortal.js` (≈1,300 lines) is the single orchestrator for everything client-facing. It is rendered as a **completely separate root** from the admin shell — when `isClientView` is on, `App.js` short-circuits the normal sidebar/navbar and just returns `<ClientPortal user={user} onLogout={...} />`.

It manages three big states:

| State | What it controls |
|---|---|
| `showSignup` | Whether the user is still pre-login (pre-onboarding marketing) or has clicked *Get Started*. |
| `showPersonalForm` … `showSubmitForm` (9 booleans) | Which step of the onboarding wizard is currently visible. |
| `activeTab` | Once onboarding is done, which gateway screen is showing. |

`formData` accumulates submissions across the wizard; each step's `onNext(payload)` merges into it. There is **no persistence today** — refreshing loses everything.

### 4.1 Pre-onboarding (public marketing)

When `showSignup === true`, the shell renders `ClientNavbar` + a sidebar of marketing tabs:

```
Home → PreOnboardingHome.js
About → PreOnboardingAbout.js
Our Funds → inline fund catalogue inside ClientPortal.js (renderFundsView)
Investment Planner → SIPCalculator.js
Fund Documents → PreOnboardingFundDocuments.js
Contact → PreOnboardingContact.js
```

These pages use a curated `introFunds` array of three real-looking funds (EIF, CMT, SBF) so the catalogue feels seeded. Every CTA on every marketing page routes to `handleGetStarted()` which flips `showSignup` off and `showPersonalForm` on, starting the onboarding wizard.

`SIPCalculator.js` is a self-contained calculator: target amount + horizon → required monthly SIP, or monthly amount + horizon → projected future value. Assumes a fixed 12% p.a. expected return (`ANNUAL_RETURN_RATE = 0.12`) — should be parameterised before going live.

### 4.2 Onboarding wizard (9 steps)

Each form is a controlled React form with `onNext` / `onPrevious` props. The orchestrator handles transitions:

| # | Component | Captures |
|---|---|---|
| 1 | `ClientSignupForm` | Personal details (gender, title, name, DOB, nationality, NIC) |
| 2 | `ClientContactForm` | Address, phone, email |
| 3 | `ClientEmploymentForm` | Employer, occupation, income |
| 4 | `ClientBankForm` | Bank account + funding source |
| 5 | `ClientAdditionalDetailsForm` | PEP / source-of-funds / tax residency |
| 6 | `ClientOtherProductsForm` | Other investment products + T&C consent |
| 7 | `ClientDocumentUploadForm` | KYC document uploads |
| 8 | `ClientVideoVerificationForm` | Video selfie KYC |
| 9 | `ClientSubmitForm` | Final review + submit |

A right-rail stepper (defined as `onboardingSteps` in `ClientPortal.js`) lets the user jump to any previously completed step. After `handleSubmitFormSubmit()` runs, the wizard exits and the user is dropped into the gateway with `activeTab = 'Dashboard'`.

Default values in `ClientSignupForm` are currently filled with a real-looking placeholder identity — fine for demos, but should be blanked before production.

### 4.3 Client Gateway (logged-in experience)

`ClientSidebar` exposes nine items, each rendered from `tabToComponent` inside `ClientPortal.js`:

| Tab | Component | Purpose |
|---|---|---|
| Dashboard | `ClientGateway/ClientDashboard.js` | Summary cards, performance over horizons, current holdings, recent transactions. |
| My Portfolio | `ClientGateway/MyPortfolio.js` | Holdings table with cost / current value / gain / allocation, plus a selectable fund detail pane. |
| Create | `ClientGateway/Create.js` | Two-stage flow: (1) confirm funding by uploading a bank statement and entering an amount, then (2) capture the actual subscription instruction (fund + amount/units + payment method + date + reference). Gated on `fundingStatus.isComplete`, which is held on the orchestrator. |
| Redeem | `ClientGateway/Redeem.js` | Pick holding → enter units/amount → payout method → submit. |
| Transfer | `ClientGateway/Transfer.js` | Between funds, between accounts, or to third-party — drives different sub-forms. |
| Statements | `ClientGateway/Statements.js` | Period + year filter over Monthly / Quarterly / Annual statements with PDF download buttons. |
| Transactions | `ClientGateway/ClientTransactions.js` | Filterable, searchable transaction history. |
| Fund Information | `ClientPortal/FundInformation.js` and a richer in-portal variant from `renderFundsView({ signupMode: false })` | Fund catalogue with NAV, returns over 1Y/3Y/5Y, min investment, risk. |
| Settings | `ClientGateway/ClientSettings.js` | Profile / address / notification preferences (tabbed UI). |

`Create` is the only screen with non-trivial cross-screen state: the funding confirmation is hoisted into `ClientPortal` (`fundingStatus`) so the same purchase session can be resumed if the user navigates away.

---

## 5. Cross-cutting patterns

**State, not stores.** No Redux, Zustand or React Context anywhere in this module. Every screen is self-contained with `useState`/`useMemo`. Cross-screen state (e.g. `formData` during onboarding, `fundingStatus` during Create) lives on `ClientPortal.js`.

**Mock-first.** Every screen seeds its own list/table. There's no shared `mockData` module — each component re-declares e.g. its own version of the same 4-5 funds (`Equity Growth Fund`, `Balanced Income Fund`, etc.). When the backend is wired up, this is the **biggest single refactor target**: extract `services/wealth/*` data accessors and replace the `useState([...])` seeds with `useEffect(() => fetchX())`.

**CSS conventions.** Two parallel naming systems coexist:

- The Admin shell uses `wm-*` / `wm-eq-*` / `wmca-*` / `wmwm-*` BEM-ish prefixes — `wm-eq-*` specifically mirrors the Equity manager's hero/strip/card style so the two cockpits feel identical.
- The Client Portal uses `cp-*` for everything (`cp-root`, `cp-sidebar`, `cp-fund-overview-*`, `cp-pre-*`, etc.).

Most CSS lives next to its component in a `Styles/` subfolder. A couple of files live in `WealthManager/Styles/` and `WealthManager/WM Dashboard/Styles/` — see Known Issues.

**Currency / formatting.** Almost every screen redeclares its own `formatCurrency` / `formatNumber` / `formatLkrCompact` helper. These are pure functions and would be a quick win to centralise into `utils/formatters.js`.

**SVG icons inline.** Every icon is a hand-written `<svg>`. No icon library is used. This makes the markup verbose but keeps the bundle free of an icon dependency.

---

## 6. Known issues, gaps and refactor candidates

### Bugs

- **`ClientSubmitForm.js` line 22** has a stray "ClientSubmitForm" text node leaking into the JSX inside the illustration `<div>`. It will render as visible text on the submit screen.

  ```22:22:equity-module-ui/equity-module-ui/src/components/WealthManager/ClientPortal/ClientOnboarding/ClientSubmitForm.js
            <div className="cp-submit-illustration">ClientSubmitForm
  ```

- **Pre-filled PII** in `ClientSignupForm.js` defaults (real-looking name, DOB, NIC). Should be `''` defaults.
- **`renderFundsView` references** `selectedFund.dailyChangePercent`, `buyPrice`, `sellPrice`, etc. — these aren't on every fund in `introFunds`, so any fund missing them silently renders `undefined`. Optional chaining (`selectedFund.nav?.toFixed(4)`) hides it but the UI still shows blanks.

### Gaps

- **No backend.** Zero `fetch`/`axios` calls. Submit handlers fake latency with `setTimeout`. Every list is local seed data.
- **No `react-router`.** The whole app is tab-state driven from `App.js`. Deep links, browser back/forward, refresh-survives-onboarding-step are all unsupported.
- **No auth-driven view switch.** `isClientView` is a manual sidebar toggle. The TODO in `App.js:363` notes it should become `user.role === 'client'` once auth supports roles.
- **No onboarding persistence.** A page refresh during the 9-step wizard drops `formData` entirely.
- **Many sidebar items have no components.** Unit Trust Operations, Valuation & NAV, Reporting, Risk & Compliance, Settings & Configuration sub-topics all fall through to the *Component Not Found* fallback.
- **Top-bar KPIs are hard-coded `—`.** `WealthNavbar` shows AUM / Clients / Funds placeholders that never update.

### Refactor opportunities

1. **Shared master-form pattern.** `FundMaster`, `FundCategories`, `WealthPortfolioMaster`, `ExpenseMaster`/`DefineExpenses` are 80% identical. Extract a `<MasterEntityPage schema={...} />` that consumes a JSON schema for fields, required-flags, select-options, and list columns.
2. **Centralise formatters.** `formatCurrency`, `formatNumber`, `formatLkrCompact`, `formatPercent` are duplicated in ~12 files.
3. **Single source for fund seed data.** `Equity Growth Fund` / `Balanced Income Fund` / `Fixed Income Fund` / `Money Market Fund` appear with slightly different field shapes in `WealthManagerDashboard`, `WMPortfolioOverview`, `ClientDashboard`, `MyPortfolio`, `Create`, `Redeem`, `Transfer`, `FundInformation`, etc. Move into `mocks/wealthFunds.js`.
4. **Split `ClientPortal.js` (≈1,300 lines).** The orchestrator currently inlines `renderFundsView`, `renderPreOnboardingContent`, the wizard router, the gateway router, the seeded fund catalogue, and the menu-item array. At minimum, extract: `useOnboardingWizard()` hook, `<FundCatalogue />` component, the `clientMenuItems` + `preOnboardingSidebarItems` constants into a separate `clientNavigation.js`.
5. **`Styles/WealthManagerDashboard.css` exists in two places** — once under `WealthManager/Styles/` and once under `WealthManager/WM Dashboard/Styles/`. Only the second is imported; the first looks orphaned.

---

## 7. Suggested first wire-up steps

If you want to start replacing the mocks with real data, here's the ranked order I'd recommend (smallest blast radius first):

1. `services/wealth/funds.js` → wire `FundMaster.handleSubmit` and `WMPortfolioOverview` / `FundInformation` reads.
2. `services/wealth/clients.js` → `ClientAccounts` + `ClientPortfolio` lists.
3. `services/wealth/transactions.js` → `Create` / `Redeem` / `Transfer` writes, `ClientTransactions` reads.
4. `services/wealth/onboarding.js` → POST each onboarding step as it completes, so refreshing doesn't lose progress.
5. Replace `isClientView` toggle with `user.role === 'client'` from `authService`.
6. Lastly, wire the cockpit KPI chip in `WealthNavbar` from `services/wealth/summary.js`.
