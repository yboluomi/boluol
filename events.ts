import Decimal from "break_infinity.js";
import { makeResources } from "./resources";

export type EventId = "driftwood" | "storm" | "birds" | "merchant";
export interface GameEvent { id: EventId; title: string; detail: string; endsAt: number }

export const nextEventDelay = (): number => 45_000 + Math.random() * 45_000;

export const makeEvent = (now: number): { event: GameEvent; reward: ReturnType<typeof makeResources> } => {
  const reward = makeResources();
  const choices: EventId[] = ["driftwood", "storm", "birds", "merchant"];
  const id = choices[Math.floor(Math.random() * choices.length)] ?? "driftwood";
  const event: GameEvent = { id, title: "", detail: "", endsAt: now + 30_000 };
  if (id === "driftwood") {
    event.title = "漂流木箱"; event.detail = "海岸发现一批补给。";
    reward.wood = new Decimal(25); reward.vine = new Decimal(12);
  } else if (id === "storm") {
    event.title = "暴风雨"; event.detail = "生产效率暂时下降 30%。";
  } else if (id === "birds") {
    event.title = "海鸟群"; event.detail = "食物储备增加。";
    reward.food = new Decimal(40);
  } else {
    event.title = "商人到访"; event.detail = "限时交易手续费降低。";
  }
  return { event, reward };
};