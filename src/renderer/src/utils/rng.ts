/**
 * A pseudo-random number generator (PRNG) using the Mulberry32 algorithm.
 * This allows for seeded random number generation, ensuring consistent results across runs.
 */
export class RNG {
  private seed: number;

  constructor(seed: number = Math.random()) {
    this.seed = seed;
  }

  /**
   * Returns a pseudo-random number between 0 and 1.
   * Arrow function is used to bind `this` context automatically when passed as a callback.
   */
  random = (): number => {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
