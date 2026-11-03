import { useEffect } from "react";
import Decimal from "break_infinity.js";
import { useGame } from "../store/game";

export function useGameLoop(): void {
  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    let accumulator = 0;

    const run = (now: number): void => {
      accumulator += Math.max(0, (now - previous) / 1000);
      previous = now;

      if (accumulator >= 1) {
        const elapsed = accumulator;
        accumulator = 0;
        useGame.getState().advance(new Decimal(elapsed));
      }

      frame = requestAnimationFrame(run);
    };

    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, []);
}
