'use client';

import { motion } from 'framer-motion';

export function VoidPage() {
  return (
    <div className="w-full h-screen bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
      {/* The scar - a thin vertical line */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 0.4, scaleY: 1 }}
        transition={{ duration: 4, ease: 'easeOut' }}
        className="w-[1px] h-[40vh]"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(60, 55, 65, 0.2) 30%, rgba(60, 55, 65, 0.1) 70%, transparent 100%)',
        }}
      />
      
      {/* Subtle static overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
