import { useState } from "react";
import Decimal from "break_infinity.js";
import { motion } from "framer-motion";
import { BUILDINGS, buildingCost, type BuildingKind } from "../engine/buildings";
import { automationCap, productionPerSecond, resourcesPerSecond } from "../engine/automation";
import { RESOURCE_IDS, RESOURCE_META, type ResourceId } from "../engine/resources";
import { useGame } from "../store/game";
import { formatNumber } from "../hooks/useFormatNumber";

const categories: { id: BuildingKind; title: string }[] = [
  { id: "survival", title: "生存" }, { id: "production", title: "生产" },
  { id: "tool", title: "工具" }, { id: "special", title: "特殊" }
];

export function BuildPanel(): React.JSX.Element {
  const resources = useGame((s) => s.resources);
  const levels = useGame((s) => s.buildings);
  const buy = useGame((s) => s.buyBuilding);
  return <div className="panel-scroll">
    {categories.map((category) => <section key={category.id}>
      <h3>{category.title}</h3>
      {BUILDINGS.filter((item) => item.kind === category.id).map((item) => {
        const level = levels[item.id] ?? new Decimal(0);
        const cost = buildingCost(item, level);
        const affordable = resources[item.costResource].greaterThanOrEqualTo(cost);
        return <article className="building-row" key={item.id}>
          <div><strong>{item.name} <small>Lv.{formatNumber(level)}</small></strong><p>{item.effect}</p>
            <small>消耗 {RESOURCE_META[item.costResource].name} {formatNumber(cost)}</small></div>
          <button disabled={!affordable} onClick={() => buy(item.id)}>建造</button>
        </article>;
      })}
    </section>)}
  </div>;
}

export function AutomationPanel(): React.JSX.Element {
  const rate = useGame((s) => s.automationRate);
  const cap = useGame((s) => automationCap(s.buildings));
  const levels = useGame((s) => s.buildings);
  const resources = useGame((s) => s.resources);
  const clicks = useGame((s) => s.autoClicks);
  const setRate = useGame((s) => s.setAutomation);
  const yieldPerClick = resourcesPerSecond(new Decimal(1), new Decimal(0), levels);
  const production = productionPerSecond(levels);
  return <div className="panel-scroll">
    <section className="card">
      <h3>自动点击</h3>
      <div className="metric"><span>当前速率 / 上限</span><strong>{formatNumber(rate)} / {formatNumber(cap)} 次/秒</strong></div>
      <input aria-label="自动点击速率" type="range" min="0" max={Math.max(1, cap.toNumber())}
        step="0.1" value={Math.min(rate.toNumber(), cap.toNumber())}
        onChange={(event) => setRate(new Decimal(event.currentTarget.value))} />
      <div className="metric"><span>累计自动点击</span><strong>{formatNumber(clicks)}</strong></div>
      <div className="metric"><span>自动采集估算</span><strong>{formatNumber(yieldPerClick.wood.times(rate))} / 秒</strong></div>
    </section>
    <section className="card"><h3>资源生产 / 秒</h3>
      {RESOURCE_IDS.map((id) => <div className="metric" key={id}><span>{RESOURCE_META[id].name}</span>
        <strong className="green">+{formatNumber(production[id])}</strong></div>)}
    </section>
    <div className="muted">当前储备：{formatNumber(resources.wood)} 木材</div>
  </div>;
}

export function TradePanel(): React.JSX.Element {
  const resources = useGame((s) => s.resources);
  const market = useGame((s) => s.market);
  const trade = useGame((s) => s.trade);
  const [from, setFrom] = useState<ResourceId>("wood");
  const [to, setTo] = useState<ResourceId>("food");
  const [amount, setAmount] = useState("10");
  const quantity = new Decimal(amount || 0);
  const received = quantity.times(market[from]).div(market[to]).times(0.95);
  return <div className="panel-scroll">
    <section className="card">
      <h3>市场行情 <small>每 60 秒刷新</small></h3>
      <div className="market-table">
        <div className="market-head"><span>资源</span><span>价格</span><span>持有</span></div>
        {RESOURCE_IDS.map((id) => <div className="market-row" key={id}>
          <span>{RESOURCE_META[id].name}</span><strong>{formatNumber(market[id])}</strong>
          <span>{formatNumber(resources[id])}</span>
        </div>)}
      </div>
    </section>
    <section className="card">
      <h3>资源兑换 <small>含 5% 手续费</small></h3>
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
      <p className="muted">预计获得 {formatNumber(received)} {RESOURCE_META[to].name}</p>
      <button disabled={from === to || resources[from].lessThan(quantity)}
        onClick={() => trade(from, to, quantity)}>确认兑换</button>
      <button className="secondary" onClick={() => {
        const best = RESOURCE_IDS.filter((id) => id !== from)
          .sort((a, b) => market[b].comparedTo(market[a]))[0];
        if (best) { setTo(best); trade(from, best, resources[from].div(2)); }
      }}>一键最优兑换</button>
    </section>
  </div>;
}

export function CodexPanel(): React.JSX.Element {
  const levels = useGame((s) => s.buildings);
  const achievements = useGame((s) => s.achievements);
  const names = ["初次采集","初见储备","登岛者","营地建立","持续生产","等级提升","岛屿熟手","野外专家","海岸观察者","生存者"];
  return <div className="panel-scroll">
    <section className="card"><h3>建筑图鉴</h3>
      {BUILDINGS.map((item) => <div className="metric" key={item.id}>
        <span>{(levels[item.id] ?? new Decimal(0)).greaterThan(0) ? item.name : "???"}</span>
        <strong>{(levels[item.id] ?? new Decimal(0)).greaterThan(0) ? `Lv.${formatNumber(levels[item.id] ?? new Decimal(0))}` : "未解锁"}</strong>
      </div>)}
    </section>
    <section className="card"><h3>成就 · {achievements.length} / 30</h3>
      {Array.from({ length: 30 }, (_, index) => {
        const unlocked = achievements.includes(`achievement_${index}`);
        return <div className="metric" key={index}><span>{unlocked ? (names[index % names.length] ?? "生存记录") : "???"}</span>
          <strong>{unlocked ? "已达成" : "未解锁"}</strong></div>;
      })}
    </section>
    <section className="card"><h3>事件记录</h3><div className="metric"><span>海岛事件</span><strong>漂流木箱 / 暴风雨 / 海鸟群 / 商人到访</strong></div></section>
  </div>;
}

export function AnimatedPanel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <motion.div key="active-panel" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .16 }}>
    {children}
  </motion.div>;
}