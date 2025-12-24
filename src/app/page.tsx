'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useExperienceStore } from '@/store/experience';
import { VoidPage } from '@/components/VoidPage';
import { CustomCursor } from '@/components/CustomCursor';

// Dynamic import for Three.js components (no SSR)
const Experience = dynamic(() => import('@/components/Experience'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#050507]" />
});

export default function Home() {
  const [isBurned, setIsBurned] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { initSession, burnSession } = useExperienceStore();

  useEffect(() => {
    // Check if session is burned
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();
        setIsBurned(data.burned);
        
        if (!data.burned) {
          initSession(data.seed);
        }
      } catch {
        // Fallback - create local session
        initSession(Math.random().toString(36).substring(2));
        setIsBurned(false);
      }
      
      setTimeout(() => setIsLoading(false), 100);
    };

    checkSession();

    // Burn session on exit
    const handleUnload = () => {
      navigator.sendBeacon('/api/burn');
      burnSession();
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [initSession, burnSession]);

  if (isLoading || isBurned === null) {
    return <div className="w-full h-screen bg-[#050507]" />;
  }

  if (isBurned) {
    return <VoidPage />;
  }

  return (
    <main className="w-full h-screen overflow-hidden bg-[#050507]">
      <CustomCursor />
      <Experience />
    </main>
  );
}
