export default function PrivacyPage() {
  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Privacy</p>
        <h1>Draft privacy posture for the MVP</h1>
      </section>

      <section className="panel prose-panel">
        <p>
          Purrify Music stores account, blocklist, subscription, and playback event data needed to
          operate the service. Playback analytics begin when the extension is installed and signed in.
        </p>
        <p>
          The MVP should request access only to <code>music.youtube.com</code> and should not request
          broad browsing history or unrelated domains.
        </p>
      </section>
    </div>
  );
}

