import Decimal from "break_infinity.js";

export interface LevelState {
  level: Decimal;
  exp: Decimal;
}

export const expRequirement = (level: Decimal): Decimal =>
  new Decimal(100).times(new Decimal(1.35).pow(level.minus(1).max(0)));

export const clickYield = (level: Decimal, multiplier: Decimal): Decimal =>
  new Decimal(1).times(new Decimal(1.15).pow(level.minus(1).max(0))).times(multiplier);

/** 逐级结算升级；没有等级上限，经验和等级均以 Decimal 保存。 */
export const applyExperience = (state: LevelState, gained: Decimal): LevelState => {
  let level = state.level;
  let exp = state.exp.plus(gained);
  while (exp.greaterThanOrEqualTo(expRequirement(level))) {
    exp = exp.minus(expRequirement(level));
    level = level.plus(1);
  }
  return { level, exp };
};