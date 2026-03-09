const steps = [
  "Sign in with Google so the dashboard and extension share the same account.",
  "Install the extension and pin it in Chrome for quick access.",
  "Create your first blocklist and decide whether autoskip or prompt mode should be active.",
  "Add a song or artist from the current track, then test the behavior on a live playlist."
];

export default function OnboardingPage() {
  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Onboarding</p>
        <h1>Get a first skip working in under three minutes</h1>
        <p>
          The ideal onboarding flow is short: sign in, create one blocklist, add one current-track
          rule, and immediately hear Purrify react.
        </p>
      </section>

      <section className="panel">
        <ol className="number-list">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

