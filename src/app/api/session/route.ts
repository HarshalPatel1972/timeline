import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Multiverse Logic: Infinite unique experiences.
// Each call generates a new, unique seed.

const usedSeeds = new Set<string>();

function generateSeed(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: Request) {
  const seed = generateSeed();
  
  // Just in case of a cosmic ray bit flip
  if (usedSeeds.has(seed)) {
    return NextResponse.json({ burned: true }); 
  }
  
  usedSeeds.add(seed);

  return NextResponse.json({
    burned: false,
    seed: seed,
    birth: Date.now(),
  }, {
    headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    }
  });
}
