'use client'

import React from 'react'
import { Star, Bookmark, Archive, Search, MoreVertical, FileText, ImageIcon, MessageSquare } from 'lucide-react'

export function SavedView() {
  const savedItems = [
    { id: 1, title: 'Project Monolith Rendering', type: 'image', date: 'Oct 24', author: 'Julian Vane' },
    { id: 2, title: 'Final Budget Approval', type: 'file', date: 'Oct 22', author: 'Alex Rivers' },
    { id: 3, title: 'Architectural Philosophy', type: 'message', date: 'Oct 20', author: 'Me' },
  ]

  return (
    <div className="flex-1 bg-bg-base overflow-y-auto px-8 md:px-16 lg:px-24 pt-20 pb-20 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Editorial Header */}
        <header className="mb-20 space-y-6">
          <div className="flex items-center space-x-3 text-primary">
            <Star className="w-6 h-6 fill-primary" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em]">Curated Archive</span>
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl text-gray-900 tracking-tighter leading-none">
            Saved Architecture
          </h1>
          <p className="text-zinc-400 font-sans tracking-tight text-lg max-w-xl leading-relaxed">
            High-fidelity message nodes and architectural assets pinned for orbital reference and long-term synthesis.
          </p>
        </header>

        {/* Collection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {savedItems.map((item) => (
             <div key={item.id} className="bg-white rounded-[2rem] p-8 border border-[#f1f1f1] hover:border-primary/20 hover:translate-y-[-4px] transition-all cursor-pointer ambient-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                
                <div className="w-12 h-12 rounded-2xl bg-surface-low flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                   {item.type === 'image' && <ImageIcon className="w-5 h-5" />}
                   {item.type === 'file' && <FileText className="w-5 h-5" />}
                   {item.type === 'message' && <MessageSquare className="w-5 h-5" />}
                </div>

                <div className="space-y-4 relative z-10">
                   <h3 className="font-display font-black text-xl text-gray-900 leading-tight tracking-tight">
                     {item.title}
                   </h3>
                   <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-lg bg-surface-low overflow-hidden">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-400 tracking-tight">{item.author} • {item.date}</span>
                   </div>
                </div>
                
                <button className="absolute top-6 right-6 text-zinc-300 hover:text-primary transition-colors">
                   <Bookmark className="w-4 h-4 fill-current" />
                </button>
             </div>
           ))}

           {/* Empty Asset Placeholder */}
           <div className="bg-[#f8faff] rounded-[2.5rem] border-2 border-dashed border-[#eef2ff] flex flex-col items-center justify-center p-8 min-h-[300px] text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#eef2ff] flex items-center justify-center text-zinc-300">
                 <Plus className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300">Sync New Asset</p>
           </div>
        </div>

        {/* Global Stats Footer */}
        <div className="mt-32 pt-12 border-t border-zinc-100 flex items-center justify-between opacity-40 select-none">
           <span className="text-[10px] font-black uppercase tracking-[0.3em]">v1.0.4 Editorial Engine</span>
           <div className="flex space-x-8">
              <span className="text-[10px] font-bold">3 ARCHIVED</span>
              <span className="text-[10px] font-bold">12.4 GB TOTAL</span>
           </div>
        </div>
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <line x1="12" y1="5" x2="12" y2="19" />
       <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
