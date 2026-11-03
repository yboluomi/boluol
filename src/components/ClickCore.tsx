import { useMemo, useRef } from "react";
import Decimal from "break_infinity.js";
import { useGame } from "../store/game";
import { clickYield } from "../engine/level";
import { BUILDINGS } from "../engine/buildings";
import { formatNumber } from "../hooks/useFormatNumber";

export function ClickCore(): React.JSX.Element {
  const click = useGame((state) => state.click);
  const level = useGame((state) => state.level);
  const buildings = useGame((state) => state.buildings);
  const pressed = useRef(false);

  const multiplier = useMemo(
    () => BUILDINGS.reduce((total, item) =>
      item.clickBonus === undefined ? total : total.plus((buildings[item.id] ?? new Decimal(0)).times(item.clickBonus)),
      new Decimal(1)
    ),
    [buildings]
  );

  return (
    <section className="core-area">
      <div className="level-line">生存等级 <b>{formatNumber(level)}</b></div>
      <button
        className={`island-core ${pressed.current ? "pressed" : ""}`}
        onClick={() => {
          pressed.current = true;
          click();
          window.setTimeout(() => { pressed.current = false; }, 120);
        }}
        aria-label="采集资源"
      >
        <span className="core-rings" />
        <span className="core-label">采集</span>
        <span className="core-yield">+{formatNumber(clickYield(level, multiplier))}</span>
      </button>
      <div className="core-hint">点击核心，同时采集全部资源</div>
    </section>
  );
}
