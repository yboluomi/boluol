import Decimal from "break_infinity.js";
import type { ResourceId } from "./resources";

export type BuildingKind = "survival" | "production" | "tool" | "special";

export interface BuildingDefinition {
  id: string;
  name: string;
  kind: BuildingKind;
  costResource: ResourceId;
  baseCost: number;
  effect: string;
  production?: ResourceId;
  productionRate?: number;
  clickBonus?: number;
  capBonus?: number;
  offlineBonus?: number;
  tradeBonus?: number;
  feeReduction?: number;
}

export const BUILDINGS: BuildingDefinition[] = [
  { id: "shelter", name: "庇护所", kind: "survival", costResource: "wood", baseCost: 20, effect: "离线收益上限 +1 小时", offlineBonus: 1 },
  { id: "cabin", name: "木屋", kind: "survival", costResource: "wood", baseCost: 80, effect: "离线收益上限 +1 小时", offlineBonus: 1 },
  { id: "stone_house", name: "石屋", kind: "survival", costResource: "stone", baseCost: 120, effect: "离线收益上限 +2 小时", offlineBonus: 2 },
  { id: "watchtower", name: "瞭望塔", kind: "survival", costResource: "wood", baseCost: 300, effect: "自动点击上限 +2 / 秒", capBonus: 2 },
  { id: "camp", name: "前哨营地", kind: "survival", costResource: "vine", baseCost: 60, effect: "离线收益上限 +1 小时", offlineBonus: 1 },
  { id: "storehouse", name: "储备库", kind: "survival", costResource: "stone", baseCost: 500, effect: "离线收益上限 +2 小时", offlineBonus: 2 },

  { id: "fishing_rod", name: "渔具", kind: "production", costResource: "vine", baseCost: 30, effect: "食物 +0.2 / 秒", production: "food", productionRate: 0.2 },
  { id: "net", name: "渔网", kind: "production", costResource: "vine", baseCost: 100, effect: "食物 +1 / 秒", production: "food", productionRate: 1 },
  { id: "fish_trap", name: "鱼陷阱", kind: "production", costResource: "wood", baseCost: 260, effect: "食物 +4 / 秒", production: "food", productionRate: 4 },
  { id: "collector", name: "集水器", kind: "production", costResource: "wood", baseCost: 50, effect: "淡水 +0.3 / 秒", production: "water", productionRate: 0.3 },
  { id: "distiller", name: "蒸馏器", kind: "production", costResource: "ore", baseCost: 220, effect: "淡水 +2 / 秒", production: "water", productionRate: 2 },
  { id: "lumberyard", name: "伐木场", kind: "production", costResource: "stone", baseCost: 180, effect: "木材 +2 / 秒", production: "wood", productionRate: 2 },

  { id: "stone_axe", name: "石斧", kind: "tool", costResource: "stone", baseCost: 35, effect: "点击产量 +12%", clickBonus: 0.12 },
  { id: "iron_pick", name: "铁镐", kind: "tool", costResource: "ore", baseCost: 200, effect: "点击产量 +35%", clickBonus: 0.35 },
  { id: "vine_rope", name: "藤绳", kind: "tool", costResource: "vine", baseCost: 45, effect: "点击产量 +15%", clickBonus: 0.15 },
  { id: "spear", name: "长矛", kind: "tool", costResource: "wood", baseCost: 100, effect: "点击产量 +20%", clickBonus: 0.2 },
  { id: "reinforced_axe", name: "强化斧", kind: "tool", costResource: "ore", baseCost: 500, effect: "点击产量 +70%", clickBonus: 0.7 },
  { id: "toolbench", name: "工具台", kind: "tool", costResource: "stone", baseCost: 350, effect: "点击产量 +45%", clickBonus: 0.45 },

  { id: "signal_tower", name: "信号塔", kind: "special", costResource: "ore", baseCost: 450, effect: "自动点击上限 +5 / 秒", capBonus: 5 },
  { id: "dock", name: "船坞", kind: "special", costResource: "wood", baseCost: 600, effect: "全局产出 +10%", tradeBonus: 0.1 },
  { id: "shrine", name: "神庙", kind: "special", costResource: "hide", baseCost: 500, effect: "全局产出 +15%", tradeBonus: 0.15 },
  { id: "market_post", name: "集市站", kind: "special", costResource: "stone", baseCost: 350, effect: "交易手续费降低 1%", feeReduction: 0.01 },
  { id: "beacon", name: "海岸灯塔", kind: "special", costResource: "ore", baseCost: 900, effect: "��动点击上限 +15 / 秒", capBonus: 15 },
  { id: "navigation", name: "航海图", kind: "special", costResource: "hide", baseCost: 700, effect: "全局产出 +25%", tradeBonus: 0.25 }
];

export const buildingCost = (definition: BuildingDefinition, level: Decimal): Decimal =>
  new Decimal(definition.baseCost).times(new Decimal(1.6).pow(level));
