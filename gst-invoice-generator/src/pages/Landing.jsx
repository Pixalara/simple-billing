import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Business segment selection state
  const [activeSegment, setActiveSegment] = useState('saas');

  // Pricing state
  const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' or 'yearly'

  // FAQ accordion state
  const [faqActiveIndex, setFaqActiveIndex] = useState(null);

  // Interactive Invoice Builder state
  const [simItems, setSimItems] = useState([
    { id: 1, name: 'Premium Cloud SaaS', qty: 1, rate: 4999 },
    { id: 2, name: 'Setup & Onboarding', qty: 1, rate: 8500 }
  ]);
  const [clientState, setClientState] = useState('Maharashtra'); // Maharashtra = Intra-state, Karnataka = Inter-state, US = Export
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Scroll handler for sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Invoice calculations
  const subtotal = simItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const cgst = clientState === 'Maharashtra' ? Math.round(subtotal * 0.09) : 0;
  const sgst = clientState === 'Maharashtra' ? Math.round(subtotal * 0.09) : 0;
  const igst = clientState === 'Karnataka' ? Math.round(subtotal * 0.18) : 0;
  const total = subtotal + cgst + sgst + igst;

  const handleUpdateQty = (id, delta) => {
    setSimItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return { ...item, qty: newQty < 0 ? 0 : newQty };
      }
      return item;
    }));
  };

  const handleSimulateInvoice = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowSuccess(true);
    }, 1200);
  };

  const toggleFaq = (index) => {
    setFaqActiveIndex(prevIndex => prevIndex === index ? null : index);
  };

  const segments = {
    saas: {
      title: "Automate Recurring Billing & Subscriptions",
      intro: "Pixalara runs your SaaS recurring invoicing on autopilot. Handle seat-based billing, multi-currency conversions, and tax compliances with absolute ease.",
      features: [
        "Flexible billing intervals (monthly, quarterly, or custom cycles)",
        "Prorated calculations on mid-cycle subscription plan changes",
        "Automated collection workflows and dunning setups for cards",
        "Integrated self-serve customer portal for downloads"
      ],
      mockupItems: [
        { label: "Active Subscriptions", value: "1,248 Users" },
        { label: "MRR", value: "₹4,82,500" },
        { label: "LTV Average", value: "₹38,200" }
      ]
    },
    services: {
      title: "Streamlined Client Retainers & Milestones",
      intro: "For professional agencies, consultancies, and remote developers. Send customized invoices, track project sheets, and request partial advances.",
      features: [
        "Milestone billing templates with flexible installment options",
        "HSN/SAC tax category codes pre-integrated by default",
        "One-click time-log imports to draft invoices instantly",
        "Gentle automatic reminders for overdue payments"
      ],
      mockupItems: [
        { label: "Active Retainers", value: "48 Accounts" },
        { label: "Outstanding Fees", value: "₹1,85,000" },
        { label: "Average Pay Days", value: "12 Days" }
      ]
    },
    retail: {
      title: "High-Volume Checkout & Store Invoicing",
      intro: "Perfect for retail chains and online checkout flows. Generate hundreds of state-wise compliant GST invoices per minute with instant thermal print files.",
      features: [
        "Instant transaction sync on API order checkout",
        "Automated CGST, SGST, IGST routing by shipping address",
        "Custom fields for E-Way Bills and transporter details",
        "Consolidated reports optimized for monthly GST filing"
      ],
      mockupItems: [
        { label: "Checkout Invoices", value: "18,490 Drafted" },
        { label: "State Routes Active", value: "28 States" },
        { label: "HSN Code Catalog", value: "15,000+ Items" }
      ]
    }
  };

  const faqs = [
    {
      q: "Is Pixalara Smart Billing compliant with Indian GST tax laws?",
      a: "Yes. Pixalara dynamically calculates CGST, SGST, and IGST based on the seller and buyer locations. It includes support for HSN/SAC codes, reverse charge mechanisms, and outputs GST-ready sales reports suitable for direct filing."
    },
    {
      q: "Can I manage recurring subscriptions and SaaS billing tiers?",
      a: "Absolutely. Pixalara supports monthly, yearly, and custom subscription cycles. It handles automated recurring invoices and sends payment receipts directly to customers once transactions succeed."
    },
    {
      q: "What is the difference between intra-state and inter-state tax routing?",
      a: "If your customer is located in the same state as your business (e.g. Maharashtra to Maharashtra), Pixalara automatically applies CGST (9%) and SGST (9%). If the customer is in a different state (e.g., Maharashtra to Karnataka), it routes the tax as IGST (18%)."
    },
    {
      q: "Is there a customer self-serve billing portal?",
      a: "Yes. Customers receive access to a secure, private dashboard where they can view outstanding payments, download previous invoice PDFs, update their GSTIN registration details, and manage active subscription tiers."
    },
    {
      q: "Can I try Pixalara Smart Billing for free?",
      a: "Yes. Our Starter plan is free forever and lets you generate up to 5 professional invoices per month with basic template layouts. You can upgrade to our Pro plan anytime for unlimited invoices and custom branding."
    }
  ];

  return (
    <div className="landing-container">
      {/* Background glow effects */}
      <div className="glow-bg glow-top-left"></div>
      <div className="glow-bg glow-bottom-right"></div>
      <div className="glow-bg glow-center"></div>

      {/* Sticky Header */}
      <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="landing-logo">
          <div className="logo-icon-wrapper">P</div>
          <span>Pixalara Billing</span>
        </Link>

        <div className="landing-nav-links">
          <a href="#solutions" className="landing-nav-link">Solutions</a>
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#pricing" className="landing-nav-link">Pricing</a>
          <a href="#faqs" className="landing-nav-link">FAQs</a>
        </div>

        <div className="landing-nav-actions">
          <Link to="/login" className="btn-login">Log In</Link>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* Mobile menu button toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <div className="mobile-nav-menu">
            <a href="#solutions" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
            <a href="#features" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faqs" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>FAQs</a>
            <div className="mobile-nav-actions">
              <Link to="/login" className="btn-login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} 
                className="btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            <span>Tax-Ready Billing Suite</span>
          </div>
          <h1>
            Complete invoicing & <br />
            <span>subscription engine</span>
          </h1>
          <p className="hero-desc">
            An elite billing software engineered for modern Indian enterprises, SaaS companies, and service agencies. 
            Automate tax calculations, generate professional receipts, and track receivables on autopilot.
          </p>
          <div className="hero-actions">
            <button onClick={() => navigate('/login')} className="btn-primary">
              Start Free Trial
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <a href="#features" className="btn-secondary">
              Explore Platform
            </a>
          </div>
        </div>

        {/* Interactive Live Invoice Builder widget */}
        <div className="hero-visual">
          <div className="invoice-simulator-card">
            {showSuccess && (
              <div className="success-download-alert">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <h4>Invoice Compiled</h4>
                <p>Tax distributions updated and invoice ledger locked successfully.</p>
                <button 
                  onClick={() => setShowSuccess(false)}
                  className="btn-primary" 
                  style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  Edit Invoice Again
                </button>
              </div>
            )}

            <div className="simulator-header">
              <div className="sim-logo">
                <div className="sim-logo-dot"></div>
                <span>Pixalara Invoice</span>
              </div>
              <div className="sim-badge-paid">TAX COMPLIANT</div>
            </div>

            <div className="simulator-meta">
              <div className="meta-field">
                <label>Bill To Client</label>
                <span>Acme Corporation Ltd</span>
              </div>
              <div className="meta-field">
                <label>Customer State</label>
                <select 
                  value={clientState} 
                  onChange={(e) => setClientState(e.target.value)}
                  disabled={showSuccess}
                >
                  <option value="Maharashtra">Maharashtra (Intra-state)</option>
                  <option value="Karnataka">Karnataka (Inter-state)</option>
                  <option value="US">Outside India (Export 0%)</option>
                </select>
              </div>
            </div>

            <div className="simulator-items">
              <div className="sim-item-header">
                <span>Description</span>
                <span>Qty</span>
                <span style={{ textAlign: 'right', paddingRight: '0.5rem' }}>Total</span>
              </div>
              {simItems.map((item) => (
                <div key={item.id} className="sim-item-row">
                  <span className="sim-item-name">{item.name}</span>
                  <div className="sim-item-qty">
                    <button 
                      className="qty-btn"
                      onClick={() => handleUpdateQty(item.id, -1)}
                      disabled={showSuccess}
                    >
                      -
                    </button>
                    <span className="qty-val">{item.qty}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => handleUpdateQty(item.id, 1)}
                      disabled={showSuccess}
                    >
                      +
                    </button>
                  </div>
                  <span className="sim-item-total">₹{(item.qty * item.rate).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="sim-totals-box">
              <div className="sim-total-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              
              {clientState === 'Maharashtra' && (
                <>
                  <div className="sim-total-row">
                    <span>CGST (9%)</span>
                    <span>₹{cgst.toLocaleString()}</span>
                  </div>
                  <div className="sim-total-row">
                    <span>SGST (9%)</span>
                    <span>₹{sgst.toLocaleString()}</span>
                  </div>
                </>
              )}

              {clientState === 'Karnataka' && (
                <div className="sim-total-row">
                  <span>IGST (18%)</span>
                  <span>₹{igst.toLocaleString()}</span>
                </div>
              )}

              {clientState === 'US' && (
                <div className="sim-total-row">
                  <span>Export Tax (0%)</span>
                  <span>₹0</span>
                </div>
              )}

              <div className="sim-total-row grand-total">
                <span>Grand Total</span>
                <span className="total-amount">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleSimulateInvoice} 
              className="sim-action-btn"
              disabled={isGenerating || showSuccess}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Compiling PDF Invoice...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Lock & Generate Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Business segment categories */}
      <section id="solutions" className="segments-section">
        <div className="section-header">
          <h2>Engineered for every business model</h2>
          <p>
            Whether you bill clients for recurring SaaS services, milestone hours, or point-of-sale retail checkouts, 
            Pixalara adapts perfectly.
          </p>
        </div>

        <div className="segment-tabs-container">
          <button 
            className={`segment-tab-btn ${activeSegment === 'saas' ? 'active' : ''}`}
            onClick={() => setActiveSegment('saas')}
          >
            SaaS & Subscriptions
          </button>
          <button 
            className={`segment-tab-btn ${activeSegment === 'services' ? 'active' : ''}`}
            onClick={() => setActiveSegment('services')}
          >
            Services & Agencies
          </button>
          <button 
            className={`segment-tab-btn ${activeSegment === 'retail' ? 'active' : ''}`}
            onClick={() => setActiveSegment('retail')}
          >
            Retail & Checkout
          </button>
        </div>

        <div className="segment-display-panel">
          <div className="segment-details">
            <h3>{segments[activeSegment].title}</h3>
            <p className="segment-intro">{segments[activeSegment].intro}</p>
            <ul className="segment-feature-list">
              {segments[activeSegment].features.map((feature, idx) => (
                <li key={idx} className="segment-feature-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="segment-mockup">
            <div className="mockup-header-bar">
              <div className="mockup-dot"></div>
              <div className="mockup-dot"></div>
              <div className="mockup-dot"></div>
            </div>
            <div className="mockup-content-skeleton">
              <div className="skeleton-line title-line"></div>
              <div className="skeleton-line w-90"></div>
              <div className="skeleton-line w-75"></div>
              <div className="skeleton-line w-60"></div>
              
              <div className="skeleton-grid">
                {segments[activeSegment].mockupItems.map((item, idx) => (
                  <div key={idx} className="skeleton-block">
                    <div className="skeleton-small-line w-70"></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                      {item.value}
                    </span>
                    <div className="skeleton-small-line"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Engineered with elite core utilities</h2>
          <p>
            Advanced modules built to accelerate invoices, balance customer ledgers, and secure records.
          </p>
        </div>

        <div className="bento-grid">
          {/* GST Engine card (col-span-2) */}
          <div className="bento-card col-span-2">
            <div className="card-top">
              <div className="feature-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>Automated Indian GST Compliance</h3>
              <p>
                Dynamic location checking maps tax values (CGST, SGST, IGST) automatically. 
                Built-in SAC/HSN catalog indexes allow quick product classification.
              </p>
            </div>
            <div className="card-visual-illustration">
              <div className="compliance-visual">
                <div className="comp-badge-row">
                  <span>Acme Sales (Mumbai &rarr; Pune)</span>
                  <span className="comp-tag">CGST (9%) + SGST (9%)</span>
                </div>
                <div className="comp-badge-row">
                  <span>Acme Sales (Mumbai &rarr; Bengaluru)</span>
                  <span className="comp-tag">IGST (18%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Analytics Card */}
          <div className="bento-card">
            <div className="card-top">
              <div className="feature-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                  <path d="M3 3v18h18"></path>
                </svg>
              </div>
              <h3>Real-Time Receivables</h3>
              <p>
                Track sales, outstanding balances, and GST collected in real-time.
              </p>
            </div>
            <div className="card-visual-illustration">
              <div className="analytics-chart-mockup">
                <div className="chart-bar" style={{ height: '35%' }}></div>
                <div className="chart-bar" style={{ height: '65%' }}></div>
                <div className="chart-bar" style={{ height: '48%' }}></div>
                <div className="chart-bar" style={{ height: '85%' }}></div>
                <div className="chart-bar" style={{ height: '55%' }}></div>
              </div>
            </div>
          </div>

          {/* Recurring Billing Card */}
          <div className="bento-card">
            <div className="card-top">
              <div className="feature-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
              </div>
              <h3>Subscription Engine</h3>
              <p>
                Process weekly, monthly, and yearly cycles. Auto-generate subsequent invoices.
              </p>
            </div>
          </div>

          {/* Customer Portal Card (col-span-2) */}
          <div className="bento-card col-span-2">
            <div className="card-top">
              <div className="feature-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>Private Customer Portal</h3>
              <p>
                Give clients self-serve access to view paid history, obtain PDF receipts, 
                and modify billing details. Saves administrative time.
              </p>
            </div>
            <div className="card-visual-illustration">
              <div className="portal-visual">
                <div className="portal-sidebar-skeleton">
                  <div className="skeleton-line w-90"></div>
                  <div className="skeleton-line w-75"></div>
                  <div className="skeleton-line w-60"></div>
                </div>
                <div className="portal-main-skeleton">
                  <div className="skeleton-line title-line" style={{ height: '10px' }}></div>
                  <div className="skeleton-line w-90"></div>
                  <div className="skeleton-line w-75"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <h2>Simple, transparent plans</h2>
          <p>
            Choose a plan tailored to your transaction volumes. All plans include automated GST compliance features.
          </p>
        </div>

        <div className="pricing-switch-container">
          <span 
            className={`pricing-switch-label ${billingInterval === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly
          </span>
          <div 
            className={`pricing-switch ${billingInterval === 'yearly' ? 'yearly' : ''}`}
            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          ></div>
          <span 
            className={`pricing-switch-label ${billingInterval === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingInterval('yearly')}
          >
            Yearly
          </span>
          <span className="discount-badge">Save 20%</span>
        </div>

        <div className="pricing-grid">
          {/* Starter Plan */}
          <div className="pricing-card">
            <div className="pricing-card-header">
              <h3 className="plan-name">Starter Plan</h3>
              <p className="plan-description">For freelancers and sole proprietors starting with local billing.</p>
            </div>
            <div className="plan-price-box">
              <span className="price-currency">₹</span>
              <span className="price-amount">0</span>
              <span className="price-period">/ month</span>
            </div>
            <ul className="plan-features-list">
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>5 invoices / month</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Standard templates</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Manual GST routing</span>
              </li>
              <li className="plan-feature-line disabled">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Custom client portal</span>
              </li>
              <li className="plan-feature-line disabled">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Unlimited users</span>
              </li>
            </ul>
            <button onClick={() => navigate('/login')} className="btn-secondary">
              Get Started
            </button>
          </div>

          {/* Growth Plan (Featured) */}
          <div className="pricing-card featured">
            <div className="featured-tag">Most Popular</div>
            <div className="pricing-card-header">
              <h3 className="plan-name">Pro Growth</h3>
              <p className="plan-description">For expanding businesses requiring full automation and portals.</p>
            </div>
            <div className="plan-price-box">
              <span className="price-currency">₹</span>
              <span className="price-amount">{billingInterval === 'monthly' ? '99' : '79'}</span>
              <span className="price-period">/ month</span>
            </div>
            <ul className="plan-features-list">
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span><strong>Unlimited</strong> invoices & drafts</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Premium customizable layouts</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Automated GST Routing engine</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Secure Client billing portal</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>24/7 Priority support channel</span>
              </li>
            </ul>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Subscribe Now
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="pricing-card">
            <div className="pricing-card-header">
              <h3 className="plan-name">Enterprise Custom</h3>
              <p className="plan-description">For large organizations requiring customized reports and API keys.</p>
            </div>
            <div className="plan-price-box">
              <span className="price-amount" style={{ fontSize: '2.5rem' }}>Custom</span>
            </div>
            <ul className="plan-features-list">
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Everything in Pro Growth</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Multi-organization ledgers</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Automated E-Way bills & API keys</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Dedicated account manager</span>
              </li>
              <li className="plan-feature-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Custom SLAs & integrations</span>
              </li>
            </ul>
            <button onClick={() => navigate('/login')} className="btn-secondary">
              Contact Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faqs" className="faq-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Answers to common inquiries regarding tax rules, cycle invoicing, and client records.</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${faqActiveIndex === index ? 'active' : ''}`}
            >
              <button 
                className="faq-question-button" 
                onClick={() => toggleFaq(index)}
              >
                <span>{faq.q}</span>
                <div className="faq-toggle-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
              </button>
              <div className="faq-answer-panel">
                <p className="faq-answer-text">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sleek Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-branding">
            <Link to="/" className="landing-logo">
              <div className="logo-icon-wrapper">P</div>
              <span>Pixalara Billing</span>
            </Link>
            <p className="footer-desc">
              State-of-the-art billing, ledger tracking, and automated GST routing infrastructure designed for modern Indian enterprises.
            </p>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="#solutions" className="footer-link">Solutions</a></li>
              <li><a href="#features" className="footer-link">Core Features</a></li>
              <li><a href="#pricing" className="footer-link">Pricing Models</a></li>
              <li><Link to="/login" className="footer-link">Log In</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Solutions</h4>
            <ul className="footer-links">
              <li><a href="#solutions" className="footer-link">SaaS Subscriptions</a></li>
              <li><a href="#solutions" className="footer-link">Agencies & Services</a></li>
              <li><a href="#solutions" className="footer-link">High-Volume Retail</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Compliance</h4>
            <ul className="footer-links">
              <li><a href="#features" className="footer-link">GST Taxes Engine</a></li>
              <li><a href="#features" className="footer-link">HSN/SAC Codes</a></li>
              <li><a href="#features" className="footer-link">E-Way Bills</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Corporate</h4>
            <ul className="footer-links">
              <li><span className="footer-link" style={{ cursor: 'default' }}>About Us</span></li>
              <li><span className="footer-link" style={{ cursor: 'default' }}>Privacy Policy</span></li>
              <li><span className="footer-link" style={{ cursor: 'default' }}>Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Pixalara Smart Billing. All rights reserved.</span>
          <div className="footer-bottom-links">
            <span className="footer-bottom-link" style={{ cursor: 'default' }}>Tax Rules Compliant</span>
            <span className="footer-bottom-link" style={{ cursor: 'default' }}>Secure Data Encrypted</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
