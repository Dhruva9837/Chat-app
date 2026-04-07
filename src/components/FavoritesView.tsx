'use client'

import React from 'react'
import { Star, LayoutGrid } from 'lucide-react'

export function FavoritesView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0F0F12] font-sans h-full overflow-hidden p-8">
      <div className="w-24 h-24 bg-[#161618] rounded-[2.5rem] shadow-xl flex items-center justify-center mb-8 border border-outline-variant rotate-3 hover:rotate-6 transition-transform group">
        <Star className="w-10 h-10 text-noir-accent group-hover:fill-noir-accent transition-all" />
      </div>
      <h2 className="font-display font-black text-2xl text-white tracking-tight mb-3">No Saved Transmissions</h2>
      <p className="text-text-muted font-sans font-bold tracking-widest uppercase text-[10px] text-center max-w-[280px]">
        Mark contacts or messages to actively construct your local databank here.
      </p>
    </div>
  )
}
