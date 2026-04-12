'use client'

import React from 'react';
import { 
  X, 
  Bell, 
  Calendar, 
  Layout, 
  MessageSquare,
  FileText,
  Link,
  ChevronRight,
  MicOff,
  Clock,
  Eye,
  Download,
  ShieldAlert,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getAvatarUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const CleanInfoPanel = () => {
  const { user } = useAuthStore();
  const { 
    activeChat, 
    showInfoPanel, 
    setShowInfoPanel, 
    deleteChat, 
    blockUser, 
    unblockUser, 
    blockedUsers 
  } = useChatStore();
  
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!activeChat || !showInfoPanel) return null;

  const isGroup = activeChat.type === 'group';
  const otherParticipant = activeChat.chat_participants?.find((p: any) => p.user_id !== user?.id);
  const otherUser = otherParticipant?.profiles;
  const isBlocked = otherUser ? blockedUsers.includes(otherUser.id) : false;
  
  const photos = [
    { src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format&fit=crop', id: 1 },
    { src: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=200&auto=format&fit=crop', id: 2 },
    { src: 'https://images.unsplash.com/photo-1574126154517-d1e0d89ef734?q=80&w=200&auto=format&fit=crop', id: 3 },
  ];

  const sharedFiles = [
    { name: 'Contract for the provision of printing services', size: '2.0 Mb', id: 1 },
    { name: 'Changes in the schedule of the department of material ...', size: '1.4 Mb', id: 2 },
    { name: 'Contract for the provision of printing services', size: '3.1 Mb', id: 3 },
  ];

  const sharedLinks = [
    { title: 'Economic Policy', url: 'https://vm.fi/en/economic-policy', icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-O9F9o_ZIDf8hE6o0mF_U1iE6f_o1G8nOg&s' },
    { title: 'Microsoft', url: 'https://www.microsoft.com/', icon: 'https://www.microsoft.com/favicon.ico' },
  ];

  return (
    <motion.aside 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute md:relative inset-y-0 right-0 w-full md:w-[340px] h-full noir-sidebar-right flex flex-col z-50 md:z-10 shrink-0 select-none overflow-hidden bg-surface-lowest md:bg-transparent shadow-2xl md:shadow-none"
    >
      {/* Header */}
      <div className="px-8 pt-10 pb-6 flex items-center justify-between">
        <h2 className="text-[17px] font-display font-black text-white tracking-tight uppercase">Chat Info</h2>
        <button 
          onClick={() => setShowInfoPanel(false)}
          className="p-1.5 text-text-muted hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Action Grid */}
      <div className="px-8 flex items-center justify-between mb-10">
        {[
          { icon: Bell, label: 'Notify' },
          { icon: Calendar, label: 'Events' },
          { icon: Layout, label: 'Media' },
          { icon: MicOff, label: 'Mute' },
        ].map((action, idx) => (
          <button 
            key={idx}
            className="w-[58px] h-[58px] bg-surface-high rounded-[1.2rem] flex items-center justify-center text-text-muted hover:text-white transition-all hover:bg-[#2A2A2C] border border-outline-variant shadow-sm"
          >
            <action.icon size={22} strokeWidth={2} />
          </button>
        ))}
      </div>

      {/* Scrollable Content Sections */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-10 space-y-10">
        
        {/* Photos & Videos */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-none">
               Photos and Videos <span className="ml-2 opacity-50">104</span>
             </h3>
             <button className="text-[10px] font-black text-text-muted hover:text-white transition-colors uppercase tracking-widest">See all</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
             {photos.map(photo => (
               <div key={photo.id} className="w-[110px] h-[75px] rounded-[1rem] overflow-hidden shrink-0 border border-outline-variant cursor-pointer group">
                  <img src={photo.src} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
               </div>
             ))}
          </div>
        </section>

        {/* Shared Files */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest">
               Shared Files <span className="ml-2 opacity-50">1 384</span>
             </h3>
             <button className="text-[10px] font-black text-text-muted hover:text-white uppercase tracking-widest">See all</button>
          </div>
          <div className="space-y-4">
             {sharedFiles.map(file => (
               <div key={file.id} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-[46px] h-[46px] bg-surface-high rounded-[1rem] flex items-center justify-center text-text-muted group-hover:bg-[#2A2A2C] transition-colors border border-outline-variant">
                     <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[12px] font-bold text-white truncate group-hover:text-noir-accent transition-colors">
                      {file.name}
                    </h4>
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-0.5">
                      {file.size}
                    </p>
                  </div>
               </div>
             ))}
          </div>
        </section>

        {/* Shared Links */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest">
               Shared Links <span className="ml-2 opacity-50">32</span>
             </h3>
             <button className="text-[10px] font-black text-text-muted hover:text-white uppercase tracking-widest">See all</button>
          </div>
          <div className="space-y-4">
             {sharedLinks.map((link, idx) => (
               <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-[46px] h-[46px] bg-surface-high rounded-[1rem] overflow-hidden flex items-center justify-center border border-outline-variant shrink-0 group-hover:scale-105 transition-transform duration-300">
                     <img src={link.icon} alt="" className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <h4 className="text-[12px] font-bold text-white group-hover:text-noir-accent transition-colors">{link.title}</h4>
                     <p className="text-[10px] text-text-muted truncate lowercase mt-1">{link.url}</p>
                  </div>
               </div>
             ))}
          </div>
        </section>

        {/* Danger Zone */}
        {!isGroup && otherUser && (
          <section className="pt-6 border-t border-noir-accent/10">
            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 opacity-80">Danger Zone</h3>
            <div className="space-y-3">
              {isBlocked ? (
                <button 
                  onClick={() => unblockUser(otherUser.id)}
                  className="w-full py-4 bg-surface-high hover:bg-[#2A2A2C] border border-outline-variant rounded-2xl flex items-center justify-center gap-3 text-white transition-all group"
                >
                  <Unlock size={18} className="text-noir-accent group-hover:scale-110 transition-transform" />
                  <span className="text-[12px] font-black uppercase tracking-widest">Unblock User</span>
                </button>
              ) : (
                <button 
                  onClick={() => blockUser(otherUser.id)}
                  className="w-full py-4 bg-surface-high hover:bg-rose-500/5 border border-outline-variant hover:border-rose-500/30 rounded-2xl flex items-center justify-center gap-3 text-text-muted hover:text-rose-500 transition-all group"
                >
                  <Lock size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[12px] font-black uppercase tracking-widest">Block User</span>
                </button>
              )}

              {isDeleting ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { deleteChat(activeChat.id); setShowInfoPanel(false); }}
                    className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20"
                  >
                    <Trash2 size={18}/>
                    <span className="text-[11px] font-black uppercase tracking-widest">Confirm Delete</span>
                  </button>
                  <button 
                    onClick={() => setIsDeleting(false)}
                    className="flex-1 py-4 bg-surface-high hover:bg-[#2A2A2C] text-text-muted rounded-2xl flex items-center justify-center text-[11px] font-black uppercase tracking-widest border border-outline-variant"
                  >
                    Abort
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsDeleting(true)}
                  className="w-full py-4 bg-surface-high hover:bg-rose-500/5 border border-outline-variant hover:border-rose-500/30 rounded-2xl flex items-center justify-center gap-3 text-text-muted hover:text-rose-500 transition-all group"
                >
                  <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[12px] font-black uppercase tracking-widest">Delete Conversation</span>
                </button>
              )}
            </div>
          </section>
        )}

      </div>
    </motion.aside>
  );
};
