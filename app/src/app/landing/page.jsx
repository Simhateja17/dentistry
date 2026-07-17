import '../landing-fonts.css';
import './landing.css';

export const metadata = {
  title: 'Dental PMS — Run your practice, not your paperwork',
  description:
    'The all-in-one practice management system for modern dental clinics: charting, scheduling, billing, and lab tracking in one calm workspace.',
};

/* Small inline icon set (stroke) so the page has zero external asset requests. */
const Icon = {
  tooth: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.5c-1.6-1.7-3.4-2.3-5-1.6C5 4.7 4 6.9 4 9.4c0 2.4.6 3.8 1.2 6.2.4 1.7.6 3.9 1.8 4.3 1.1.3 1.5-1.4 1.9-3 .4-1.5.7-2.9 3.1-2.9s2.7 1.4 3.1 2.9c.4 1.6.8 3.3 1.9 3 1.2-.4 1.4-2.6 1.8-4.3.6-2.4 1.2-3.8 1.2-6.2 0-2.5-1-4.7-3-5.5-1.6-.7-3.4-.1-5 1.6Z" />
    </svg>
  ),
  calendar: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4M8 13.5h3M8 17h6" />
    </svg>
  ),
  billing: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5h9l4 4v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" /><path d="M14 2.5V7h4M8.5 12h7M8.5 16h5" />
    </svg>
  ),
  flask: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.5h6M10 2.5v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9.5v-6" /><path d="M7.5 14h9" />
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5 4.5 5.5v5.2c0 4.6 3.1 8.4 7.5 10.3 4.4-1.9 7.5-5.7 7.5-10.3V5.5L12 2.5Z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </svg>
  ),
  chart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v15a1 1 0 0 0 1 1h15" /><path d="M8 15l3.2-3.6 2.6 2.2L19 8" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  ),
  arrow: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

const features = [
  { ic: Icon.tooth, t: 'Interactive charting', d: 'A full odontogram at your fingertips. Record conditions, treatments, and history per tooth in a couple of taps — no more paper charts.' },
  { ic: Icon.calendar, t: 'Smart scheduling', d: 'See the whole day at a glance, book recalls, and cut no-shows with automatic reminders your front desk never has to think about.' },
  { ic: Icon.billing, t: 'Billing & receipts', d: 'Generate invoices, track payments, and export polished PDF receipts in seconds — treatment plans flow straight into billing.' },
  { ic: Icon.flask, t: 'Lab case tracking', d: 'Follow every crown and denture from impression to fit. Know exactly which cases are due back and which patients are waiting.' },
  { ic: Icon.chart, t: 'Practice insights', d: 'Live dashboards for revenue, appointments, and outstanding dues so you always know how the practice is really performing.' },
  { ic: Icon.shield, t: 'Private & offline-first', d: 'Patient records stay on your device and keep working without internet. Your data is yours — encrypted and never sold.' },
];

const steps = [
  { t: 'Set up in minutes', d: 'A guided wizard configures your clinic, staff, and services — no IT team required.' },
  { t: 'See every patient', d: 'Charts, visits, plans, and payments live together on one calm patient record.' },
  { t: 'Run the day', d: 'Book, treat, invoice, and follow up without ever switching apps or losing context.' },
];

const stats = [
  { n: <><span className="accent">2.5</span>hrs</>, l: 'saved per clinician, every single day' },
  { n: <>68<span className="accent">%</span></>, l: 'fewer missed appointments with auto-recall' },
  { n: <>100<span className="accent">%</span></>, l: 'of records available offline, always' },
  { n: <><span className="accent">4.9</span>/5</>, l: 'average rating from practising dentists' },
];

export default function LandingPage() {
  return (
    <div className="lp">
      {/* NAV */}
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <a className="lp-brand" href="#">
            <span className="lp-logo">{Icon.tooth}</span>
            Dental PMS
          </a>
          <nav className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="lp-nav-cta">
            <a className="lp-signin" href="/">Sign in</a>
            <a className="lp-btn lp-btn-primary" href="/">Get started {Icon.arrow}</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-copy">
            <span className="lp-hero-eyebrow">
              <span className="dot" />
              <span className="lp-eyebrow">Practice management, reimagined</span>
            </span>
            <h1 className="lp-h1">
              Run your practice,<br />not your <span className="accent">paperwork</span>.
            </h1>
            <p className="lp-lead">
              Dental PMS brings charting, scheduling, billing, and lab tracking into one
              calm workspace — so your team spends its day on patients, not admin.
            </p>
            <div className="lp-hero-actions">
              <a className="lp-btn lp-btn-primary lp-btn-lg" href="/">Start free {Icon.arrow}</a>
              <a className="lp-btn lp-btn-ghost lp-btn-lg" href="#workflow">See how it works</a>
            </div>
            <div className="lp-hero-proof">
              <div className="lp-proof-avatars">
                <span>SK</span><span>MR</span><span>AJ</span><span>PL</span>
              </div>
              <div className="lp-proof-text">
                <span className="lp-stars">★★★★★</span><br />
                Trusted by <b>1,200+ clinics</b> across the country
              </div>
            </div>
          </div>

          {/* Hero product panel */}
          <div className="lp-hero-panel" aria-hidden="true">
            <div className="lp-panel-bar">
              <i /><i /><i /><span className="url">app · today's overview</span>
            </div>
            <div className="lp-panel-body">
              <div className="lp-mini">
                <div className="k">Revenue today</div>
                <div className="v">₹48.2k<small>+12%</small></div>
                <div className="lp-bars">
                  <span style={{ height: '40%' }} /><span style={{ height: '62%' }} />
                  <span style={{ height: '52%' }} /><span style={{ height: '78%' }} />
                  <span style={{ height: '68%' }} /><span style={{ height: '92%' }} />
                </div>
              </div>
              <div className="lp-mini">
                <div className="k">Appointments</div>
                <div className="v">18</div>
                <div className="lp-rowline"><span className="av" /><span className="nm">R. Nair</span><span className="pill">Done</span></div>
                <div className="lp-rowline"><span className="av" /><span className="nm">S. Iyer</span><span className="tm">2:30</span></div>
                <div className="lp-rowline"><span className="av" /><span className="nm">A. Menon</span><span className="tm">3:15</span></div>
              </div>
              <div className="lp-mini wide">
                <div className="k">Lab cases due</div>
                <div className="lp-rowline"><span className="av" /><span className="nm">Zirconia crown · #26</span><span className="pill">Ready</span></div>
                <div className="lp-rowline"><span className="av" /><span className="nm">PFM bridge · #14–16</span><span className="tm">Tomorrow</span></div>
              </div>
            </div>
            <div className="lp-float">
              <span className="ic">{Icon.check}</span>
              <div>
                <div className="t1">Invoice sent</div>
                <div className="t2">Receipt #10428 · ₹3,200</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="lp-strip">
        <div className="lp-container">
          <p className="lp-strip-label">Powering modern dental practices everywhere</p>
          <div className="lp-strip-logos">
            <span>BrightSmile</span><span>OraCare</span><span>DentOne</span>
            <span>PearlDental</span><span>Northgate</span><span>Cliniva</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <div className="lp-head-block center">
            <span className="lp-eyebrow">Everything in one place</span>
            <h2 className="lp-h2">One workspace for the whole practice</h2>
            <p className="lp-subtext">
              Stop stitching together spreadsheets, paper charts, and half a dozen apps.
              Dental PMS covers the full clinical and front-desk workflow in a single, quiet interface.
            </p>
          </div>
          <div className="lp-features">
            {features.map((f) => (
              <article className="lp-card" key={f.t}>
                <div className="lp-card-ic">{f.ic}</div>
                <h3>{f.t}</h3>
                <p className="lp-cardtext">{f.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW SPLIT */}
      <section className="lp-section" id="workflow" style={{ paddingTop: 0 }}>
        <div className="lp-container lp-split">
          <div>
            <span className="lp-eyebrow" style={{ display: 'block', marginBottom: 16 }}>How it works</span>
            <h2 className="lp-h2">From first visit to final invoice</h2>
            <p className="lp-subtext" style={{ marginTop: 18 }}>
              A patient's whole journey lives on one record — so nothing slips between the
              chart, the chair, and the front desk.
            </p>
            <div className="lp-steps">
              {steps.map((s, i) => (
                <div className="lp-step" key={s.t}>
                  <span className="num">{i + 1}</span>
                  <div>
                    <h3>{s.t}</h3>
                    <p className="lp-cardtext">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-split-visual" aria-hidden="true">
            <div className="lp-mini">
              <div className="k">Patient record · S. Iyer</div>
              <div className="v" style={{ fontSize: 20 }}>Molar restoration plan</div>
            </div>
            <div className="lp-mini">
              <div className="lp-rowline"><span className="av" /><span className="nm">Chart · #36 composite</span><span className="pill">Planned</span></div>
              <div className="lp-rowline"><span className="av" /><span className="nm">Visit · scaling</span><span className="pill">Done</span></div>
              <div className="lp-rowline"><span className="av" /><span className="nm">Plan · 3 items</span><span className="tm">₹6,400</span></div>
            </div>
            <div className="lp-mini">
              <div className="k">Next recall</div>
              <div className="v" style={{ fontSize: 22 }}>6 months <small>auto</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-container">
          <div className="lp-stats">
            {stats.map((s, i) => (
              <div className="lp-stat" key={i}>
                <div className="n">{s.n}</div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-section" id="pricing" style={{ paddingTop: 0 }}>
        <div className="lp-container">
          <div className="lp-cta">
            <h2 className="lp-h2">Ready to give your practice its calm back?</h2>
            <p className="lp-lead">
              Set up your clinic in minutes and see the difference on day one. No credit card,
              no lock-in, and your data stays yours.
            </p>
            <div className="lp-cta-actions">
              <a className="lp-btn lp-btn-primary lp-btn-lg" href="/">Get started free {Icon.arrow}</a>
              <a className="lp-btn lp-btn-ghost lp-btn-lg" href="#contact">Book a demo</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer" id="contact">
        <div className="lp-container">
          <div className="lp-foot-grid">
            <div className="lp-foot-about">
              <a className="lp-brand" href="#">
                <span className="lp-logo">{Icon.tooth}</span>
                Dental PMS
              </a>
              <p className="lp-cardtext">
                The all-in-one practice management system for modern dental clinics.
                Built to be calm, private, and fast.
              </p>
            </div>
            <div className="lp-foot-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#workflow">Workflow</a>
              <a href="#pricing">Pricing</a>
              <a href="/">Sign in</a>
            </div>
            <div className="lp-foot-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="lp-foot-col">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
              <a href="#">Status</a>
            </div>
          </div>
          <div className="lp-foot-bottom">
            <span>© 2026 Dental PMS. All rights reserved.</span>
            <span>Made for dentists who'd rather be treating patients.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
