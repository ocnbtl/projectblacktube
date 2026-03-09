import type { PlanCode, PlanDefinition, SubscriptionEntitlement } from "./types.ts";

export const PLAN_DEFINITIONS: Record<PlanCode, PlanDefinition> = {
  free: {
    code: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
    blocklistLimit: 3,
    itemsPerBlocklistLimit: 3,
    analyticsLevel: 0,
    features: [
      "3 blocklists",
      "3 items per blocklist",
      "Current-track quick add",
      "Prompt to upgrade for analytics"
    ]
  },
  cheap: {
    code: "cheap",
    name: "Cheap",
    monthlyPrice: 1.5,
    yearlyPrice: 11.88,
    yearlyMonthlyEquivalent: 0.99,
    blocklistLimit: 5,
    itemsPerBlocklistLimit: 10,
    analyticsLevel: 1,
    features: [
      "5 blocklists",
      "10 items per blocklist",
      "Basic analytics",
      "Priority history suggestions"
    ]
  },
  unlimited: {
    code: "unlimited",
    name: "Unlimited",
    monthlyPrice: 3.99,
    yearlyPrice: 35.88,
    yearlyMonthlyEquivalent: 2.99,
    blocklistLimit: 20,
    itemsPerBlocklistLimit: null,
    analyticsLevel: 2,
    features: [
      "20 blocklists",
      "Unlimited items per blocklist",
      "Full analytics and event history",
      "CSV export and advanced filters"
    ]
  }
};

export function getPlanDefinition(plan: PlanCode): PlanDefinition {
  return PLAN_DEFINITIONS[plan];
}

export function makeEntitlement(plan: PlanCode): SubscriptionEntitlement {
  const definition = PLAN_DEFINITIONS[plan];

  return {
    plan,
    status: "active",
    billingCycle: "monthly",
    blocklistLimit: definition.blocklistLimit,
    itemsPerBlocklistLimit: definition.itemsPerBlocklistLimit,
    analyticsLevel: definition.analyticsLevel
  };
}

export function canCreateBlocklist(entitlement: SubscriptionEntitlement, existingCount: number): boolean {
  return existingCount < entitlement.blocklistLimit;
}

export function canAddItemToBlocklist(
  entitlement: SubscriptionEntitlement,
  existingItemCount: number
): boolean {
  if (entitlement.itemsPerBlocklistLimit === null) {
    return true;
  }

  return existingItemCount < entitlement.itemsPerBlocklistLimit;
}
