import { NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory storage (would use Redis in production)
const burnedFingerprints = new Set<string>();
const activeSessions = new Map<string, { seed: string; birth: number }>();

function generateFingerprint(request: Request): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const components = `${userAgent}|${acceptLanguage}|${Date.now()}`;
  return crypto.createHash('sha256').update(components).digest('hex').substring(0, 32);
}

function generateSeed(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: Request) {
  // Simple fingerprint based on headers (imperfect but workable)
  const userAgent = request.headers.get('user-agent') || '';
  const simpleFingerprint = crypto.createHash('md5').update(userAgent).digest('hex').substring(0, 16);
  
  // Check if burned
  if (burnedFingerprints.has(simpleFingerprint)) {
    return NextResponse.json({ burned: true });
  }
  
  // Get or create session
  let session = activeSessions.get(simpleFingerprint);
  if (!session) {
    session = {
      seed: generateSeed(),
      birth: Date.now(),
    };
    activeSessions.set(simpleFingerprint, session);
  }
  
  return NextResponse.json({
    burned: false,
    seed: session.seed,
    birth: session.birth,
  });
}
