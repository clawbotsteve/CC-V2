/**
 * One-shot verification that every plan tier in `planPacks` maps cleanly
 * through the user-facing display logic. Run with:
 *
 *   npx tsx scripts/verify-plan-mapping.ts
 *
 * Exits non-zero if any plan fails. Useful as a manual smoke test or to
 * wire into CI later.
 */
import { planPacks, TIER_KEY_MAP, PLAN_MAPS } from "../constants/pricing-constants";
import { resolveDisplayPlan } from "../components/plan-label";

const expected: Record<string, string> = {
  plan_free: "FREE",
  plan_beginner: "BEGINNER",
  plan_beginner_3month: "BEGINNER",
  plan_basic: "STARTER",
  plan_basic_3month: "STARTER",
  plan_pro: "CREATOR",
  plan_pro_3month: "CREATOR",
  plan_elite: "STUDIO",
  plan_elite_3month: "STUDIO",
};

let pass = 0, fail = 0;

console.log("DB tier               → Badge      | TIER_KEY_MAP | PLAN_MAPS | planPacks");
console.log("─".repeat(85));

for (const pack of Object.values(planPacks)) {
  const got = resolveDisplayPlan(pack.tier);
  const want = expected[pack.tier] ?? "?";
  const badge = got === want ? "✅" : "❌";

  const planKey = TIER_KEY_MAP[pack.tier];
  const inPlanMaps = planKey && PLAN_MAPS[planKey] ? "✅" : "❌";
  const inPlanPacks = planKey && planPacks[planKey] ? "✅" : "❌";
  const inTierKeyMap = planKey ? "✅" : "❌";

  console.log(
    `${pack.tier.padEnd(22)}→ ${got.padEnd(10)} | ${inTierKeyMap}            | ${inPlanMaps}         | ${inPlanPacks}  ${badge}`
  );

  if (got === want && planKey && PLAN_MAPS[planKey] && planPacks[planKey]) pass++;
  else fail++;
}

const edge: Array<{ input: string | undefined; want: string }> = [
  { input: undefined, want: "FREE" },
  { input: "", want: "FREE" },
  { input: "plan_unknown_xyz", want: "FREE" },
];
console.log("\nEdge cases:");
for (const e of edge) {
  const got = resolveDisplayPlan(e.input);
  const ok = got === e.want;
  const label = e.input === undefined ? "undefined" : JSON.stringify(e.input);
  console.log(`  ${label.padEnd(22)}→ ${got.padEnd(10)} ${ok ? "✅" : "❌"}`);
  if (ok) pass++; else fail++;
}

console.log(`\nResult: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
