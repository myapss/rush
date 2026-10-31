export const CM_PER_INCH = 2.54;
export const KG_PER_LB = 0.45359237;

export function cmFromFeetInches(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH;
}

export function feetInchesFromCm(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function kgFromLb(lb: number): number {
  return lb * KG_PER_LB;
}

export function lbFromKg(kg: number): number {
  return kg / KG_PER_LB;
}

export function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
