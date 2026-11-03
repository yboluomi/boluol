import Decimal from "break_infinity.js";
import { BUILDINGS } from "./buildings";
import type { ResourceMap } from "./resources";
import { makeResources, RESOURCE_IDS } from "./resources";

export const automationCap = (levels: Record<string, Decimal>): Decimal => {
  let cap = new Decimal(3);
  for (const item of BUILDINGS) {
    if (item.capBonus !== undefined) cap = cap.plus((levels[item.id] ?? new Decimal(0)).times(item.capBonus));
  }
  return cap;
};

export const productionPerSecond = (levels: Record<string, Decimal>): ResourceMap => {
  const result = makeResources();
  for (const item of BUILDINGS) {
    if (item.production && item.productionRate !== undefined) {
      result[item.production] = result[item.production].plus(
        (levels[item.id] ?? new Decimal(0)).times(item.productionRate)
      );
    }
  }
  return result;
};

export const resourcesPerSecond = (rate: Decimal, perClick: Decimal, levels: Record<string, Decimal>): ResourceMap => {
  const result = makeResources();
  const automatic = rate.times(perClick);
  const production = productionPerSecond(levels);
  for (const id of RESOURCE_IDS) result[id] = automatic.plus(production[id]);
  return result;
};