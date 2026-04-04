'use client'

import React from 'react'
import { Star, Clock, Trash2 } from 'lucide-react'

export function FavsView() {
  return (
    <div className="flex-1 bg-bg-base overflow-y-auto px-12 pt-24 pb-12">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="font-display font-black text-4xl text-gray-900 tracking-tight">Favorites</h1>
          <p className="text-zinc-500 font-sans tracking-tight">Your favorite conversations and important messages.</p>
        </header>

        <div className="grid gap-4">
           {/* Mock Empty Favs */}
            <div className="bg-surface-low rounded-lg p-16 text-center ambient-shadow border border-white/50">
               <Star className="w-12 h-12 text-zinc-300 mx-auto mb-6" />
               <h2 className="font-display font-bold text-xl text-gray-800">No Favorites Yet</h2>
               <p className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto font-sans leading-relaxed">
                  Your favorite conversations will appear here for quick access.
               </p>
            </div>
        </div>
      </div>
    </div>
  )
}
