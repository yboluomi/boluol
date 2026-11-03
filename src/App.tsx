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
  { id: "build", label: "建造" },
  { id: "trade", label: "交易" },
  { id: "automation", label: "自动化" },
  { id: "codex", label: "图鉴" }
];

export default function App(): React.JSX.Element {
  useGameLoop();
  const [tab, setTab] = useState<Tab>("build");
  const [guideStep, setGuideStep] = useState(0);
  const [guideOpen, setGuideOpen] = useState(() => localStorage.getItem("island-guide") !== "done");
  const [offlineGain, setOfflineGain] = useState<Decimal | null>(null);

  const notice = useGame((s) => s.notification);
  const clearNotice = useGame((s) => s.clearNotice);
  const totalClicks = useGame((s) => s.totalClicks);
  const rate = useGame((s) => s.automationRate);
  const level = useGame((s) => s.level);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(clearNotice, 4500);
    return () => window.clearTimeout(timer);
  }, [notice, clearNotice]);

  useEffect(() => {
    const now = Date.now();
    const prev = Number(localStorage.getItem("island-last-seen") ?? now);
    const elapsedSeconds = Math.max(0, (now - prev) / 1000);
    if (elapsedSeconds > 60) {
      const state = useGame.getState();
      const cap = state.automationRate.min(new Decimal(3));
      const offline = state.resources.wood.plus(cap.times(new Decimal(elapsedSeconds))).plus(new Decimal(25));
      setOfflineGain(offline.minus(state.resources.wood));
    }
    const save = () => localStorage.setItem("island-last-seen", String(Date.now()));
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, []);

  const panel = tab === "build" ? <BuildPanel /> : tab === "trade" ? <TradePanel /> : tab === "automation" ? <AutomationPanel /> : <CodexPanel />;

  const completeGuide = () => {
    localStorage.setItem("island-guide", "done");
    setGuideOpen(false);
  };

  return (
    <main className="app-shell">
      <ResourceBar />
      {notice && <div className="event-strip">{notice}</div>}
      <section className="status-strip">
        <span>等级 <b>{formatNumber(level)}</b></span>
        <span>自动点击 <b>{formatNumber(rate)}</b> / 秒</span>
        <span>���计点击 <b>{formatNumber(totalClicks)}</b></span>
      </section>
      <ClickCore />
      {guideOpen && (
        <section className="guide-card">
          <div className="eyebrow">快速指引 · {guideStep + 1} / 3</div>
          <p>{["点击岛屿核心，同步采集七种资源。", "在建造面板升级建筑，获得永久增益。", "打开自动化面板，配置自动点击频率。"][guideStep]}</p>
          <button onClick={() => (guideStep < 2 ? setGuideStep(guideStep + 1) : completeGuide())}>
            {guideStep < 2 ? "下一步" : "开始生存"}
          </button>
        </section>
      )}
      <section className="panel-area"><AnimatedPanel key={tab}>{panel}</AnimatedPanel></section>
      <nav className="tab-bar">
        {tabs.map((item) => (
          <button key={item.id} className={tab === item.id ? "selected" : ""} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      {offlineGain && (
        <div className="modal-backdrop">
          <section className="offline-card">
            <h2>离线结算</h2>
            <p>已获得矿木资源 <strong>{formatNumber(offlineGain)}</strong>。</p>
            <button onClick={() => setOfflineGain(null)}>领取并继续</button>
          </section>
        </div>
      )}
    </main>
  );
}
