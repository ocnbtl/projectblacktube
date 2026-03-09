import { DashboardDemo } from "@/components/dashboard-demo";

export default function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Dashboard</p>
        <h1>Blocklists, toggles, and quick-add actions</h1>
        <p>
          This scaffold demonstrates the main control surface for the MVP: blocklist management,
          plan-aware limits, current-track actions, and history-driven suggestions.
        </p>
      </section>

      <DashboardDemo />
    </div>
  );
}

