import { DashboardLive } from "@/components/dashboard-live";

export default function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Dashboard</p>
        <h1>Blocklists, toggles, and quick-add actions</h1>
        <p>
          This dashboard now talks to your real Supabase account: blocklist CRUD, plan-aware limits,
          current-track quick-adds, and history-based suggestions.
        </p>
      </section>

      <DashboardLive />
    </div>
  );
}
