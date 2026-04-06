'use client'

import React, { useState } from 'react'
import { Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useChatStore } from '@/store/chatStore'

export function SettingsView() {
  const { fontSize, setFontSize } = useChatStore()
  const [notif, setNotif] = useState(true)
  const [sound, setSound] = useState(true)
  const [readReceipts, setReadReceipts] = useState(true)

  return (
    <div className="flex-1 overflow-y-auto bg-surface-lowest flex flex-col h-[100dvh] font-sans pb-24">
      {/* Header */}
      <div className="h-24 px-8 flex items-center justify-between sticky top-0 bg-primary z-50 shadow-lg shrink-0">
         <div className="flex items-center space-x-4">
            <h1 className="font-display font-black text-2xl text-white tracking-widest uppercase">Settings</h1>
         </div>
      </div>

      <div className="flex-1 px-4 md:px-8 py-6 md:py-10 max-w-2xl mx-auto w-full space-y-6">
        
        {/* Appearance Settings */}
        <div className="bg-white rounded-3xl p-6 ambient-shadow border border-outline-variant">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-[1.25rem] flex items-center justify-center text-primary">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-gray-900 leading-none mb-1 text-text-main">Appearance</h2>
              <p className="text-xs font-medium text-text-muted">Customize your app interface</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-low rounded-2xl">
              <span className="text-sm font-bold text-text-main">Theme Mode</span>
              <ThemeToggle />
            </div>

            <div className="p-5 bg-surface-low rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-text-main">Chat Font Scaling</span>
                <span className="text-xs font-black text-primary">{fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="12" 
                max="24" 
                value={fontSize} 
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-primary" 
              />
            </div>
          </div>
        </div>

        {/* Other settings placeholders */}
        <div className="bg-white rounded-3xl p-6 ambient-shadow border border-outline-variant">
           <h2 className="font-display font-black text-lg text-gray-900 mb-4 text-text-main">Notifications</h2>
           <div className="space-y-3">
              <div className="flex justify-between items-center bg-surface-low p-4 rounded-xl cursor-pointer" onClick={() => setNotif(!notif)}>
                 <span className="text-sm font-bold text-text-main">Push Notifications</span>
                 <div className={`w-10 h-6 rounded-full relative transition-colors ${notif ? 'bg-primary' : 'bg-outline-variant'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notif ? 'right-1' : 'left-1'}`}></div>
                 </div>
              </div>
              <div className="flex justify-between items-center bg-surface-low p-4 rounded-xl cursor-pointer" onClick={() => setSound(!sound)}>
                 <span className="text-sm font-bold text-text-main">Sound Effects</span>
                 <div className={`w-10 h-6 rounded-full relative transition-colors ${sound ? 'bg-primary' : 'bg-outline-variant'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${sound ? 'right-1' : 'left-1'}`}></div>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-6 ambient-shadow border border-outline-variant">
           <h2 className="font-display font-black text-lg text-gray-900 mb-4 text-text-main">Privacy</h2>
           <div className="space-y-3">
              <div className="flex justify-between items-center bg-surface-low p-4 rounded-xl cursor-pointer" onClick={() => setReadReceipts(!readReceipts)}>
                 <span className="text-sm font-bold text-text-main">Read Receipts</span>
                 <div className={`w-10 h-6 rounded-full relative transition-colors ${readReceipts ? 'bg-primary' : 'bg-outline-variant'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${readReceipts ? 'right-1' : 'left-1'}`}></div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
