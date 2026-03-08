// lib/constants.ts

export const PLATFORM_FEE_PERCENTAGE = 4.9;
export const PLATFORM_FEE_MULTIPLIER = 1 + (PLATFORM_FEE_PERCENTAGE / 100);

/**
 * Calculates the total amount (donation + platform fee) and rounds up to the nearest cent.
 */
export function calculateTotalWithFee(donation: number): number {
  return Math.ceil(donation * PLATFORM_FEE_MULTIPLIER * 100) / 100;
}
