import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-navbar">
        <Link to="/" className="landing-logo">
          <img src="/billing-favicon.svg" alt="Pixalara Bill Logo" />
          Pixalara Bill
        </Link>
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#pricing" className="landing-nav-link">Pricing</a>
          <Link to="/login" className="landing-nav-link">Log in</Link>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge">New: AI-Powered Insights Available</div>
        <h1>Empower your business to generate & track every transaction.</h1>
        <p>
          The most affordable, complete billing software designed for modern businesses. 
          Manage invoices, receipts, and customers seamlessly in one place.
        </p>
        <div className="hero-actions">
          <button onClick={() => navigate('/login')} className="btn-primary">
            Start Billing Now
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <a href="#features" className="btn-secondary">
            Explore Features
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <div className="section-header">
          <h2>Everything you need to grow</h2>
          <p>Powerful features that simplify your daily operations.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>Smart Invoicing</h3>
            <p>Generate professional GST invoices and receipts in seconds. Customize with your branding and send directly to clients.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>Customer Management</h3>
            <p>Maintain a centralized database of all your clients. Auto-fill details during billing to save time and reduce errors.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
              </svg>
            </div>
            <h3>Track Transactions</h3>
            <p>Monitor your cash flow with real-time insights. Track every payment, outstanding balance, and overall revenue easily.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3>Receipt Generation</h3>
            <p>Generate clean, professional payment receipts for subscription and SaaS models instantly with accurate calculations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
                <path d="M3 3v18h18"/>
              </svg>
            </div>
            <h3>Revenue Analytics</h3>
            <p>Understand your business health with basic visual reporting, monthly sales metrics, and transaction trend tracking.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="landing-pricing">
        <div className="section-header">
          <h2>Simple, transparent pricing</h2>
          <p>No hidden fees. No surprise charges. Just one plan for everything.</p>
        </div>
        <div className="pricing-card">
          <div className="pricing-badge">Most Affordable</div>
          <h3>Pro Plan</h3>
          <div className="pricing-amount">
            <span className="pricing-currency">₹</span>99
          </div>
          <div className="pricing-period">per month</div>
          <div className="pricing-features">
            <div className="pricing-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Unlimited Invoices & Receipts</span>
            </div>
            <div className="pricing-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Unlimited Customers</span>
            </div>
            <div className="pricing-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Cloud Backup & Sync</span>
            </div>
            <div className="pricing-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>24/7 Priority Support</span>
            </div>
          </div>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">Pixalara Bill</div>
          <div className="footer-text">
            © {new Date().getFullYear()} Pixalara Bill. Empowering businesses worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
}
