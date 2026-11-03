import Decimal from "break_infinity.js";
import { RESOURCE_IDS, RESOURCE_META } from "./resources";
import type { ResourceId, ResourceMap } from "./resources";

export type Market = Record<ResourceId, Decimal>;

export const createMarket = (): Market => {
  const market = {} as Market;
  for (const id of RESOURCE_IDS) {
    market[id] = new Decimal(RESOURCE_META[id].weight).times(0.7 + Math.random() * 0.6);
  }
  return market;
};

export const exchange = (
  resources: ResourceMap,
  market: Market,
  from: ResourceId,
  to: ResourceId,
  amount: Decimal,
  fee: Decimal
): { resources: ResourceMap; received: Decimal } | null => {
  if (from === to || amount.lessThanOrEqualTo(0) || resources[from].lessThan(amount)) return null;
  const received = amount.times(market[from]).div(market[to]).times(new Decimal(1).minus(fee));
  const next = { ...resources };
  next[from] = next[from].minus(amount);
  next[to] = next[to].plus(received);
  return { resources: next, received };
};
