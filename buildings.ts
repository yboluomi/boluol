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
}

const definitions: BuildingDefinition[] = [
  ["shelter","庇护所","survival","wood",20,"离线收益上限 +1 小时",{offlineBonus:1}],
  ["cabin","木屋","survival","wood",80,"离线收益上限 +1 小时",{offlineBonus:1}],
  ["stone_house","石屋","survival","stone",120,"离线收益上限 +2 小时",{offlineBonus:2}],
  ["watchtower","瞭望塔","survival","wood",300,"解锁更高自动化上限",{capBonus:2}],
  ["camp","营地","survival","vine",60,"离线收益上限 +1 小时",{offlineBonus:1}],
  ["storehouse","仓库","survival","stone",500,"离线收益上限 +2 小时",{offlineBonus:2}],
  ["fishing_rod","渔具","production","vine",30,"食物 +0.2 / 秒",{production:"food",productionRate:.2}],
  ["net","渔网","production","vine",100,"食物 +1 / 秒",{production:"food",productionRate:1}],
  ["fish_trap","鱼陷阱","production","wood",260,"食物 +4 / 秒",{production:"food",productionRate:4}],
  ["collector","集水器","production","wood",50,"淡水 +0.3 / 秒",{production:"water",productionRate:.3}],
  ["distiller","蒸馏器","production","ore",220,"淡水 +2 / 秒",{production:"water",productionRate:2}],
  ["lumberyard","伐木场","production","stone",180,"木材 +2 / 秒",{production:"wood",productionRate:2}],
  ["stone_axe","石斧","tool","stone",35,"点击产量 +12%",{clickBonus:.12}],
  ["iron_pick","铁镐","tool","ore",200,"点击产量 +35%",{clickBonus:.35}],
  ["vine_rope","藤绳","tool","vine",45,"点击产量 +15%",{clickBonus:.15}],
  ["spear","长矛","tool","wood",100,"点击产量 +20%",{clickBonus:.2}],
  ["reinforced_axe","强化斧","tool","ore",500,"点击产量 +70%",{clickBonus:.7}],
  ["toolbench","工具台","tool","stone",350,"点击产量 +45%",{clickBonus:.45}],
  ["signal_tower","信号塔","special","ore",450,"自动点击上限 +5 / 秒",{capBonus:5}],
  ["dock","船坞","special","wood",600,"全局产出 +10%",{tradeBonus:.1}],
  ["shrine","神庙","special","hide",500,"全局产出 +15%",{tradeBonus:.15}],
  ["market_post","集市站","special","stone",350,"交易手续费降低",{tradeBonus:.01}],
  ["beacon","海岸灯塔","special","ore",900,"自动点击上限 +15 / 秒",{capBonus:15}],
  ["navigation","航海图","special","hide",700,"全局产出 +25%",{tradeBonus:.25}]
].map(([id,name,kind,costResource,baseCost,effect,extra]) => ({
  id: String(id), name: String(name), kind: kind as BuildingKind,
  costResource: costResource as ResourceId, baseCost: Number(baseCost),
  effect: String(effect), ...(extra as Partial<BuildingDefinition>)
}));

export const BUILDINGS = definitions;
export const buildingCost = (definition: BuildingDefinition, level: Decimal): Decimal =>
  new Decimal(definition.baseCost).times(new Decimal(1.6).pow(level));
export const buildingEffectScale = (level: Decimal): Decimal => level;