// lib/constants.ts

export const PLATFORM_FEE_PERCENTAGE = 4.9;
export const PLATFORM_FEE_MULTIPLIER = 1 + (PLATFORM_FEE_PERCENTAGE / 100);

export const MAX_PENDING_RESERVATIONS = 5;
export const RESERVATION_TTL_DAYS = 14;

// Floor for the per-meeting donation a profile can ask for. Sub-$10 asks made
// the 4.9% fee round to pennies and undercut the "meaningful donation" pitch.
export const MIN_DONATION_USD = 10;

// After the listener accepts, money sits in escrow until both parties confirm
// the meeting happened. If neither acts within this window, the meeting is
// auto-refunded back to the pitcher.
export const ESCROW_TIMEOUT_DAYS = 30;

/**
 * Calculates the total amount (donation + platform fee) and rounds up to the nearest cent.
 */
export function calculateTotalWithFee(donation: number): number {
  return Math.ceil(donation * PLATFORM_FEE_MULTIPLIER * 100) / 100;
}
