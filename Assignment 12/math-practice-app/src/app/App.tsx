import { useState } from 'react'
import './App.css'

export default function App() {
  const [hasSaidHello, setHasSaidHello] = useState(false)

  return (
    <main className="welcome">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          +
        </span>
        <span>Math Practice</span>
      </div>
      <div className="welcome-content">
        <section className="introduction" aria-labelledby="welcome-title">
          <p className="eyebrow">A LITTLE PRACTICE, EVERY DAY</p>
          <h1 id="welcome-title">
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
        <section className="hello-card" aria-labelledby="hello-title">
          <span className="card-accent" aria-hidden="true">
            ✦
          </span>
          <p className="eyebrow">YOUR FIRST SMALL STEP</p>
          <h2 id="hello-title">Hello, mathematician.</h2>
          <p>Your practice space is getting ready. Say hello to take the first step.</p>
          <button type="button" onClick={() => setHasSaidHello(true)}>
            Say hello
          </button>
          <p className="hello-message" role="status">
            {hasSaidHello ? "Hi, mathematician! Let's learn together." : 'Ready when you are.'}
          </p>
        </section>
      </div>
      <p className="foundation-note">Phase 1 · Project foundation</p>
    </main>
  )
}
