import { sampleEvents } from "@blacktube/shared";

import { AnalyticsBars } from "@/components/analytics-bars";
import { dashboardSeed } from "@/lib/demo-data";

export default function AnalyticsPage() {
  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Analytics</p>
        <h1>Visibility that gets stronger as the plan grows</h1>
        <p>
          Cheap unlocks the basics. Unlimited adds event history, filters, and export-ready views.
        </p>
      </section>

      <section className="panel">
        <AnalyticsBars {...dashboardSeed.analytics} />
      </section>

      <section className="split-panel">
        <article className="panel">
          <p className="eyebrow">Recent activity</p>
          <h2>Playback event history</h2>
          <div className="event-list">
            {sampleEvents.map((event) => (
              <div className="event-row" key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.artist}</p>
                </div>
                <span className={`status-chip ${event.action === "skipped" ? "warn" : "ok"}`}>
                  {event.action}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Upgrade logic</p>
          <h2>Tiered analytics policy</h2>
          <ul className="feature-list">
            <li>Free shows teaser metrics only and blocks the analytics dashboard.</li>
            <li>Cheap shows seen tracks, matches, skips, and top blocked artists or songs.</li>
            <li>Unlimited adds full history, filters, and CSV export.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

