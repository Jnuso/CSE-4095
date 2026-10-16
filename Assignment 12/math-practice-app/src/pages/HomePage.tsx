import ActionLink from '../components/common/ActionLink'

export default function HomePage() {
  return (
    <div className="home-grid">
      <section className="introduction" aria-labelledby="welcome-title">
        <p className="eyebrow">A LITTLE PRACTICE, EVERY DAY</p>
        <h1 id="welcome-title" tabIndex={-1}>
          Big ideas start with <span>small steps.</span>
        </h1>
        <p className="introduction-copy">
          A friendly place to grow your math confidence. One little discovery at a time.
        </p>
        <div
          className="operation-marks"
          aria-label="Addition, subtraction, multiplication, and division"
        >
          <span aria-hidden="true">+</span>
          <span aria-hidden="true">−</span>
          <span aria-hidden="true">×</span>
          <span aria-hidden="true">÷</span>
        </div>
      </section>
      <section className="welcome-card" aria-labelledby="next-step-title">
        <span className="card-accent" aria-hidden="true">
          ✦
        </span>
        <p className="eyebrow">YOUR NEXT SMALL STEP</p>
        <h2 id="next-step-title">Hello, mathematician.</h2>
        <p>
          Ready for a little discovery? Find your practice space, explore your progress, or make
          yourself at home.
        </p>
        <div className="home-actions">
          <ActionLink to="/practice/setup">
            Start Practice <span aria-hidden="true">→</span>
          </ActionLink>
          <ActionLink to="/statistics" variant="secondary">
            View Statistics
          </ActionLink>
          <ActionLink to="/settings" variant="secondary">
            Settings
          </ActionLink>
        </div>
      </section>
    </div>
  )
}
