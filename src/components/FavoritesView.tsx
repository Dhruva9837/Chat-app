'use client'

import React from 'react'
import { Star, LayoutGrid } from 'lucide-react'

export function FavoritesView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9ff] font-sans h-full overflow-hidden p-8">
      <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-8 border border-[#f1f1f1] rotate-3 hover:rotate-6 transition-transform group">
        <Star className="w-10 h-10 text-primary group-hover:fill-primary transition-all" />
      </div>
      <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight mb-3">No Favorites Yet</h2>
      <p className="text-zinc-500 font-sans tracking-tight leading-relaxed text-sm text-center max-w-[280px]">
        Mark contacts or messages as favorites to quickly access them here.
      </p>
    </div>
  )
}
