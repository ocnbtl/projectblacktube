import { AnalyticsLive } from "@/components/analytics-live";

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

      <AnalyticsLive />
    </div>
  );
}
