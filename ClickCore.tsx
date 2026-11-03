import { useCallback, useRef } from "react";
import { useGame } from "../store/game";
import { formatNumber } from "../hooks/useFormatNumber";
import { clickYield } from "../engine/level";
import Decimal from "break_infinity.js";
import { BUILDINGS } from "../engine/buildings";

export function ClickCore(): React.JSX.Element {
  const click = useGame((state) => state.click);
  const level = useGame((state) => state.level);
  const buildings = useGame((state) => state.buildings);
  const active = useRef(false);
  const multiplier = BUILDINGS.reduce(
    (total, building) => building.clickBonus
      ? total.plus((buildings[building.id] ?? new Decimal(0)).times(building.clickBonus))
      : total,
    new Decimal(1)
  );
  const onClick = useCallback((): void => {
    active.current = true;
    window.setTimeout(() => { active.current = false; }, 120);
    click();
  }, [click]);

  return (
    <section className="core-area">
      <div className="level-line">生存等级 <b>{formatNumber(level)}</b></div>
      <button className={`island-core ${active.current ? "pressed" : ""}`} onClick={onClick} aria-label="采集资源">
        <span className="core-rings" />
        <span className="core-label">采集</span>
        <span className="core-yield">+{formatNumber(clickYield(level, multiplier))}</span>
      </button>
      <div className="core-hint">点击核心，同时采集全部资源</div>
    </section>
  );
}