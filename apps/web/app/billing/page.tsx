import { PLAN_DEFINITIONS } from "@blacktube/shared";

import { PricingCard } from "@/components/pricing-card";

export default function BillingPage() {
  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Billing</p>
        <h1>Pricing that stays lightweight</h1>
        <p>
          The MVP is intentionally inexpensive. The upgrade path is about more control and more
          analytics, not bloated feature bundles.
        </p>
      </section>

      <div className="pricing-grid">
        <PricingCard plan={PLAN_DEFINITIONS.free} />
        <PricingCard plan={PLAN_DEFINITIONS.cheap} highlight />
        <PricingCard plan={PLAN_DEFINITIONS.unlimited} />
      </div>

      <section className="panel">
        <p className="eyebrow">Stripe integration target</p>
        <h2>Subscription flow</h2>
        <ul className="feature-list">
          <li>Checkout creates the subscription and redirects back to the dashboard.</li>
          <li>Webhook updates the user entitlement row in Supabase.</li>
          <li>Customer Portal handles upgrades, downgrades, and cancellations.</li>
        </ul>
      </section>
    </div>
  );
}

