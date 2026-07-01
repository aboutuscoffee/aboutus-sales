export const TIER_ORDER = ["150g〜の豆", "100g〜の豆", "30g〜の豆"];

const getTier = (minGrams) => {
  if (minGrams >= 150) return "150g〜の豆";
  if (minGrams >= 100) return "100g〜の豆";
  return "30g〜の豆";
};

// products配列 → { "150g〜の豆": [{name, variants, basePrice}], ... }
export function buildTieredGroups(products) {
  const byName = {};
  for (const p of products) {
    if (!byName[p.name]) byName[p.name] = [];
    byName[p.name].push(p);
  }
  for (const variants of Object.values(byName)) {
    variants.sort((a, b) => a.grams - b.grams);
  }
  const tiers = {};
  for (const [name, variants] of Object.entries(byName)) {
    const tier = getTier(variants[0].grams);
    if (!tiers[tier]) tiers[tier] = [];
    tiers[tier].push({ name, variants, basePrice: variants[0].price });
  }
  for (const group of Object.values(tiers)) {
    group.sort((a, b) => a.basePrice - b.basePrice);
  }
  return tiers;
}
