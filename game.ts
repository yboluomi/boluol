import Decimal from "break_infinity.js";
import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { applyExperience, clickYield, type LevelState } from "../engine/level";
import { BUILDINGS, buildingCost } from "../engine/buildings";
import { automationCap, productionPerSecond } from "../engine/automation";
import { makeEvent, nextEventDelay, type GameEvent } from "../engine/events";
import { makeResources, RESOURCE_IDS, type ResourceId, type ResourceMap } from "../engine/resources";
import { createMarket, exchange, type Market } from "../engine/trade";
import { deserializeSave, migrateSave, SAVE_VERSION, serializeSave } from "../engine/save";

const initialMarket = createMarket();
const now = Date.now();

export interface GameState extends LevelState {
  resources: ResourceMap;
  buildings: Record<string, Decimal>;
  automationRate: Decimal;
  autoClicks: Decimal;
  market: Market;
  marketRefreshAt: number;
  lastSeen: number;
  event: GameEvent | null;
  eventAt: number;
  stormUntil: number;
  achievements: string[];
  notification: string;
  offline: ResourceMap | null;
  click: () => void;
  advance: (seconds: Decimal) => void;
  buyBuilding: (id: string) => void;
  setAutomation: (rate: Decimal) => void;
  trade: (from: ResourceId, to: ResourceId, amount: Decimal) => void;
  claimOffline: () => void;
  clearNotice: () => void;
}

const freshLevels = (): Record<string, Decimal> =>
  Object.fromEntries(BUILDINGS.map((item) => [item.id, new Decimal(0)]));

const clickMultiplier = (levels: Record<string, Decimal>): Decimal => {
  let result = new Decimal(1);
  for (const item of BUILDINGS) {
    if (item.clickBonus) result = result.plus((levels[item.id] ?? new Decimal(0)).times(item.clickBonus));
  }
  return result;
};

const storage: PersistStorage<GameState> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    const parsed = deserializeSave(raw) as StorageValue<GameState>;
    return { ...parsed, state: migrateSave(parsed.state, parsed.version ?? 0) as GameState };
  },
  setItem: (name, value) => {
    const write = (): void => localStorage.setItem(name, serializeSave(value));
    const key = `${name}:timer`;
    const existing = (window as Window & { [key: string]: number | undefined })[key];
    if (existing !== undefined) return;
    (window as Window & { [key: string]: number | undefined })[key] = window.setTimeout(() => {
      write();
      delete (window as Window & { [key: string]: number | undefined })[key];
    }, 1000);
  },
  removeItem: (name) => localStorage.removeItem(name)
};

export const useGame = create<GameState>()(persist((set, get) => ({
  level: new Decimal(1),
  exp: new Decimal(0),
  resources: makeResources(),
  buildings: freshLevels(),
  automationRate: new Decimal(0),
  autoClicks: new Decimal(0),
  market: initialMarket,
  marketRefreshAt: now + 60_000,
  lastSeen: now,
  event: null,
  eventAt: now + nextEventDelay(),
  stormUntil: 0,
  achievements: [],
  notification: "",
  offline: null,

  click: () => {
    const state = get();
    const amount = clickYield(state.level, clickMultiplier(state.buildings));
    const gained = makeResources(amount);
    set({ resources: Object.fromEntries(RESOURCE_IDS.map((id) => [id, state.resources[id].plus(gained[id])])) as ResourceMap,
      ...applyExperience(state, new Decimal(1)) });
  },

  advance: (seconds) => {
    const state = get();
    const elapsed = seconds.max(0);
    const cap = automationCap(state.buildings);
    const rate = state.automationRate.min(cap);
    const multiplier = clickMultiplier(state.buildings);
    const automaticClicks = rate.times(elapsed);
    const clickGain = clickYield(state.level, multiplier).times(automaticClicks);
    const production = productionPerSecond(state.buildings);
    const stormFactor = Date.now() < state.stormUntil ? new Decimal(0.7) : new Decimal(1);
    const nextResources = makeResources();
    for (const id of RESOURCE_IDS) {
      nextResources[id] = state.resources[id]
        .plus(clickGain)
        .plus(production[id].times(elapsed).times(stormFactor));
    }
    const nextLevel = applyExperience(state, automaticClicks);
    const time = Date.now();
    const newAchievements = [...state.achievements];
    const milestones = [
      { id: "click_1", test: state.autoClicks.plus(automaticClicks).plus(1).greaterThanOrEqualTo(1) },
      { id: "level_5", test: nextLevel.level.greaterThanOrEqualTo(5) },
      { id: "level_10", test: nextLevel.level.greaterThanOrEqualTo(10) },
      ...RESOURCE_IDS.map((id, index) => ({
        id: `stock_${index}`,
        test: nextResources[id].greaterThanOrEqualTo(100)
      }))
    ];
    for (const item of milestones) {
      if (item.test && !newAchievements.includes(item.id)) newAchievements.push(item.id);
    }

    let market = state.market;
    let marketRefreshAt = state.marketRefreshAt;
    if (time >= marketRefreshAt) {
      market = createMarket();
      marketRefreshAt = time + 60_000;
    }

    let event = state.event;
    let eventAt = state.eventAt;
    let stormUntil = state.stormUntil;
    let notice = state.notification;
    if (time >= eventAt) {
      const result = makeEvent(time);
      event = result.event;
      eventAt = time + nextEventDelay();
      stormUntil = result.event.id === "storm" ? result.event.endsAt : stormUntil;
      for (const id of RESOURCE_IDS) nextResources[id] = nextResources[id].plus(result.reward[id]);
      notice = `${result.event.title} · ${result.event.detail}`;
    }
    if (event && time > event.endsAt) event = null;

    set({
      resources: nextResources, ...nextLevel,
      autoClicks: state.autoClicks.plus(automaticClicks),
      market, marketRefreshAt, event, eventAt, stormUntil,
      achievements: newAchievements, notification: notice, lastSeen: time
    });
  },

  buyBuilding: (id) => {
    const state = get();
    const definition = BUILDINGS.find((item) => item.id === id);
    if (!definition) return;
    const level = state.buildings[id] ?? new Decimal(0);
    const cost = buildingCost(definition, level);
    if (state.resources[definition.costResource].lessThan(cost)) return;
    const resources = { ...state.resources };
    resources[definition.costResource] = resources[definition.costResource].minus(cost);
    set({ resources, buildings: { ...state.buildings, [id]: level.plus(1) } });
  },

  setAutomation: (rate) => set({ automationRate: rate.max(0).min(automationCap(get().buildings)) }),

  trade: (from, to, amount) => {
    const state = get();
    let fee = new Decimal(0.05);
    for (const item of BUILDINGS) {
      if (item.id === "market_post") fee = fee.minus((state.buildings[item.id] ?? new Decimal(0)).times(0.01));
    }
    const result = exchange(state.resources, state.market, from, to, amount, fee.max(0));
    if (result) set({ resources: result.resources });
  },

  claimOffline: () => set({ offline: null }),
  clearNotice: () => set({ notification: "" })
}), {
  name: "island-survival-save",
  version: SAVE_VERSION,
  storage,
  partialize: (state) => ({
    level: state.level, exp: state.exp, resources: state.resources,
    buildings: state.buildings, automationRate: state.automationRate,
    autoClicks: state.autoClicks, market: state.market,
    marketRefreshAt: state.marketRefreshAt, lastSeen: state.lastSeen,
    event: state.event, eventAt: state.eventAt, stormUntil: state.stormUntil,
    achievements: state.achievements, notification: state.notification,
    offline: state.offline
  }) as GameState
})));