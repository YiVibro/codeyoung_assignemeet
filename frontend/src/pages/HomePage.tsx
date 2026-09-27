import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="pill">
            <span className="pill-dot" />
            1:1 learning, built around your child
          </div>

          <h1>
            Give your child
            <span> a head start </span>
            in the digital world.
          </h1>

          <p className="hero-text">
            Book a free trial class with a mentor and find a
            comfortable time that works for your family.
          </p>

          <div className="hero-actions">
            <Link to="/book" className="hero-button">
              Book a FREE trial <span>→</span>
            </Link>
            <a href="#how-it-works" className="text-button">
              See how it works <span>↓</span>
            </a>
          </div>

          <div className="trust-row">
            <div className="avatar-stack" aria-hidden="true">
              <span>👧</span>
              <span>👦</span>
              <span>🧒</span>
            </div>
            <div>
              <strong>Made for curious young minds</strong>
              <span>Simple booking • Personal mentor • Live class</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Learning illustration">
          <div className="sun-shape" />
          <div className="hero-card hero-card-main">
            <div className="code-window">
              <div className="window-dots"><i /><i /><i /></div>
              <div className="code-line short" />
              <div className="code-line" />
              <div className="code-line accent" />
              <div className="code-line medium" />
              <div className="code-line" />
            </div>
            <div className="learning-badge">
              <span>✦</span>
              Learning time
              <strong>60 min</strong>
            </div>
          </div>

          <div className="floating-card mentor-float">
            <div className="mini-avatar">👨‍🏫</div>
            <div>
              <small>Your mentor</small>
              <strong>Ready to teach</strong>
            </div>
            <span className="online-dot" />
          </div>

          <div className="floating-card globe-float">
            <span className="globe-icon">🌎</span>
            <div>
              <strong>Your time zone</strong>
              <small>Automatically handled</small>
            </div>
          </div>

          <div className="subject-bubble bubble-one">Code</div>
          <div className="subject-bubble bubble-two">AI</div>
          <div className="subject-bubble bubble-three">Robotics</div>
        </div>
      </section>

      <section className="brand-strip">
        <span>Designed around real family schedules</span>
        <div>
          <strong>1:1</strong> mentor matching
          <strong>•</strong>
          local-time booking
          <strong>•</strong>
          live trial class
        </div>
      </section>

      <section className="feature-section">
        <div className="section-intro">
          <p className="eyebrow">WHY TRY IT?</p>
          <h2>A first class that feels easy from the start.</h2>
          <p>
            We keep the booking experience simple while the system
            takes care of mentor availability and time-zone conversion.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card feature-teal">
            <span className="feature-icon">🎯</span>
            <h3>Personal attention</h3>
            <p>
              A one-to-one trial class with a mentor assigned to your
              selected time.
            </p>
          </article>

          <article className="feature-card feature-yellow">
            <span className="feature-icon">🌍</span>
            <h3>Your local time</h3>
            <p>
              Pick a comfortable time in your own timezone. We handle
              the conversion behind the scenes.
            </p>
          </article>

          <article className="feature-card feature-purple">
            <span className="feature-icon">⚡</span>
            <h3>Quick to book</h3>
            <p>
              Choose a date, find a slot, enter your details and get a
              class link.
            </p>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="steps-section">
        <div className="section-intro centered">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>Three simple steps to get started.</h2>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <div className="step-number-large">01</div>
            <span className="step-icon">🗓️</span>
            <h3>Choose your time</h3>
            <p>Select your timezone, date and the hours that suit your family.</p>
          </article>

          <article className="step-card">
            <div className="step-number-large">02</div>
            <span className="step-icon">🤝</span>
            <h3>Meet your mentor</h3>
            <p>We find an available mentor who can take the class at that time.</p>
          </article>

          <article className="step-card">
            <div className="step-number-large">03</div>
            <span className="step-icon">🚀</span>
            <h3>Join the trial</h3>
            <p>Get your class details and dummy live-class link instantly.</p>
          </article>
        </div>
      </section>

      <section className="timezone-section">
        <div className="timezone-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="timezone-core">🌐</div>
          <span className="timezone-chip chip-ny">New York</span>
          <span className="timezone-chip chip-london">London</span>
          <span className="timezone-chip chip-india">India</span>
        </div>

        <div className="timezone-copy">
          <p className="eyebrow">TIMEZONE SMART</p>
          <h2>You choose the time. We handle the clocks.</h2>
          <p>
            Parents can book in their own IANA timezone while mentors
            see the same class in their local timezone. Daylight-saving
            changes are handled by the booking engine.
          </p>
          <Link to="/book" className="secondary-button">
            Find a trial slot <span>→</span>
          </Link>
        </div>
      </section>

      <section className="final-cta">
        <div>
          <p className="eyebrow">READY WHEN YOU ARE</p>
          <h2>Let's find a great first class.</h2>
          <p>It only takes a few minutes to choose a time and book your trial.</p>
        </div>
        <Link to="/book" className="hero-button">
          Book a FREE trial <span>→</span>
        </Link>
      </section>

      <footer className="home-footer">
        <div className="footer-brand">
          <span className="brand-mark">C</span>
          <strong>CodeYoung</strong>
        </div>
        <span>Trial Class Booking Experience</span>
      </footer>
    </main>
  );
}

export default HomePage;
