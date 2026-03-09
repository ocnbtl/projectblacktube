import { PLAN_DEFINITIONS } from "@blacktube/shared";

import { PricingCard } from "@/components/pricing-card";
import { dashboardSeed, launchChecklist, marketingPoints, workflowSteps } from "@/lib/demo-data";

export default function HomePage() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Chrome-first MVP for YouTube Music</p>
          <h1>Hear what you want. Skip what you don&apos;t.</h1>
          <p className="hero-text">
            Purrify Music gives YouTube Music listeners real artist and song blocklists, mood-based
            toggles, and analytics that start the moment the extension sees playback.
          </p>
          <div className="button-row">
            <a className="primary-button" href="/onboarding">
              See onboarding flow
            </a>
            <a className="secondary-button" href="/dashboard">
              Open product demo
            </a>
          </div>
        </div>

        <div className="hero-aside">
          <div className="metric-tile">
            <span>Plan-aware blocks</span>
            <strong>{dashboardSeed.entitlement.itemsPerBlocklistLimit} per active list</strong>
          </div>
          <div className="metric-tile">
            <span>Tracks seen this month</span>
            <strong>{dashboardSeed.analytics.tracksSeen}</strong>
          </div>
          <div className="metric-tile">
            <span>Skips already triggered</span>
            <strong>{dashboardSeed.analytics.skipsTriggered}</strong>
          </div>
        </div>
      </section>

      <section className="three-up-grid">
        {marketingPoints.map((point) => (
          <article className="panel" key={point.title}>
            <p className="eyebrow">Why it matters</p>
            <h2>{point.title}</h2>
            <p>{point.description}</p>
          </article>
        ))}
      </section>

      <section className="split-panel">
        <article className="panel">
          <p className="eyebrow">How it works</p>
          <h2>Fast enough for an autoskip product</h2>
          <ol className="number-list">
            {workflowSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="panel">
          <p className="eyebrow">Launch checklist</p>
          <h2>What still needs wiring</h2>
          <ul className="feature-list">
            {launchChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="page-stack">
        <div className="section-heading">
          <p className="eyebrow">Pricing</p>
          <h2>Simple plans that map to list and analytics depth</h2>
        </div>
        <div className="pricing-grid">
          <PricingCard plan={PLAN_DEFINITIONS.free} />
          <PricingCard plan={PLAN_DEFINITIONS.cheap} highlight />
          <PricingCard plan={PLAN_DEFINITIONS.unlimited} />
        </div>
      </section>
    </div>
  );
}

