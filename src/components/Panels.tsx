import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Decimal from "break_infinity.js";
import { motion } from "framer-motion";
import { BUILDINGS, buildingCost, type BuildingKind } from "../engine/buildings";
import { automationCap, resourcesPerSecond } from "../engine/automation";
import { clickYield } from "../engine/level";
import { RESOURCE_IDS, RESOURCE_META, type ResourceId } from "../engine/resources";
import { useGame } from "../store/game";
import { formatNumber } from "../hooks/useFormatNumber";

const categories: { id: BuildingKind; title: string }[] = [
  { id: "survival", title: "生存" },
  { id: "production", title: "生产" },
  { id: "tool", title: "工具" },
  { id: "special", title: "特殊" }
];

export function BuildPanel(): React.JSX.Element {
  const resources = useGame((s) => s.resources);
  const levels = useGame((s) => s.buildings);
  const buy = useGame((s) => s.buyBuilding);

  return (
    <div className="panel-scroll">
      {categories.map((category) => (
        <section key={category.id}>
          <h3>{category.title}</h3>
          {BUILDINGS.filter((item) => item.kind === category.id).map((item) => {
            const level = levels[item.id] ?? new Decimal(0);
            const cost = buildingCost(item, level);
            const enabled = resources[item.costResource].greaterThanOrEqualTo(cost);
            return (
              <article className="building-row" key={item.id}>
                <div>
                  <strong>{item.name} <small>Lv.{formatNumber(level)}</small></strong>
                  <p>{item.effect}</p>
                  <small>消耗 {RESOURCE_META[item.costResource].name} {formatNumber(cost)}</small>
                </div>
                <button disabled={!enabled} onClick={() => buy(item.id)}>升级</button>
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}

export function AutomationPanel(): React.JSX.Element {
  const rate = useGame((s) => s.automationRate);
  const levels = useGame((s) => s.buildings);
  const level = useGame((s) => s.level);
  const clicks = useGame((s) => s.autoClicks);
  const setRate = useGame((s) => s.setAutomation);
  const cap = automationCap(levels);
  const multiplier = useMemo(
    () => BUILDINGS.reduce((total, item) => item.clickBonus === undefined ? total : total.plus((levels[item.id] ?? new Decimal(0)).times(item.clickBonus)), new Decimal(1)),
    [levels]
  );
  const perSecond = resourcesPerSecond(rate, clickYield(level, multiplier), levels);
  const maxSlider = Math.min(1000, Math.max(3, cap.toNumber()));

  return (
    <div className="panel-scroll">
      <section className="card">
        <h3>自动点击</h3>
        <div className="metric"><span>当前速率 / 上限</span><strong>{formatNumber(rate)} / {formatNumber(cap)} 次/秒</strong></div>
        <input
          aria-label="自动点击速率"
          type="range"
          min="0"
          max={maxSlider}
          step="0.1"
          value={Math.min(rate.toNumber(), maxSlider)}
          onChange={(e) => setRate(new Decimal(e.currentTarget.value))}
        />
        <div className="metric"><span>累计自动点击</span><strong>{formatNumber(clicks)}</strong></div>
      </section>
      <section className="card">
        <h3>每秒资源净产出</h3>
        {RESOURCE_IDS.map((id) => (
          <div className="metric" key={id}>
            <span>{RESOURCE_META[id].name}</span>
            <strong className="green">+{formatNumber(perSecond[id])}</strong>
          </div>
        ))}
      </section>
    </div>
  );
}

export function TradePanel(): React.JSX.Element {
  const resources = useGame((s) => s.resources);
  const market = useGame((s) => s.market);
  const trade = useGame((s) => s.trade);
  const [from, setFrom] = useState<ResourceId>("wood");
  const [to, setTo] = useState<ResourceId>("food");
  const [amount, setAmount] = useState("10");

  const quantity = new Decimal(amount || 0);
  const received = from === to ? new Decimal(0) : quantity.times(market[from]).div(market[to]).times(0.95);

  return (
    <div className="panel-scroll">
      <section className="card">
        <h3>市场行情 <small>每 60 秒刷新 · 价格含 ±30% 浮动</small></h3>
        <div className="market-head"><span>资源</span><span>买入价</span><span>持有量</span></div>
        {RESOURCE_IDS.map((id) => (
          <div className="market-row" key={id}>
            <span>{RESOURCE_META[id].name}</span>
            <strong>{formatNumber(market[id])}</strong>
            <span>{formatNumber(resources[id])}</span>
          </div>
        ))}
      </section>
      <section className="card">
        <h3>资源兑换 <small>交易手续费 5%</small></h3>
        <div className="trade-controls">
          <select value={from} onChange={(e) => setFrom(e.target.value as ResourceId)}>
            {RESOURCE_IDS.map((id) => <option key={id} value={id}>{RESOURCE_META[id].name}</option>)}
          </select>
          <span>换</span>
          <select value={to} onChange={(e) => setTo(e.target.value as ResourceId)}>
            {RESOURCE_IDS.map((id) => <option key={id} value={id}>{RESOURCE_META[id].name}</option>)}
          </select>
        </div>
        <input value={amount} inputMode="decimal" onChange={(e) => setAmount(e.currentTarget.value)} />
        <p className="muted">兑换比例 1:{from === to ? "0" : formatNumber(market[from].div(market[to]))} · 预计获得 {formatNumber(received)} {RESOURCE_META[to].name}</p>
        <button disabled={from === to || quantity.lessThanOrEqualTo(0) || resources[from].lessThan(quantity)} onClick={() => trade(from, to, quantity)}>确认兑换</button>
        <button
          className="secondary"
          onClick={() => {
            const candidates = RESOURCE_IDS.filter((id) => id !== from).sort((a, b) => market[b].comparedTo(market[a]));
            const best = candidates[0];
            if (best) {
              setTo(best);
              trade(from, best, resources[from].div(2));
            }
          }}
        >一键最优兑换</button>
      </section>
    </div>
  );
}

const ACHIEVEMENTS = [
  "首次采集",
  "十次采集",
  "百次采集",
  "等级 5",
  "等级 10",
  ...RESOURCE_IDS.map((id) => `${RESOURCE_META[id].name}储备`),
  ...BUILDINGS.map((item) => `${item.name}建造`)
].slice(0, 30);

export function CodexPanel(): React.JSX.Element {
  const levels = useGame((s) => s.buildings);
  const achievements = useGame((s) => s.achievements);

  return (
    <div className="panel-scroll">
      <section className="card">
        <h3>建筑图鉴</h3>
        {BUILDINGS.map((item) => {
          const unlocked = (levels[item.id] ?? new Decimal(0)).greaterThan(0);
          return (
            <div className="metric" key={item.id}>
              <span className={unlocked ? "" : "silhouette"}>{unlocked ? item.name : "???"}</span>
              <strong>{unlocked ? `Lv.${formatNumber(levels[item.id] ?? new Decimal(0))}` : "未解锁"}</strong>
            </div>
          );
        })}
      </section>
      <section className="card">
        <h3>成就 · {achievements.length} / 30</h3>
        {ACHIEVEMENTS.map((name, index) => (
          <div className="metric" key={name}>
            <span>{achievements[index] ? name : "???"}</span>
            <strong>{achievements[index] ? "已达成" : "未解锁"}</strong>
          </div>
        ))}
      </section>
      <section className="card">
        <h3>事件图鉴</h3>
        <div className="metric"><span>漂流木箱 · 暴风雨 · 海鸟群 · 商人到访</span><strong>待探索</strong></div>
      </section>
    </div>
  );
}

export function AnimatedPanel({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <motion.div key="active-panel" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
      {children}
    </motion.div>
  );
}
