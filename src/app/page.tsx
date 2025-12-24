'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useExperienceStore } from '@/store/experience';
import { VoidPage } from '@/components/VoidPage';
import { CustomCursor } from '@/components/CustomCursor';
import { Overlay } from '@/components/Overlay';

// Dynamic import for Three.js components (no SSR)
const Experience = dynamic(() => import('@/components/Experience'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#050507]" />
});

export default function Home() {
  const [isBurned, setIsBurned] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { initDNA, burnSession } = useExperienceStore(); // Updated hook

  useEffect(() => {
    // Check if session is burned / Create new Universe
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();
        
        // In Multiverse mode, we might just always get a seed
        // "Burned" logic is strictly for "You cannot go back to THAT specific universe"
        // But for now we just want infinite forward movement.
        
        if (data.seed) {
           initDNA(data.seed);
           setIsBurned(false);
        } else {
           setIsBurned(true); // Should happen rarely with infinite mode
        }
      } catch {
        // Fallback Local Universe
        initDNA(Math.random().toString(36));
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
  }, [initDNA, burnSession]);

  if (isLoading || isBurned === null) {
    return <div className="w-full h-screen bg-[#050507]" />;
  }

  if (isBurned) {
    return <VoidPage />;
  }

  return (
    <main className="w-full h-screen overflow-hidden bg-[#050507]">
      <Overlay />
      <CustomCursor />
      <Experience />
    </main>
  );
}
