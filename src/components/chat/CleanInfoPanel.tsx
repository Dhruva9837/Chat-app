import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Layers, 
  ChevronRight, 
  ArrowRight,
  HardDrive,
  MoreHorizontal
} from 'lucide-react';

import { useChatStore } from '@/store/chatStore';
import { getAvatarUrl } from '@/lib/utils';

const fileTypes = [
  { icon: FileText, label: 'Documents', count: 126, size: '193MB', color: 'bg-indigo-50 text-indigo-500' },
  { icon: ImageIcon, label: 'Photos', count: 53, size: '321MB', color: 'bg-amber-50 text-amber-500' },
  { icon: Film, label: 'Movies', count: 3, size: '210MB', color: 'bg-teal-50 text-teal-500' },
  { icon: Layers, label: 'Other', count: 49, size: '194MB', color: 'bg-rose-50 text-rose-500' },
];

export const CleanInfoPanel = () => {
  const { activeChat } = useChatStore();

  if (!activeChat) return null;

  const isGroup = activeChat.type === 'group';
  const memberCount = activeChat.chat_participants?.length || 0;
  
  const otherProfile = !isGroup 
    ? activeChat.chat_participants?.find((p: any) => p.user_id !== activeChat.created_by)?.profiles 
    : null;

  const chatName = isGroup ? (activeChat.name || 'Unnamed Group') : (otherProfile?.name || 'User');
  const chatSubtitle = isGroup ? `${memberCount} members` : 'Personal Chat';

  return (
    <div className="w-80 h-full bg-surface-lowest flex flex-col border-l border-outline-variant shadow-sm transition-colors duration-300">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-outline-variant">
        <button className="w-8 h-8 rounded-full bg-surface-low flex items-center justify-center text-text-muted hover:bg-surface-main transition-all">
          <ChevronRight size={18} className="rotate-180" />
        </button>
        <h2 className="text-base font-bold text-text-main">Shared files</h2>
        <button className="w-8 h-8 rounded-full bg-surface-low flex items-center justify-center text-text-muted hover:bg-surface-main transition-all">
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Group/User Detail Card */}
      <div className="p-6">
        <div className="bg-surface-low/30 rounded-[2rem] p-8 border border-outline-variant flex flex-col items-center gap-6 relative overflow-hidden group">
          <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-surface-lowest -rotate-6 group-hover:rotate-0 transition-transform duration-500 scale-110">
            <img 
              src={getAvatarUrl(isGroup ? activeChat : otherProfile)} 
              alt={chatName} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center mt-2">
            <h3 className="text-lg font-bold text-text-main truncate max-w-[200px]">{chatName}</h3>
            <p className="text-xs text-text-muted font-bold mt-1 uppercase tracking-wider">{chatSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="px-6 grid grid-cols-2 gap-4">
        <div className="bg-mint-500 rounded-2xl p-5 text-white shadow-lg shadow-mint-500/10 relative overflow-hidden group cursor-pointer">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <FileText size={14} />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">All files</span>
          </div>
          <p className="text-3xl font-bold">231</p>
          <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-white rounded-full opacity-50"></div>
        </div>
        <div className="bg-surface-low rounded-2xl p-5 text-text-main border border-outline-variant relative overflow-hidden hover:bg-surface-main transition-all cursor-pointer">
          <div className="flex items-center gap-2 mb-3 text-text-muted">
             <div className="w-6 h-6 rounded-lg bg-surface-main flex items-center justify-center text-text-muted">
                <ImageIcon size={14} />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest">All links</span>
          </div>
          <p className="text-3xl font-bold">45</p>
          <div className="absolute right-4 top-4 w-1.5 h-1.5 bg-mint-500 rounded-full"></div>
        </div>
      </div>

      {/* File Categories */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4 no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">File type</h4>
          <button className="text-text-muted hover:text-text-main">
             <MoreHorizontal size={18} />
          </button>
        </div>
        
        {fileTypes.map((type, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-4 p-2 rounded-2xl hover:bg-surface-low cursor-pointer group transition-all"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type.color} shadow-sm group-hover:scale-105 transition-all duration-300`}>
              <type.icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-bold text-text-main group-hover:text-mint-500 transition-colors">{type.label}</h5>
              <p className="text-[11px] text-text-muted font-bold mt-0.5">
                {type.count} files, {type.size}
              </p>
            </div>
            <div className="text-text-muted group-hover:text-mint-500 group-hover:translate-x-1 transition-all">
              <ChevronRight size={18} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
