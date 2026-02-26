import React, { useState } from 'react';
import ClientSidebar from './ClientSidebar';
import ClientNavbar from './ClientNavbar';
import ClientDashboard from './ClientDashboard';
import MyPortfolio from './MyPortfolio';
import Statements from './Statements';
import ClientTransactions from './ClientTransactions';
import FundInformation from './FundInformation';
import ClientSettings from './ClientSettings';
import ClientSignupForm from './ClientSignupForm';
import ClientContactForm from './ClientContactForm';
import ClientEmploymentForm from './ClientEmploymentForm';
import ClientBankForm from './ClientBankForm';
import ClientAdditionalDetailsForm from './ClientAdditionalDetailsForm';
import ClientOtherProductsForm from './ClientOtherProductsForm';
import ClientDocumentUploadForm from './ClientDocumentUploadForm';
import ClientVideoVerificationForm from './ClientVideoVerificationForm';
import ClientSubmitForm from './ClientSubmitForm';
import './Styles/ClientPortal.css';

const ClientPortal = ({ user, onLogout }) => {
  const [showSignup, setShowSignup] = useState(true);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showEmploymentForm, setShowEmploymentForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showAdditionalForm, setShowAdditionalForm] = useState(false);
  const [showOtherProductsForm, setShowOtherProductsForm] = useState(false);
  const [showDocumentUploadForm, setShowDocumentUploadForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState(0);

  // Client portal menu items
  const clientMenuItems = [
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
      ),
      name: "Dashboard",
      subTopics: ["Dashboard"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
        </svg>
      ),
      name: "My Portfolio",
      subTopics: ["My Portfolio"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Statements",
      subTopics: ["Statements"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z"/>
          <path fillRule="evenodd" d="M14 4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8zm0 2H6v4h8V6z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Transactions",
      subTopics: ["Transactions"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Fund Information",
      subTopics: ["Fund Information"]
    },
    {
      icon: (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
        </svg>
      ),
      name: "Settings",
      subTopics: ["Settings"]
    }
  ];

  const handleSidebarSelect = (index, subTopics) => {
    setActiveSidebarItem(index);
    if (Array.isArray(subTopics) && subTopics.length > 0) {
      setActiveTab(subTopics[0]);
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    const sectionIndex = clientMenuItems.findIndex(
      (item) => item.subTopics && item.subTopics.includes(tabName)
    );
    if (sectionIndex >= 0) {
      setActiveSidebarItem(sectionIndex);
    }
  };

  // Tab component mappings
  const tabToComponent = {
    'Dashboard': <ClientDashboard />,
    'My Portfolio': <MyPortfolio />,
    'Statements': <Statements />,
    'Transactions': <ClientTransactions />,
    'Fund Information': <FundInformation />,
    'Settings': <ClientSettings user={user} />
  };

  const handleGetStarted = () => {
    setShowSignup(false);
    setShowPersonalForm(true);
  };

  const handlePersonalFormNext = (data) => {
    // Store personal details and proceed to contact form
    setFormData(prev => ({ ...prev, ...data }));
    setShowPersonalForm(false);
    setShowContactForm(true);
  };

  const handleContactFormNext = (data) => {
    // Store contact details and proceed to employment form
    setFormData(prev => ({ ...prev, ...data }));
    setShowContactForm(false);
    setShowEmploymentForm(true);
  };

  const handleContactFormPrevious = () => {
    // Go back to personal details form
    setShowContactForm(false);
    setShowPersonalForm(true);
  };

  const handleEmploymentFormNext = (data) => {
    // Store employment details and proceed to bank & fund details form
    setFormData(prev => ({ ...prev, ...data }));
    setShowEmploymentForm(false);
    setShowBankForm(true);
  };

  const handleEmploymentFormPrevious = () => {
    // Go back to contact details form
    setShowEmploymentForm(false);
    setShowContactForm(true);
  };

  const handleBankFormNext = (data) => {
    // Store bank & fund details and proceed to additional details verification
    setFormData(prev => ({ ...prev, ...data }));
    setShowBankForm(false);
    setShowAdditionalForm(true);
  };

  const handleBankFormPrevious = () => {
    // Go back to employment details form
    setShowBankForm(false);
    setShowEmploymentForm(true);
  };

  const handleAdditionalFormNext = (data) => {
    // Store additional details and proceed to other investment products / T&C form
    setFormData(prev => ({ ...prev, ...data }));
    setShowAdditionalForm(false);
    setShowOtherProductsForm(true);
  };

  const handleAdditionalFormPrevious = () => {
    // Go back to bank & fund details form
    setShowAdditionalForm(false);
    setShowBankForm(true);
  };

  const handleOtherProductsFormNext = (data) => {
    // Store other products & equity selections and proceed to document upload
    setFormData(prev => ({ ...prev, ...data }));
    setShowOtherProductsForm(false);
    setShowDocumentUploadForm(true);
  };

  const handleOtherProductsFormPrevious = () => {
    // Go back to additional details verification form
    setShowOtherProductsForm(false);
    setShowAdditionalForm(true);
  };

  const handleDocumentUploadNext = (data) => {
    // Store document upload details and proceed to video verification
    setFormData(prev => ({ ...prev, ...data }));
    setShowDocumentUploadForm(false);
    setShowVideoForm(true);
  };

  const handleDocumentUploadPrevious = () => {
    // Go back to other investment products / T&C form
    setShowDocumentUploadForm(false);
    setShowOtherProductsForm(true);
  };

  const handleVideoFormNext = (data) => {
    // Store video verification acknowledgement and proceed to final submit screen
    setFormData(prev => ({ ...prev, ...data }));
    setShowVideoForm(false);
    setShowSubmitForm(true);
  };

  const handleVideoFormPrevious = () => {
    // Go back to document upload form
    setShowVideoForm(false);
    setShowDocumentUploadForm(true);
  };

  const handleSubmitFormPrevious = () => {
    // Go back to video verification form
    setShowSubmitForm(false);
    setShowVideoForm(true);
  };

  const handleSubmitFormSubmit = () => {
    // Final submission: for now just log and go to main client portal
    console.log('Final client portal signup data:', formData);
    setShowSubmitForm(false);
    // TODO: send data to backend
  };

  // Show signup intro screen
  if (showSignup) {
    return (
      <div className="cp-intro-root">
        <div className="cp-intro-card">
          <div className="cp-intro-badge">Wealth Manager</div>
          <h1 className="cp-intro-title">Signup for this Product</h1>
          <p className="cp-intro-subtitle">
            Get secure, real-time access to your unit trust portfolios, performance,
            and statements in one modern client portal.
          </p>
          <button
            className="cp-intro-button"
            type="button"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // Show personal details form
  if (showPersonalForm) {
    return <ClientSignupForm onNext={handlePersonalFormNext} initialData={formData} />;
  }

  // Show contact details form
  if (showContactForm) {
    return (
      <ClientContactForm 
        onNext={handleContactFormNext} 
        onPrevious={handleContactFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show employment details form
  if (showEmploymentForm) {
    return (
      <ClientEmploymentForm 
        onNext={handleEmploymentFormNext} 
        onPrevious={handleEmploymentFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show bank & fund details form
  if (showBankForm) {
    return (
      <ClientBankForm
        onNext={handleBankFormNext}
        onPrevious={handleBankFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show additional details verification form
  if (showAdditionalForm) {
    return (
      <ClientAdditionalDetailsForm
        onNext={handleAdditionalFormNext}
        onPrevious={handleAdditionalFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show other investment products / T&C form
  if (showOtherProductsForm) {
    return (
      <ClientOtherProductsForm
        onNext={handleOtherProductsFormNext}
        onPrevious={handleOtherProductsFormPrevious}
        initialData={formData}
      />
    );
  }

  // Show document upload form
  if (showDocumentUploadForm) {
    return (
      <ClientDocumentUploadForm
        onNext={handleDocumentUploadNext}
        onPrevious={handleDocumentUploadPrevious}
        initialData={formData}
      />
    );
  }

  // Show video verification form
  if (showVideoForm) {
    return (
      <ClientVideoVerificationForm
        onNext={handleVideoFormNext}
        onPrevious={handleVideoFormPrevious}
      />
    );
  }

  // Show final submit confirmation form
  if (showSubmitForm) {
    return (
      <ClientSubmitForm
        onPrevious={handleSubmitFormPrevious}
        onSubmit={handleSubmitFormSubmit}
      />
    );
  }

  return (
    <div className="cp-root">
      <ClientSidebar
        menuItems={clientMenuItems}
        onSelect={handleSidebarSelect}
        activeIndex={activeSidebarItem}
        onLogout={onLogout}
        user={user}
      />
      <div className="cp-main">
        <ClientNavbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={user}
          onLogout={onLogout}
        />
        <div className="cp-content">
          {tabToComponent[activeTab] || (
            <div className="cp-not-found">
              <h3>Page Not Found</h3>
              <p>The requested page is not available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
