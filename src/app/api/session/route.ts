import { NextResponse } from 'next/server';
import crypto from 'crypto';

// We no longer permanently burn the USER, we only burn the SESSION (Seed).
// Multiverse Logic: Infinite unique experiences, none repeatable.

const usedSeeds = new Set<string>();

function generateSeed(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: Request) {
  // Always generate a fresh seed
  // The client sees a new "Universe" every time.
  const seed = generateSeed();
  
  if (usedSeeds.has(seed)) {
    // Statistically impossible, but sanity check
    return NextResponse.json({ burned: true }); 
  }
  
  usedSeeds.add(seed); // Mark this seed as used/witnessed

  return NextResponse.json({
    burned: false,
    seed: seed,
    birth: Date.now(),
  });
}
