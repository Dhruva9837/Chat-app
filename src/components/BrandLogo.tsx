import React from 'react';
import { motion } from 'framer-motion';

export const BrandLogo = ({ collapsed = false }: { collapsed?: boolean }) => {
  return (
    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
      {/* Visual Identity Mark */}
      <motion.div 
        whileHover={{ rotate: 180, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="relative w-10 h-10 flex shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-primary to-indigo-800 shadow-lg shadow-primary/30"
      >
        <div className="absolute inset-0.5 rounded-[10px] bg-surface-lowest flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </motion.div>

      {/* Typographic Identity */}
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-display font-black text-xl tracking-tight text-text-main leading-none">NEXORA</span>
          <span className="text-[9px] font-black uppercase text-primary tracking-[0.3em] leading-tight">Connect</span>
        </div>
      )}
    </div>
  );
};
