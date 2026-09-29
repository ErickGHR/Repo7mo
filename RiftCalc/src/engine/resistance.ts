export function resistanceMultiplier(resistance: number): number {
  return resistance >= 0
    ? 100 / (100 + resistance)
    : 2 - 100 / (100 - resistance);
}
/** Flat reduction, % reduction, % penetration, flat penetration. Penetration never makes resistance negative. */
export function applyPenetration(
  resistance: number,
  percent = 0,
  flat = 0,
  flatReduction = 0,
  percentReduction = 0,
): number {
  const reduced = resistance - flatReduction;
  const afterReduction =
    reduced > 0 ? reduced * (1 - percentReduction) : reduced;
  return afterReduction > 0
    ? Math.max(0, afterReduction * (1 - percent) - flat)
    : afterReduction;
}
export const calculatePhysicalDamage = (raw: number, armor: number) =>
  raw * resistanceMultiplier(armor);
export const calculateMagicDamage = (raw: number, mr: number) =>
  raw * resistanceMultiplier(mr);
export const calculateTrueDamage = (raw: number) => raw;
export const applyArmor = calculatePhysicalDamage;
export const applyMagicResistance = calculateMagicDamage;
