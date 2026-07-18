export const IMPACT_ASSUMPTIONS = {
  mealsPerKilogram: {
    value: 2.4,
    unit: "meals per kg",
    label: "Estimated meals",
    description: "Assumes one meal uses approximately 0.417 kg of redistributed food.",
  },
  financialValuePerKilogramEur: {
    value: 5.75,
    unit: "EUR per kg",
    label: "Estimated financial value",
    description: "Illustrative blended value for food retained in community use.",
  },
  wasteAvoidanceRate: {
    value: 0.92,
    unit: "share of redistributed kg",
    label: "Estimated waste avoided",
    description: "Assumes 8% handling loss after collection, leaving 92% as avoided waste.",
  },
  co2eAvoidedPerKilogram: {
    value: 2.15,
    unit: "kg CO2e per kg",
    label: "Estimated CO2e avoided",
    description: "Illustrative reporting-form estimate; it is not used in the impact headline metrics.",
  },
} as const;

export const IMPACT_ASSUMPTIONS_VERSION = "demo-v1";
