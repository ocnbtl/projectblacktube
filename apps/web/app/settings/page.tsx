export default function SettingsPage() {
  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Settings</p>
        <h1>Operational controls for the MVP</h1>
        <p>Keep the first settings set narrow and focused on reliability, privacy, and playback mode.</p>
      </section>

      <div className="three-up-grid">
        <article className="panel">
          <p className="eyebrow">Playback mode</p>
          <h2>Autoskip or prompt</h2>
          <p>Prompt mode remains available as the degraded path if selectors become unreliable.</p>
        </article>

        <article className="panel">
          <p className="eyebrow">Privacy</p>
          <h2>History retention</h2>
          <p>Retention defaults can be configured later by plan once live analytics storage is wired.</p>
        </article>

        <article className="panel">
          <p className="eyebrow">Diagnostics</p>
          <h2>Selector health</h2>
          <p>Extension status and last-known selector failures should surface here in later iterations.</p>
        </article>
      </div>
    </div>
  );
}

