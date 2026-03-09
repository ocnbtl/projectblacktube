import type { PlanDefinition } from "@blacktube/shared";

interface PricingCardProps {
  plan: PlanDefinition;
  highlight?: boolean;
}

export function PricingCard({ plan, highlight = false }: PricingCardProps) {
  const yearlyLabel =
    plan.yearlyPrice > 0
      ? `${plan.yearlyMonthlyEquivalent.toFixed(2)}/mo billed yearly`
      : "Free forever";

  return (
    <article className={`pricing-card ${highlight ? "highlight" : ""}`}>
      <div className="pricing-card-top">
        <p className="eyebrow">{highlight ? "Most likely upgrade path" : "Plan"}</p>
        <h3>{plan.name}</h3>
        <p className="price-line">
          {plan.monthlyPrice === 0 ? "Free" : `$${plan.monthlyPrice.toFixed(2)}`}
          <span>/month</span>
        </p>
        <p className="muted">{yearlyLabel}</p>
      </div>

      <ul className="feature-list">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </article>
  );
}

