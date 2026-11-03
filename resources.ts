import Decimal from "break_infinity.js";

export const RESOURCE_IDS = ["wood", "stone", "vine", "food", "water", "ore", "hide"] as const;
export type ResourceId = (typeof RESOURCE_IDS)[number];
export type ResourceMap = Record<ResourceId, Decimal>;

export const RESOURCE_META: Record<ResourceId, { name: string; short: string; weight: number }> = {
  wood: { name: "木材", short: "木", weight: 1 },
  stone: { name: "石料", short: "石", weight: 1.25 },
  vine: { name: "藤蔓", short: "藤", weight: 0.8 },
  food: { name: "食物", short: "食", weight: 1.5 },
  water: { name: "淡水", short: "水", weight: 1.8 },
  ore: { name: "铁矿", short: "铁", weight: 3 },
  hide: { name: "兽皮", short: "皮", weight: 2.4 }
};

export const makeResources = (value: Decimal.Value = 0): ResourceMap => ({
  wood: new Decimal(value),
  stone: new Decimal(value),
  vine: new Decimal(value),
  food: new Decimal(value),
  water: new Decimal(value),
  ore: new Decimal(value),
  hide: new Decimal(value)
});

export const resourceValue = (map: ResourceMap): Decimal =>
  RESOURCE_IDS.reduce((sum, id) => sum.plus(map[id].times(RESOURCE_META[id].weight)), new Decimal(0));

export const addResources = (left: ResourceMap, right: ResourceMap): ResourceMap => {
  const result = makeResources();
  for (const id of RESOURCE_IDS) result[id] = left[id].plus(right[id]);
  return result;
};