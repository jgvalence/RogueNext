/**
 * Seeded PRNG using mulberry32 algorithm.
 * Produces deterministic sequences from a string seed.
 */

export interface RNG {
  /** Returns a float in [0, 1) */
  next(): number;
  /** Returns an integer in [min, max] (inclusive) */
  nextInt(min: number, max: number): number;
  /** Returns a new shuffled copy of the array (Fisher-Yates) */
  shuffle<T>(arr: readonly T[]): T[];
  /** Pick a random element from the array */
  pick<T>(arr: readonly T[]): T;
  /** The original seed string */
  seed: string;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRNG(seed: string): RNG {
  const numericSeed = hashString(seed);
  const nextFloat = mulberry32(numericSeed);

  const rng: RNG = {
    seed,

    next(): number {
      return nextFloat();
    },

    nextInt(min: number, max: number): number {
      return Math.floor(rng.next() * (max - min + 1)) + min;
    },

    shuffle<T>(arr: readonly T[]): T[] {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = rng.nextInt(0, i);
        [result[i], result[j]] = [result[j]!, result[i]!];
      }
      return result;
    },

    pick<T>(arr: readonly T[]): T {
      return arr[rng.nextInt(0, arr.length - 1)]!;
    },
  };

  return rng;
}
