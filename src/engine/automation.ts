import Decimal from "break_infinity.js";
import { BUILDINGS } from "./buildings";
import { type ResourceMap, makeResources, RESOURCE_IDS } from "./resources";

export const automationCap = (levels: Record<string, Decimal>): Decimal => {
  let cap = new Decimal(3);
  for (const building of BUILDINGS) {
    if (building.capBonus !== undefined) cap = cap.plus((levels[building.id] ?? new Decimal(0)).times(building.capBonus));
  }
  return cap;
};

export const productionPerSecond = (levels: Record<string, Decimal>): ResourceMap => {
  const result = makeResources();
  for (const building of BUILDINGS) {
    if (building.production && building.productionRate !== undefined) {
      result[building.production] = result[building.production].plus(
        (levels[building.id] ?? new Decimal(0)).times(building.productionRate)
      );
    }
  }
  return result;
};

export const resourcesPerSecond = (rate: Decimal, perClick: Decimal, levels: Record<string, Decimal>): ResourceMap => {
  const result = makeResources();
  const automatic = rate.times(perClick);
  const buildingProduction = productionPerSecond(levels);
  for (const id of RESOURCE_IDS) result[id] = automatic.plus(buildingProduction[id]);
  return result;
};
