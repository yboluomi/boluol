import Decimal from "break_infinity.js";
import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { applyExperience, clickYield, type LevelState } from "../engine/level";
import { automationCap, productionPerSecond } from "../engine/automation";
import { BUILDINGS, buildingCost } from "../engine/buildings";
import { makeEvent, nextEventDelay, type GameEvent } from "../engine/events";
import { makeResources, RESOURCE_IDS, type ResourceId, type ResourceMap } from "../engine/resources";
import { createMarket, exchange, type Market } from "../engine/trade";
import { deserializeSave, migrateSave, SAVE_VERSION, serializeSave } from "../engine/save";

export interface GameState extends LevelState {
  resources: ResourceMap;
  buildings: Record<string, Decimal>;
  automationRate: Decimal;
  autoClicks: Decimal;
  totalClicks: Decimal;
  market: Market;
  marketRefreshAt: number;
  lastSeen: number;
  event: GameEvent | null;
  eventAt: number;
  stormUntil: number;
  achievements: string[];
  notification: string;
  click: () => void;
  advance: (seconds: Decimal) => void;
  buyBuilding: (id: string) => void;
  setAutomation: (rate: Decimal) => void;
  trade: (from: ResourceId, to: ResourceId, amount: Decimal) => void;
  clearNotice: () => void;
}

const newBuildingLevels = (): Record<string, Decimal> =>
  Object.fromEntries(BUILDINGS.map((building) => [building.id, new Decimal(0)]));

const clickMultiplier = (levels: Record<string, Decimal>): Decimal => {
  let multiplier = new Decimal(1);
  for (const item of BUILDINGS) {
    if (item.clickBonus !== undefined) {
      multiplier = multiplier.plus((levels[item.id] ?? new Decimal(0)).times(item.clickBonus));
    }
  }
  return multiplier;
};

const storage: PersistStorage<GameState> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    const decoded = deserializeSave(raw) as StorageValue<GameState>;
    return { ...decoded, state: migrateSave(decoded.state, decoded.version ?? 0) as GameState };
  },
  setItem: (name, value) => {
    const payload = serializeSave(value);
    localStorage.setItem(name, payload);
  },
  removeItem: (name) => localStorage.removeItem(name)
};

export const useGame = create<GameState>()(
  persist((set, get) => ({
    level: new Decimal(1),
    exp: new Decimal(0),
    resources: makeResources(),
    buildings: newBuildingLevels(),
    automationRate: new Decimal(0),
    autoClicks: new Decimal(0),
    totalClicks: new Decimal(0),
    market: createMarket(),
    marketRefreshAt: Date.now() + 60_000,
    lastSeen: Date.now(),
    event: null,
    eventAt: Date.now() + nextEventDelay(),
    stormUntil: 0,
    achievements: [],
    notification: "",

    click: () => {
      const state = get();
      const amount = clickYield(state.level, clickMultiplier(state.buildings));
      const resources = makeResources();
      for (const id of RESOURCE_IDS) {
        resources[id] = state.resources[id].plus(amount);
      }
      const nextLevel = applyExperience(state, new Decimal(1));
      const achievements = [...state.achievements];
      if (!achievements.includes("first_click")) achievements.push("first_click");
      set({ resources, ...nextLevel, totalClicks: state.totalClicks.plus(1), achievements });
    },

    advance: (seconds) => {
      const state = get();
      const elapsed = seconds.max(0);
      const rate = state.automationRate.min(automationCap(state.buildings));
      const automaticClicks = rate.times(elapsed);
      const gain = clickYield(state.level, clickMultiplier(state.buildings)).times(automaticClicks);
      const production = productionPerSecond(state.buildings);
      const now = Date.now();
      const stormFactor = now < state.stormUntil ? new Decimal(0.7) : new Decimal(1);
      const resources = makeResources();
      for (const id of RESOURCE_IDS) {
        resources[id] = state.resources[id].plus(gain).plus(production[id].times(elapsed).times(stormFactor));
      }

      const nextLevel = applyExperience(state, automaticClicks);
      let market = state.market;
      let marketRefreshAt = state.marketRefreshAt;
      if (now >= marketRefreshAt) {
        market = createMarket();
        marketRefreshAt = now + 60_000;
      }

      let event = state.event;
      let eventAt = state.eventAt;
      let stormUntil = state.stormUntil;
      let notification = state.notification;
      if (now >= eventAt) {
        const result = makeEvent(now);
        event = result.event;
        eventAt = now + nextEventDelay();
        if (result.event.id === "storm") stormUntil = result.event.endsAt;
        for (const id of RESOURCE_IDS) resources[id] = resources[id].plus(result.reward[id]);
        notification = `${result.event.title} · ${result.event.detail}`;
      }
      if (event && now > event.endsAt) event = null;

      const achievements = [...state.achievements];
      const appendIf = (id: string, condition: boolean): void => {
        if (condition && !achievements.includes(id)) achievements.push(id);
      };
      appendIf("click_10", state.totalClicks.plus(automaticClicks).greaterThanOrEqualTo(10));
      appendIf("click_100", state.totalClicks.plus(automaticClicks).greaterThanOrEqualTo(100));
      appendIf("level_5", nextLevel.level.greaterThanOrEqualTo(5));
      appendIf("level_10", nextLevel.level.greaterThanOrEqualTo(10));
      RESOURCE_IDS.forEach((id, index) => appendIf(`stock_${index}`, resources[id].greaterThanOrEqualTo(100)));
      set({
        resources,
        ...nextLevel,
        autoClicks: state.autoClicks.plus(automaticClicks),
        totalClicks: state.totalClicks.plus(automaticClicks),
        market,
        marketRefreshAt,
        event,
        eventAt,
        stormUntil,
        achievements,
        notification,
        lastSeen: now
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
      set({
        resources,
        buildings: { ...state.buildings, [id]: level.plus(1) }
      });
    },

    setAutomation: (rate) => set({ automationRate: rate.max(0).min(automationCap(get().buildings)) }),

    trade: (from, to, amount) => {
      const state = get();
      let fee = new Decimal(0.05);
      for (const item of BUILDINGS) {
        if (item.feeReduction !== undefined) {
          fee = fee.minus((state.buildings[item.id] ?? new Decimal(0)).times(item.feeReduction));
        }
      }
      if (state.event?.id === "merchant" && Date.now() < state.event.endsAt) fee = fee.minus(0.02);
      const result = exchange(state.resources, state.market, from, to, amount, fee.max(0));
      if (result) set({ resources: result.resources });
    },

    clearNotice: () => set({ notification: "" })
  }), {
    name: "island-survival-save",
    version: SAVE_VERSION,
    storage,
    partialize: (state) => ({
      level: state.level,
      exp: state.exp,
      resources: state.resources,
      buildings: state.buildings,
      automationRate: state.automationRate,
      autoClicks: state.autoClicks,
      totalClicks: state.totalClicks,
      market: state.market,
      marketRefreshAt: state.marketRefreshAt,
      lastSeen: state.lastSeen,
      event: state.event,
      eventAt: state.eventAt,
      stormUntil: state.stormUntil,
      achievements: state.achievements,
      notification: state.notification
    })
  })
);
