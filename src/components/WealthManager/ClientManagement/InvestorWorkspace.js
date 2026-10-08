import React, { useEffect, useMemo, useRef, useState } from 'react';
import WealthPageHeader from '../Layout/WealthPageHeader';
import cisFundService from '../../../services/cisFundService';
import cisInvestorService from '../../../services/cisInvestorService';
import '../Fund Master/Styles/FundMaster.css';
import './Styles/InvestorFoundation.css';

const TABS = [
  ['profile', 'Profile'],
  ['identifiers', 'Identifiers'],
  ['contacts', 'Contacts & Addresses'],
  ['kyc', 'KYC'],
  ['documents', 'Documents'],
  ['bank', 'Bank Accounts'],
  ['folios', 'Folios'],
];

const emptyInvestor = {
  investorNumber: '',
  partyType: 'INDIVIDUAL',
  legalName: '',
  status: 'Active',
  onboardingDate: '',
  residencyCountry: '',
  nationalityCountry: '',
  notes: '',
  title: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  incorporationDate: '',
  incorporationCountry: '',
};

function Field({ label, children, wide }) {
  return (
    <label className={`fm-field-group${wide ? ' fm-field-group--wide' : ''}`}>
      <span className="fm-field-label">{label}</span>
      {children}
    </label>
  );
}

function InvestorWorkspace({ initialView = 'list' }) {
  const loadGeneration = useRef(0);
  const [view, setView] = useState(initialView === 'create' ? 'create' : 'list');
  const [tab, setTab] = useState(initialView === 'kyc' ? 'kyc' : 'profile');
  const [investors, setInvestors] = useState([]);
  const [funds, setFunds] = useState([]);
  const [investor, setInvestor] = useState(null);
  const [folio, setFolio] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyInvestor);
  const [tabData, setTabData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadInvestors = async () => {
    const generation = ++loadGeneration.current;
    setLoading(true);
    setError('');
    try {
      const rows = await cisInvestorService.listInvestors();
      if (generation !== loadGeneration.current) return;
      setInvestors(rows);
    } catch (err) {
      if (generation !== loadGeneration.current) return;
      setError(err.message);
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestors();
    cisFundService.listFunds().then(setFunds).catch(() => setFunds([]));
    // The list is loaded once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleInvestors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return investors;
    return investors.filter((row) =>
      `${row.legalName} ${row.investorNumber}`.toLowerCase().includes(term)
    );
  }, [investors, search]);

  const loadTab = async (investorId, nextTab, generation) => {
    if (nextTab === 'profile') return;
    const loaders = {
      identifiers: async () => ({
        types: await cisInvestorService.listIdentifierTypes(),
        rows: await cisInvestorService.listIdentifiers(investorId),
      }),
      contacts: async () => ({
        contacts: await cisInvestorService.listContacts(investorId),
        addresses: await cisInvestorService.listAddresses(investorId),
      }),
      kyc: async () => ({ reviews: await cisInvestorService.listKycReviews(investorId) }),
      documents: async () => ({
        documents: await cisInvestorService.listDocuments(investorId),
        reviews: await cisInvestorService.listKycReviews(investorId),
      }),
      bank: async () => ({ accounts: await cisInvestorService.listBankAccounts(investorId) }),
      folios: async () => ({ folios: await cisInvestorService.listInvestorFolios(investorId) }),
    };
    const data = await loaders[nextTab]();
    if (generation !== loadGeneration.current) return;
    setTabData(data);
  };

  const openInvestor = async (row, nextTab) => {
    const generation = ++loadGeneration.current;
    setView('profile');
    setTab(nextTab);
    setFolio(null);
    setError('');
    setLoading(true);
    setTabData({});
    try {
      const detail = await cisInvestorService.getInvestor(row.id);
      if (generation !== loadGeneration.current) return;
      setInvestor(detail);
      await loadTab(row.id, nextTab, generation);
    } catch (err) {
      if (generation !== loadGeneration.current) return;
      setError(err.message);
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  };

  const changeTab = async (nextTab) => {
    if (!investor) return;
    const generation = ++loadGeneration.current;
    setTab(nextTab);
    setError('');
    setLoading(true);
    setTabData({});
    try {
      await loadTab(investor.id, nextTab, generation);
    } catch (err) {
      if (generation !== loadGeneration.current) return;
      setError(err.message);
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  };

  const saveInvestor = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        investorNumber: form.investorNumber,
        partyType: form.partyType,
        legalName: form.legalName,
        status: form.status,
        onboardingDate: form.onboardingDate,
        residencyCountry: form.residencyCountry || null,
        nationalityCountry: form.nationalityCountry || null,
        notes: form.notes || null,
      };
      if (form.partyType === 'INDIVIDUAL') {
        payload.individual = {
          title: form.title || null,
          firstName: form.firstName,
          middleName: form.middleName || null,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth || null,
        };
      } else {
        payload.organisation = {
          incorporationDate: form.incorporationDate || null,
          incorporationCountry: form.incorporationCountry || null,
        };
      }
      const created = await cisInvestorService.createInvestor(payload);
      setForm(emptyInvestor);
      await openInvestor(created, 'profile');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const openFolio = async (folioId) => {
    const generation = ++loadGeneration.current;
    setView('folio');
    setError('');
    setLoading(true);
    try {
      const [detail, balance, ledger, eventTypes] = await Promise.all([
        cisInvestorService.getFolio(folioId),
        cisInvestorService.getUnitBalance(folioId),
        cisInvestorService.listLedger(folioId),
        cisInvestorService.listLedgerEventTypes(),
      ]);
      if (generation !== loadGeneration.current) return;
      setFolio({ detail, balance, ledger, eventTypes, asOfDate: balance.asOfDate });
    } catch (err) {
      if (generation !== loadGeneration.current) return;
      setError(err.message);
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  };

  const refreshBalance = async (event) => {
    event.preventDefault();
    if (!folio) return;
    setError('');
    try {
      const balance = await cisInvestorService.getUnitBalance(folio.detail.id, folio.asOfDate);
      setFolio({ ...folio, balance });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fm-container">
      <WealthPageHeader
        title={view === 'create' ? 'Investor onboarding' : view === 'folio' ? 'Folio' : 'Investors'}
        blurb="Investor records, folios, and the unit register for the CIS fund registry."
        actions={
          view === 'list' ? (
            <button type="button" className="fm-btn fm-btn-primary" onClick={() => { setView('create'); setError(''); }}>
              New investor
            </button>
          ) : (
            <button
              type="button"
              className="fm-btn fm-btn-secondary"
              onClick={() => { setView('list'); setFolio(null); setError(''); loadInvestors(); }}
            >
              Investor list
            </button>
          )
        }
      />
      {error ? <p className="inv-error">{error}</p> : null}

      {view === 'list' ? (
        <section>
          <div className="inv-grid">
            <Field label="Search by name or investor number">
              <input className="fm-form-input" value={search} onChange={(event) => setSearch(event.target.value)} />
            </Field>
          </div>
          {loading ? <p className="fcc-empty">Loading investors.</p> : null}
          {!loading && visibleInvestors.length === 0 ? <p className="fcc-empty">No investors have been recorded.</p> : null}
          {visibleInvestors.length > 0 ? (
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Investor number</th>
                  <th>Name</th>
                  <th>Party</th>
                  <th>Status</th>
                  <th>Onboarding</th>
                  <th>Latest KYC</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleInvestors.map((row) => (
                  <tr key={row.id}>
                    <td>{row.investorNumber}</td>
                    <td>{row.legalName}</td>
                    <td>{row.partyType === 'INDIVIDUAL' ? 'Individual' : 'Organisation'}</td>
                    <td>{row.status}</td>
                    <td>{row.onboardingDate}</td>
                    <td>{row.latestKycStatus || 'None'}</td>
                    <td>
                      <button type="button" className="fcc-link" onClick={() => openInvestor(row, initialView === 'kyc' ? 'kyc' : 'profile')}>
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      ) : null}

      {view === 'create' ? (
        <form onSubmit={saveInvestor}>
          <div className="inv-grid">
            <Field label="Party type">
              <select className="fm-form-input" value={form.partyType} onChange={(event) => setForm({ ...form, partyType: event.target.value })}>
                <option value="INDIVIDUAL">Individual</option>
                <option value="ORGANISATION">Organisation</option>
              </select>
            </Field>
            <Field label="Investor number">
              <input className="fm-form-input" value={form.investorNumber} onChange={(event) => setForm({ ...form, investorNumber: event.target.value })} required />
            </Field>
            <Field label="Legal name" wide>
              <input className="fm-form-input" value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} required />
            </Field>
            <Field label="Status">
              <input className="fm-form-input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} />
            </Field>
            <Field label="Onboarding date">
              <input className="fm-form-input" type="date" value={form.onboardingDate} onChange={(event) => setForm({ ...form, onboardingDate: event.target.value })} required />
            </Field>
            <Field label="Residency country">
              <input className="fm-form-input" maxLength={8} value={form.residencyCountry} onChange={(event) => setForm({ ...form, residencyCountry: event.target.value })} />
            </Field>
            <Field label="Nationality country">
              <input className="fm-form-input" maxLength={8} value={form.nationalityCountry} onChange={(event) => setForm({ ...form, nationalityCountry: event.target.value })} />
            </Field>
            {form.partyType === 'INDIVIDUAL' ? (
              <>
                <Field label="Title"><input className="fm-form-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
                <Field label="First name"><input className="fm-form-input" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required /></Field>
                <Field label="Middle name"><input className="fm-form-input" value={form.middleName} onChange={(event) => setForm({ ...form, middleName: event.target.value })} /></Field>
                <Field label="Last name"><input className="fm-form-input" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required /></Field>
                <Field label="Date of birth"><input className="fm-form-input" type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></Field>
              </>
            ) : (
              <>
                <Field label="Incorporation date"><input className="fm-form-input" type="date" value={form.incorporationDate} onChange={(event) => setForm({ ...form, incorporationDate: event.target.value })} /></Field>
                <Field label="Incorporation country"><input className="fm-form-input" maxLength={8} value={form.incorporationCountry} onChange={(event) => setForm({ ...form, incorporationCountry: event.target.value })} /></Field>
              </>
            )}
            <Field label="Notes" wide>
              <textarea className="fm-form-input" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </Field>
          </div>
          <button type="submit" className="fm-btn fm-btn-primary" disabled={loading}>Save investor</button>
        </form>
      ) : null}

      {view === 'profile' && investor ? (
        <section>
          <h2 className="fcc-block__title">{investor.legalName}</h2>
          <p className="fcc-empty">{investor.investorNumber} · {investor.partyType === 'INDIVIDUAL' ? 'Individual' : 'Organisation'}</p>
          <div className="fcc-tabs">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" className={`fm-btn ${tab === id ? 'fm-btn-primary' : 'fm-btn-secondary'}`} onClick={() => changeTab(id)}>
                {label}
              </button>
            ))}
          </div>
          {loading ? <p className="fcc-empty">Loading.</p> : null}
          {tab === 'profile' ? <ProfileTab key={investor.updatedAt || investor.id} investor={investor} onSaved={openInvestor} /> : null}
          {tab === 'identifiers' && !loading ? <IdentifiersTab investorId={investor.id} data={tabData} onChanged={() => changeTab('identifiers')} /> : null}
          {tab === 'contacts' && !loading ? <ContactsTab investorId={investor.id} data={tabData} onChanged={() => changeTab('contacts')} /> : null}
          {tab === 'kyc' && !loading ? <KycTab investorId={investor.id} data={tabData} onChanged={() => changeTab('kyc')} /> : null}
          {tab === 'documents' && !loading ? <DocumentsTab investorId={investor.id} data={tabData} onChanged={() => changeTab('documents')} /> : null}
          {tab === 'bank' && !loading ? <BankTab investorId={investor.id} data={tabData} onChanged={() => changeTab('bank')} /> : null}
          {tab === 'folios' && !loading ? (
            <FoliosTab investor={investor} investors={investors} funds={funds} data={tabData} onOpenFolio={openFolio} onChanged={() => changeTab('folios')} />
          ) : null}
        </section>
      ) : null}

      {view === 'folio' && folio ? (
        <FolioDetail
          folio={folio}
          investors={investors}
          onAsOfChange={(asOfDate) => setFolio({ ...folio, asOfDate })}
          onRefreshBalance={refreshBalance}
          onHolderAdded={() => openFolio(folio.detail.id)}
        />
      ) : null}
    </div>
  );
}

function ProfileTab({ investor, onSaved }) {
  const [form, setForm] = useState({
    legalName: investor.legalName || '',
    status: investor.status || 'Active',
    onboardingDate: investor.onboardingDate || '',
    residencyCountry: investor.residencyCountry || '',
    nationalityCountry: investor.nationalityCountry || '',
    notes: investor.notes || '',
    title: investor.individual?.title || '',
    firstName: investor.individual?.firstName || '',
    middleName: investor.individual?.middleName || '',
    lastName: investor.individual?.lastName || '',
    dateOfBirth: investor.individual?.dateOfBirth || '',
    incorporationDate: investor.organisation?.incorporationDate || '',
    incorporationCountry: investor.organisation?.incorporationCountry || '',
  });
  const [message, setMessage] = useState('');

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await cisInvestorService.updateInvestor(investor.id, {
        legalName: form.legalName,
        status: form.status,
        onboardingDate: form.onboardingDate,
        residencyCountry: form.residencyCountry || null,
        nationalityCountry: form.nationalityCountry || null,
        notes: form.notes || null,
      });
      if (investor.partyType === 'INDIVIDUAL') {
        await cisInvestorService.updateIndividual(investor.id, {
          title: form.title || null,
          firstName: form.firstName,
          middleName: form.middleName || null,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth || null,
        });
      } else {
        await cisInvestorService.updateOrganisation(investor.id, {
          incorporationDate: form.incorporationDate || null,
          incorporationCountry: form.incorporationCountry || null,
        });
      }
      setMessage('Profile saved.');
      onSaved(investor, 'profile');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={save}>
      <dl className="fcc-profile">
        <div><dt>Party type</dt><dd>{investor.partyType === 'INDIVIDUAL' ? 'Individual' : 'Organisation'}</dd></div>
        <div><dt>Investor number</dt><dd>{investor.investorNumber}</dd></div>
      </dl>
      <div className="inv-grid">
        <Field label="Legal name" wide><input className="fm-form-input" value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} required /></Field>
        <Field label="Status"><input className="fm-form-input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} /></Field>
        <Field label="Onboarding date"><input className="fm-form-input" type="date" value={form.onboardingDate || ''} onChange={(event) => setForm({ ...form, onboardingDate: event.target.value })} required /></Field>
        <Field label="Residency country"><input className="fm-form-input" maxLength={8} value={form.residencyCountry} onChange={(event) => setForm({ ...form, residencyCountry: event.target.value })} /></Field>
        <Field label="Nationality country"><input className="fm-form-input" maxLength={8} value={form.nationalityCountry} onChange={(event) => setForm({ ...form, nationalityCountry: event.target.value })} /></Field>
        {investor.partyType === 'INDIVIDUAL' ? (
          <>
            <Field label="Title"><input className="fm-form-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
            <Field label="First name"><input className="fm-form-input" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required /></Field>
            <Field label="Middle name"><input className="fm-form-input" value={form.middleName} onChange={(event) => setForm({ ...form, middleName: event.target.value })} /></Field>
            <Field label="Last name"><input className="fm-form-input" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required /></Field>
            <Field label="Date of birth"><input className="fm-form-input" type="date" value={form.dateOfBirth || ''} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></Field>
          </>
        ) : (
          <>
            <Field label="Incorporation date"><input className="fm-form-input" type="date" value={form.incorporationDate || ''} onChange={(event) => setForm({ ...form, incorporationDate: event.target.value })} /></Field>
            <Field label="Incorporation country"><input className="fm-form-input" maxLength={8} value={form.incorporationCountry} onChange={(event) => setForm({ ...form, incorporationCountry: event.target.value })} /></Field>
          </>
        )}
        <Field label="Notes" wide><textarea className="fm-form-input" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
      </div>
      {message ? <p className="fcc-empty">{message}</p> : null}
      <button type="submit" className="fm-btn fm-btn-primary">Save profile</button>
    </form>
  );
}

function IdentifiersTab({ investorId, data, onChanged }) {
  const types = data.types || [];
  const rows = data.rows || [];
  const [form, setForm] = useState({ identifierTypeId: '', identifierValue: '', issuingCountry: '', isPrimary: false });
  const [message, setMessage] = useState('');

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await cisInvestorService.createIdentifier(investorId, {
        identifierTypeId: Number(form.identifierTypeId),
        identifierValue: form.identifierValue,
        issuingCountry: form.issuingCountry || null,
        isPrimary: form.isPrimary,
      });
      setForm({ identifierTypeId: '', identifierValue: '', issuingCountry: '', isPrimary: false });
      onChanged();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section>
      {types.length === 0 ? <p className="fcc-empty">No identifier types have been configured.</p> : null}
      {rows.length === 0 ? <p className="fcc-empty">No identifiers have been recorded.</p> : (
        <table className="inv-table">
          <thead><tr><th>Type</th><th>Value</th><th>Verification</th><th>Primary</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.identifierTypeName}</td>
                <td>{row.identifierValue}</td>
                <td>{row.verificationStatus}</td>
                <td>{row.isPrimary ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {types.length > 0 ? (
        <form onSubmit={save} className="fcc-card">
          <div className="inv-grid">
            <Field label="Identifier type">
              <select className="fm-form-input" value={form.identifierTypeId} onChange={(event) => setForm({ ...form, identifierTypeId: event.target.value })} required>
                <option value="">Select</option>
                {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </Field>
            <Field label="Value"><input className="fm-form-input" value={form.identifierValue} onChange={(event) => setForm({ ...form, identifierValue: event.target.value })} required /></Field>
            <Field label="Issuing country"><input className="fm-form-input" maxLength={8} value={form.issuingCountry} onChange={(event) => setForm({ ...form, issuingCountry: event.target.value })} /></Field>
          </div>
          <label className="fcc-check"><input type="checkbox" checked={form.isPrimary} onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })} /> Primary</label>
          {message ? <p className="inv-error">{message}</p> : null}
          <div className="inv-actions"><button type="submit" className="fm-btn fm-btn-primary">Add identifier</button></div>
        </form>
      ) : null}
    </section>
  );
}

function ContactsTab({ investorId, data, onChanged }) {
  const [contact, setContact] = useState({ contactKind: 'EMAIL', contactValue: '', isPrimary: false });
  const [address, setAddress] = useState({ addressRole: 'RESIDENTIAL', addressLine1: '', city: '', countryCode: '', isPrimary: false });
  const [message, setMessage] = useState('');

  const saveContact = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await cisInvestorService.createContact(investorId, contact);
      setContact({ contactKind: 'EMAIL', contactValue: '', isPrimary: false });
      onChanged();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await cisInvestorService.createAddress(investorId, address);
      setAddress({ addressRole: 'RESIDENTIAL', addressLine1: '', city: '', countryCode: '', isPrimary: false });
      onChanged();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section>
      <h3 className="fcc-block__title">Contacts</h3>
      {(data.contacts || []).length === 0 ? <p className="fcc-empty">No contacts have been recorded.</p> : (
        <table className="inv-table">
          <thead><tr><th>Kind</th><th>Value</th><th>Verification</th><th>Primary</th></tr></thead>
          <tbody>
            {(data.contacts || []).map((row) => (
              <tr key={row.id}><td>{row.contactKind}</td><td>{row.contactValue}</td><td>{row.verificationStatus}</td><td>{row.isPrimary ? 'Yes' : 'No'}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={saveContact} className="fcc-card">
        <div className="inv-grid">
          <Field label="Kind">
            <select className="fm-form-input" value={contact.contactKind} onChange={(event) => setContact({ ...contact, contactKind: event.target.value })}>
              <option value="EMAIL">Email</option>
              <option value="MOBILE">Mobile</option>
              <option value="TELEPHONE">Telephone</option>
            </select>
          </Field>
          <Field label="Value"><input className="fm-form-input" value={contact.contactValue} onChange={(event) => setContact({ ...contact, contactValue: event.target.value })} required /></Field>
        </div>
        <button type="submit" className="fm-btn fm-btn-secondary">Add contact</button>
      </form>
      <h3 className="fcc-block__title">Addresses</h3>
      {(data.addresses || []).length === 0 ? <p className="fcc-empty">No addresses have been recorded.</p> : (
        <table className="inv-table">
          <thead><tr><th>Role</th><th>Address</th><th>City</th></tr></thead>
          <tbody>
            {(data.addresses || []).map((row) => (
              <tr key={row.id}><td>{row.addressRole}</td><td>{row.addressLine1}</td><td>{row.city}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={saveAddress} className="fcc-card">
        <div className="inv-grid">
          <Field label="Role">
            <select className="fm-form-input" value={address.addressRole} onChange={(event) => setAddress({ ...address, addressRole: event.target.value })}>
              <option value="RESIDENTIAL">Residential</option>
              <option value="CORRESPONDENCE">Correspondence</option>
              <option value="REGISTERED">Registered</option>
            </select>
          </Field>
          <Field label="Address line"><input className="fm-form-input" value={address.addressLine1} onChange={(event) => setAddress({ ...address, addressLine1: event.target.value })} required /></Field>
          <Field label="City"><input className="fm-form-input" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} /></Field>
          <Field label="Country"><input className="fm-form-input" maxLength={8} value={address.countryCode} onChange={(event) => setAddress({ ...address, countryCode: event.target.value })} /></Field>
        </div>
        {message ? <p className="inv-error">{message}</p> : null}
        <button type="submit" className="fm-btn fm-btn-secondary">Add address</button>
      </form>
    </section>
  );
}

function KycTab({ investorId, data, onChanged }) {
  const [reviewDate, setReviewDate] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const reviews = data.reviews || [];

  const createReview = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await cisInvestorService.createKycReview(investorId, { reviewDate, notes });
      setReviewDate('');
      setNotes('');
      onChanged();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const decide = async (reviewId, status) => {
    const decisionNotes = window.prompt('Decision notes') || '';
    setMessage('');
    try {
      await cisInvestorService.decideKycReview(investorId, reviewId, { status, decisionNotes });
      onChanged();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section>
      {reviews.length === 0 ? <p className="fcc-empty">No KYC reviews have been recorded.</p> : (
        <table className="inv-table">
          <thead><tr><th>Date</th><th>Status</th><th>Decision</th><th>Superseded by</th><th></th></tr></thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.reviewDate}</td>
                <td>{review.status}</td>
                <td>{review.decisionNotes || ''}</td>
                <td>{review.supersededById || ''}</td>
                <td>
                  {review.status === 'OPEN' ? (
                    <span className="inv-actions">
                      <button type="button" className="fcc-link" onClick={() => decide(review.id, 'APPROVED')}>Approve</button>
                      <button type="button" className="fcc-link" onClick={() => decide(review.id, 'REJECTED')}>Reject</button>
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={createReview} className="fcc-card">
        <div className="inv-grid">
          <Field label="Review date"><input className="fm-form-input" type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} required /></Field>
          <Field label="Notes"><input className="fm-form-input" value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        </div>
        {message ? <p className="inv-error">{message}</p> : null}
        <button type="submit" className="fm-btn fm-btn-primary">Add KYC review</button>
      </form>
    </section>
  );
}

function DocumentsTab({ investorId, data, onChanged }) {
  const [form, setForm] = useState({ documentTypeCode: '', filename: '', storageReference: '', kycReviewId: '' });
  const [message, setMessage] = useState('');

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await cisInvestorService.createDocument(investorId, {
        documentTypeCode: form.documentTypeCode,
        filename: form.filename,
        storageReference: form.storageReference,
        kycReviewId: form.kycReviewId || null,
      });
      setForm({ documentTypeCode: '', filename: '', storageReference: '', kycReviewId: '' });
      onChanged();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section>
      <p className="fcc-empty">Record document metadata and a storage reference. The file itself is not stored in the database.</p>
      {(data.documents || []).length === 0 ? <p className="fcc-empty">No documents have been recorded.</p> : (
        <table className="inv-table">
          <thead><tr><th>Type</th><th>Filename</th><th>KYC review</th><th>Verification</th></tr></thead>
          <tbody>
            {(data.documents || []).map((row) => (
              <tr key={row.id}><td>{row.documentTypeCode}</td><td>{row.filename}</td><td>{row.kycReviewId || 'General'}</td><td>{row.verificationStatus}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={save} className="fcc-card">
        <div className="inv-grid">
          <Field label="Document type code"><input className="fm-form-input" value={form.documentTypeCode} onChange={(event) => setForm({ ...form, documentTypeCode: event.target.value })} required /></Field>
          <Field label="Filename"><input className="fm-form-input" value={form.filename} onChange={(event) => setForm({ ...form, filename: event.target.value })} required /></Field>
          <Field label="Storage reference"><input className="fm-form-input" value={form.storageReference} onChange={(event) => setForm({ ...form, storageReference: event.target.value })} required /></Field>
          <Field label="KYC review">
            <select className="fm-form-input" value={form.kycReviewId} onChange={(event) => setForm({ ...form, kycReviewId: event.target.value })}>
              <option value="">General investor document</option>
              {(data.reviews || []).map((review) => <option key={review.id} value={review.id}>{review.reviewDate} · {review.status}</option>)}
            </select>
          </Field>
        </div>
        {message ? <p className="inv-error">{message}</p> : null}
        <button type="submit" className="fm-btn fm-btn-primary">Add document</button>
      </form>
    </section>
  );
}

function BankTab({ investorId, data, onChanged }) {
  const [form, setForm] = useState({ bankName: '', branchName: '', accountName: '', accountNumber: '', currencyCode: 'LKR', isPrimary: false });
  const [message, setMessage] = useState('');
  const [revealed, setRevealed] = useState({});

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await cisInvestorService.createBankAccount(investorId, form);
      setForm({ bankName: '', branchName: '', accountName: '', accountNumber: '', currencyCode: 'LKR', isPrimary: false });
      onChanged();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const reveal = async (accountId) => {
    try {
      const detail = await cisInvestorService.getBankAccount(investorId, accountId);
      setRevealed({ ...revealed, [accountId]: detail.accountNumber });
    } catch (err) {
      setMessage(err.message);
    }
  };

  const verify = async (accountId) => {
    setMessage('');
    try {
      await cisInvestorService.verifyBankAccount(investorId, accountId);
      onChanged();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section>
      {(data.accounts || []).length === 0 ? <p className="fcc-empty">No bank accounts have been recorded.</p> : (
        <table className="inv-table">
          <thead><tr><th>Bank</th><th>Account</th><th>Currency</th><th>Verification</th><th></th></tr></thead>
          <tbody>
            {(data.accounts || []).map((row) => (
              <tr key={row.id}>
                <td>{row.bankName}{row.branchName ? ` · ${row.branchName}` : ''}</td>
                <td>{revealed[row.id] || row.accountNumber}</td>
                <td>{row.currencyCode}</td>
                <td>{row.verificationStatus}</td>
                <td>
                  <button type="button" className="fcc-link" onClick={() => reveal(row.id)}>Show</button>
                  {row.verificationStatus !== 'VERIFIED' ? <button type="button" className="fcc-link" onClick={() => verify(row.id)}>Verify</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={save} className="fcc-card">
        <div className="inv-grid">
          <Field label="Bank name"><input className="fm-form-input" value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} required /></Field>
          <Field label="Branch name"><input className="fm-form-input" value={form.branchName} onChange={(event) => setForm({ ...form, branchName: event.target.value })} /></Field>
          <Field label="Account name"><input className="fm-form-input" value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value })} required /></Field>
          <Field label="Account number"><input className="fm-form-input" value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} required /></Field>
          <Field label="Currency"><input className="fm-form-input" maxLength={8} value={form.currencyCode} onChange={(event) => setForm({ ...form, currencyCode: event.target.value })} required /></Field>
        </div>
        {message ? <p className="inv-error">{message}</p> : null}
        <button type="submit" className="fm-btn fm-btn-primary">Add bank account</button>
      </form>
    </section>
  );
}

function FoliosTab({ investor, investors, funds, data, onOpenFolio, onChanged }) {
  const [form, setForm] = useState({ fundId: '', folioNumber: '', openedDate: '', jointInvestorId: '' });
  const [message, setMessage] = useState('');
  const folios = data.folios || [];

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    const holders = [{ investorId: investor.id, effectiveFrom: form.openedDate, holderSequence: 1 }];
    if (form.jointInvestorId) holders.push({ investorId: Number(form.jointInvestorId), effectiveFrom: form.openedDate, holderSequence: 2 });
    try {
      await cisInvestorService.createFolio({
        fundId: Number(form.fundId),
        folioNumber: form.folioNumber,
        openedDate: form.openedDate,
        holders,
      });
      setForm({ fundId: '', folioNumber: '', openedDate: '', jointInvestorId: '' });
      onChanged();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section>
      {folios.length === 0 ? <p className="fcc-empty">No folios have been opened for this investor.</p> : (
        <table className="inv-table">
          <thead><tr><th>Folio</th><th>Fund</th><th>Status</th><th>Opened</th><th></th></tr></thead>
          <tbody>
            {folios.map((row) => (
              <tr key={row.id}>
                <td>{row.folioNumber}</td>
                <td>{row.fundCode} — {row.fundName}</td>
                <td>{row.status}</td>
                <td>{row.openedDate}</td>
                <td><button type="button" className="fcc-link" onClick={() => onOpenFolio(row.id)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={save} className="fcc-card">
        <div className="inv-grid">
          <Field label="Fund">
            <select className="fm-form-input" value={form.fundId} onChange={(event) => setForm({ ...form, fundId: event.target.value })} required>
              <option value="">Select</option>
              {funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.fundCode} — {fund.fundName}</option>)}
            </select>
          </Field>
          <Field label="Folio number"><input className="fm-form-input" value={form.folioNumber} onChange={(event) => setForm({ ...form, folioNumber: event.target.value })} required /></Field>
          <Field label="Opened"><input className="fm-form-input" type="date" value={form.openedDate} onChange={(event) => setForm({ ...form, openedDate: event.target.value })} required /></Field>
          <Field label="Additional holder">
            <select className="fm-form-input" value={form.jointInvestorId} onChange={(event) => setForm({ ...form, jointInvestorId: event.target.value })}>
              <option value="">Sole holder</option>
              {investors.filter((row) => row.id !== investor.id).map((row) => (
                <option key={row.id} value={row.id}>{row.investorNumber} — {row.legalName}</option>
              ))}
            </select>
          </Field>
        </div>
        {message ? <p className="inv-error">{message}</p> : null}
        <button type="submit" className="fm-btn fm-btn-primary">Open folio</button>
      </form>
    </section>
  );
}

function FolioDetail({ folio, investors, onAsOfChange, onRefreshBalance, onHolderAdded }) {
  const { detail, balance, ledger, eventTypes } = folio;
  const [holderId, setHolderId] = useState('');
  const [message, setMessage] = useState('');

  const addHolder = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await cisInvestorService.addHolder(detail.id, { investorId: Number(holderId), effectiveFrom: detail.openedDate });
      setHolderId('');
      onHolderAdded();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section>
      <dl className="fcc-profile">
        <div><dt>Folio</dt><dd>{detail.folioNumber}</dd></div>
        <div><dt>Fund</dt><dd>{detail.fundCode} — {detail.fundName}</dd></div>
        <div><dt>Status</dt><dd>{detail.status}</dd></div>
        <div><dt>Opened</dt><dd>{detail.openedDate}</dd></div>
        <div><dt>Units as of {balance.asOfDate}</dt><dd>{balance.units}</dd></div>
      </dl>
      <form className="fcc-asof" onSubmit={onRefreshBalance}>
        <label>
          As of date
          <input className="fm-form-input" type="date" value={folio.asOfDate || ''} onChange={(event) => onAsOfChange(event.target.value)} />
        </label>
        <button type="submit" className="fm-btn fm-btn-secondary">Show balance</button>
      </form>
      <h3 className="fcc-block__title">Holders</h3>
      <table className="inv-table">
        <thead><tr><th>Investor</th><th>Sequence</th><th>From</th><th>To</th></tr></thead>
        <tbody>
          {(detail.holders || []).map((holder) => (
            <tr key={holder.id}>
              <td>{holder.investorNumber} — {holder.legalName}</td>
              <td>{holder.holderSequence}</td>
              <td>{holder.effectiveFrom}</td>
              <td>{holder.effectiveTo || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={addHolder} className="fcc-card">
        <Field label="Add holder">
          <select className="fm-form-input" value={holderId} onChange={(event) => setHolderId(event.target.value)} required>
            <option value="">Select investor</option>
            {investors.map((row) => <option key={row.id} value={row.id}>{row.investorNumber} — {row.legalName}</option>)}
          </select>
        </Field>
        {message ? <p className="inv-error">{message}</p> : null}
        <button type="submit" className="fm-btn fm-btn-secondary">Add holder</button>
      </form>
      <h3 className="fcc-block__title">Unit ledger</h3>
      {eventTypes.length === 0 ? <p className="fcc-empty">No ledger event types have been configured.</p> : null}
      {ledger.length === 0 ? <p className="fcc-empty">No unit movements have been posted.</p> : (
        <table className="inv-table">
          <thead><tr><th>Dealing date</th><th>Event</th><th>Units</th><th>Status</th></tr></thead>
          <tbody>
            {ledger.map((entry) => (
              <tr key={entry.id}><td>{entry.dealingDate}</td><td>{entry.eventName}</td><td>{entry.units}</td><td>{entry.status}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default InvestorWorkspace;
