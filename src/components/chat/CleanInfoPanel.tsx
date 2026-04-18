'use client'

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Calendar, 
  Layout, 
  FileText,
  MicOff,
  Trash2,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Search,
  Loader2,
  Users
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getAvatarUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export const CleanInfoPanel = () => {
  const { user } = useAuthStore();
  const { 
    activeChat, 
    showInfoPanel, 
    setShowInfoPanel, 
    deleteChat, 
    blockUser, 
    unblockUser, 
    blockedUsers,
    messages,
    updateChat
  } = useChatStore();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Fetch all profiles when add-member panel opens
  useEffect(() => {
    if (!showAddMember || !user) return;
    supabase
      .from('profiles')
      .select('id, name, avatar_url, username')
      .neq('id', user.id)
      .then(({ data }) => { if (data) setAllProfiles(data); });
  }, [showAddMember, user]);

  // Compute real media and links from messages
  const photos = React.useMemo(() => {
    return messages
      .filter(m => m.message_type === 'image' && m.image_url)
      .map(m => ({ src: m.image_url!, id: m.id }));
  }, [messages]);

  const sharedLinks = React.useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links: { title: string, url: string, icon: string }[] = [];
    
    messages.forEach(m => {
      if (m.message_type === 'text') {
        const matches = m.content.match(urlRegex);
        if (matches) {
          matches.forEach(url => {
            try {
              const domain = new URL(url).hostname;
              links.push({
                title: domain,
                url: url,
                icon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
              });
            } catch (e) {
              // Invalid URL
            }
          });
        }
      }
    });
    return links;
  }, [messages]);

  if (!activeChat || !showInfoPanel) return null;

  const isGroup = activeChat.type === 'group';
  const otherParticipant = activeChat.chat_participants?.find((p: any) => p.user_id !== user?.id);
  const otherUser = otherParticipant?.profiles;
  const isBlocked = otherUser ? blockedUsers.includes(otherUser.id) : false;
  
  const chatName = isGroup ? (activeChat.name || 'Group Chat') : (otherUser?.name || 'User');
  const chatAvatar = getAvatarUrl(isGroup ? activeChat : otherUser);

  return (
    <motion.aside 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute md:relative inset-y-0 right-0 w-full md:w-[340px] h-full noir-sidebar-right flex flex-col z-50 md:z-10 shrink-0 select-none overflow-hidden bg-surface-lowest md:bg-transparent shadow-2xl md:shadow-none border-l border-outline-variant/30"
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

      {/* Profile Overview (Added Real Data) */}
      <div className="px-8 pb-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-[2.2rem] overflow-hidden border-4 border-[#202022] bg-surface-bubble shadow-xl mb-4">
          <img 
            src={chatAvatar} 
            alt={chatName} 
            className="w-full h-full object-cover" 
          />
        </div>
        <h3 className="text-xl font-display font-black text-white tracking-tight text-center uppercase">
          {chatName}
        </h3>
        <p className="text-[11px] font-black text-noir-accent uppercase tracking-[0.2em] mt-1">
          {isGroup ? 'Group Conversation' : (isBlocked ? 'Blocked' : 'Online')}
        </p>
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
        
        {/* Photos & Videos Section */}
        {photos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-none">
                 Photos and Videos <span className="ml-2 opacity-50">{photos.length}</span>
               </h3>
               <button className="text-[10px] font-black text-text-muted hover:text-white transition-colors uppercase tracking-widest">See all</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
               {photos.slice(0, 10).map(photo => (
                 <div key={photo.id} className="w-[110px] h-[75px] rounded-[1rem] overflow-hidden shrink-0 border border-outline-variant cursor-pointer group">
                    <img src={photo.src} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* Shared Links Section */}
        {sharedLinks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                 Shared Links <span className="ml-2 opacity-50">{sharedLinks.length}</span>
               </h3>
               <button className="text-[10px] font-black text-text-muted hover:text-white uppercase tracking-widest">See all</button>
            </div>
            <div className="space-y-4">
               {sharedLinks.slice(0, 5).map((link, idx) => (
                 <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-[46px] h-[46px] bg-surface-high rounded-[1rem] overflow-hidden flex items-center justify-center border border-outline-variant shrink-0 group-hover:scale-105 transition-transform duration-300">
                       <img src={link.icon} alt="" className="w-8 h-8 object-contain opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-[12px] font-bold text-white group-hover:text-noir-accent transition-colors truncate">{link.title}</h4>
                       <p className="text-[10px] text-text-muted truncate lowercase mt-1">{link.url}</p>
                    </div>
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* Shared Files (Placeholder for future) */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest">
               Shared Files <span className="ml-2 opacity-50">0</span>
             </h3>
          </div>
          <div className="py-4 border border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center opacity-40">
            <FileText size={20} className="mb-2 text-text-muted" />
            <span className="text-[10px] font-black uppercase tracking-widest">No files shared</span>
          </div>
        </section>

        {/* Group Members Section */}
        {isGroup && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Users size={12} />
                Members <span className="opacity-50">{activeChat.chat_participants?.length || 0}</span>
              </h3>
              <button
                onClick={() => setShowAddMember(v => !v)}
                className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                  showAddMember ? 'bg-noir-accent text-white' : 'text-noir-accent hover:bg-noir-accent/10'
                }`}
              >
                <UserPlus size={14} />
                Add
              </button>
            </div>

            {/* Add Member Search */}
            <AnimatePresence>
              {showAddMember && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="relative mb-2">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search to add..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="w-full bg-surface-high border border-outline-variant rounded-xl py-2.5 pl-8 pr-3 text-[12px] text-white outline-none focus:ring-2 focus:ring-noir-accent/30"
                    />
                  </div>
                  <div className="max-h-[160px] overflow-y-auto no-scrollbar space-y-1">
                    {allProfiles
                      .filter(p =>
                        !activeChat.chat_participants?.some((cp: any) => cp.user_id === p.id) &&
                        (p.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                         p.username?.toLowerCase().includes(memberSearch.toLowerCase()))
                      )
                      .map(p => (
                        <button
                          key={p.id}
                          disabled={addingId === p.id}
                          onClick={async () => {
                            setAddingId(p.id);
                            try {
                              const { error } = await supabase
                                .from('chat_participants')
                                .insert({ chat_id: activeChat.id, user_id: p.id, role: 'member' });
                              if (error) throw error;
                              // Update local state
                              const newParticipant = { 
                                user_id: p.id, 
                                id: crypto.randomUUID(),
                                chat_id: activeChat.id,
                                joined_at: new Date().toISOString(),
                                role: 'member' as const, 
                                profiles: p 
                              };
                              updateChat(activeChat.id, {
                                chat_participants: [...(activeChat.chat_participants || []), newParticipant as any]
                              });
                            } catch (err: any) {
                              alert(err.message);
                            } finally {
                              setAddingId(null);
                            }
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-high transition-all text-left"
                        >
                          <img src={getAvatarUrl(p)} className="w-8 h-8 rounded-xl" alt="" />
                          <span className="text-[12px] font-bold text-white flex-1 truncate">{p.name}</span>
                          {addingId === p.id
                            ? <Loader2 size={14} className="text-noir-accent animate-spin" />
                            : <UserPlus size={14} className="text-noir-accent" />}
                        </button>
                      ))
                    }
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current Members List */}
            <div className="space-y-1">
              {(activeChat.chat_participants || []).map((p: any) => {
                const memberProfile = p.profiles;
                const isMe = p.user_id === user?.id;
                const isAdmin = p.role === 'admin';
                const amIAdmin = activeChat.chat_participants?.find((cp: any) => cp.user_id === user?.id)?.role === 'admin';

                return (
                  <div key={p.user_id} className="flex items-center gap-3 px-3 py-2 rounded-xl group hover:bg-surface-high transition-all">
                    <img src={getAvatarUrl(memberProfile)} className="w-9 h-9 rounded-xl shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">
                        {memberProfile?.name || 'User'}{isMe ? ' (You)' : ''}
                      </p>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">{isAdmin ? 'Admin' : 'Member'}</p>
                    </div>
                    {amIAdmin && !isMe && (
                      <button
                        disabled={removingId === p.user_id}
                        onClick={async () => {
                          setRemovingId(p.user_id);
                          try {
                            const { error } = await supabase
                              .from('chat_participants')
                              .delete()
                              .eq('chat_id', activeChat.id)
                              .eq('user_id', p.user_id);
                            if (error) throw error;
                            updateChat(activeChat.id, {
                              chat_participants: activeChat.chat_participants?.filter((cp: any) => cp.user_id !== p.user_id)
                            });
                          } catch (err: any) {
                            alert(err.message);
                          } finally {
                            setRemovingId(null);
                          }
                        }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        {removingId === p.user_id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <UserMinus size={14} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

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
