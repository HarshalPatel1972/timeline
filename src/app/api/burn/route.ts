import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Shared with session route (in production, use Redis)
const burnedFingerprints = new Set<string>();

export async function POST(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';
  const simpleFingerprint = crypto.createHash('md5').update(userAgent).digest('hex').substring(0, 16);
  
  // Burn this fingerprint forever
  burnedFingerprints.add(simpleFingerprint);
  
  return NextResponse.json({ burned: true });
}
