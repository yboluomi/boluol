import { useEffect, useState } from "react";
import Decimal from "break_infinity.js";
import { ResourceBar } from "./components/ResourceBar";
import { ClickCore } from "./components/ClickCore";
import { AnimatedPanel, AutomationPanel, BuildPanel, CodexPanel, TradePanel } from "./components/Panels";
import { useGame } from "./store/game";
import { useGameLoop } from "./hooks/useGameLoop";
import { formatNumber } from "./hooks/useFormatNumber";

type Tab = "build" | "trade" | "automation" | "codex";
const tabs: { id: Tab; label: string }[] = [
  { id: "build", label: "建造" }, { id: "trade", label: "交易" },
  { id: "automation", label: "自动化" }, { id: "codex", label: "图鉴" }
];

export default function App(): React.JSX.Element {
  useGameLoop();
  const [tab, setTab] = useState<Tab>("build");
  const [guide, setGuide] = useState(() => localStorage.getItem("island-guide") !== "done");
  const [guideStep, setGuideStep] = useState(0);
  const notice = useGame((s) => s.notification);
  const clearNotice = useGame((s) => s.clearNotice);
  const autoClicks = useGame((s) => s.autoClicks);
  const rate = useGame((s) => s.automationRate);
  const levels = useGame((s) => s.level);
  const panel = tab === "build" ? <BuildPanel /> : tab === "trade" ? <TradePanel /> :
    tab === "automation" ? <AutomationPanel /> : <CodexPanel />;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(clearNotice, 4500);
    return () => window.clearTimeout(timer);
  }, [notice, clearNotice]);

  useEffect(() => {
    const prior = Number(localStorage.getItem("island-last-seen") ?? Date.now());
    const hours = Math.min(8, Math.max(0, (Date.now() - prior) / 3_600_000));
    if (hours > 0.02) {
      const state = useGame.getState();
      const elapsed = new Decimal(hours * 3600);
      const offlineResources = state.resources.wood.plus(state.automationRate.times(elapsed));
      if (offlineResources.greaterThan(state.resources.wood)) {
        window.setTimeout(() => {
          if (window.confirm(`离线 ${hours.toFixed(2)} 小时，自动采集约 ${formatNumber(offlineResources.minus(state.resources.wood)} 木材。领取？`)) {
            const gain = offlineResources.minus(state.resources.wood);
            const resources = { ...state.resources, wood: state.resources.wood.plus(gain) };
            useGame.setState({ resources });
          }
        }, 300);
      }
    }
    const saveTime = (): void => localStorage.setItem("island-last-seen", String(Date.now()));
    window.addEventListener("beforeunload", saveTime);
    return () => window.removeEventListener("beforeunload", saveTime);
  }, []);

  const completeGuide = (): void => {
    localStorage.setItem("island-guide", "done");
    setGuide(false);
  };

  return <main className="app-shell">
    <ResourceBar />
    {notice && <div className="event-strip">{notice}</div>}
    <section className="status-strip">
      <span>等级 <b>{formatNumber(levels)}</b></span>
      <span>自动点击 <b>{formatNumber(rate)}</b> / 秒</span>
      <span>累计自动 <b>{formatNumber(autoClicks)}</b></span>
    </section>
    <ClickCore />
    {guide && <section className="guide-card">
      <div className="eyebrow">快速指引 · {guideStep + 1} / 3</div>
      <p>{["点击岛屿核心，同步采集七种资源。","在建造面板升级建筑，获得永久增益。","打开自动化面板，配置自动点击频率。"][guideStep]}</p>
      <button onClick={() => guideStep < 2 ? setGuideStep(guideStep + 1) : completeGuide()}>
        {guideStep < 2 ? "下一步" : "开始生存"}
      </button>
    </section>}
    <section className="panel-area"><AnimatedPanel>{panel}</AnimatedPanel></section>
    <nav className="tab-bar">
      {tabs.map((item) => <button key={item.id} className={tab === item.id ? "selected" : ""}
        onClick={() => setTab(item.id)}>{item.label}</button>)}
    </nav>
  </main>;
}