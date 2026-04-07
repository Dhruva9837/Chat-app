'use client'

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Globe, 
  Lock, 
  ArrowRight,
  Sparkles,
  MessageSquare,
  Hash,
  LogIn,
  Loader2,
  X
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getAvatarUrl } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export const GroupsView = () => {
  const { chats, setActiveChat, setActiveView, setNewGroupModalOpen } = useChatStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'private'>('all');

  const groups = chats.filter((chat: any) => {
    if (chat.type !== 'group') return false;
    if (search && !(chat.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (activeFilter === 'public' && chat.is_private) return false;
    if (activeFilter === 'private' && !chat.is_private) return false;
    return true;
  });

  const handleJoinGroup = async () => {
    if (!inviteCode.trim() || !user) return;
    setJoinLoading(true);
    setJoinError('');
    setJoinSuccess('');

    try {
      // Look up the group by invite code (we use the chat ID or a name match)
      const { data: groupData, error: groupError } = await supabase
        .from('chats')
        .select('*')
        .eq('type', 'group')
        .or(`id.eq.${inviteCode.trim()},name.ilike.%${inviteCode.trim()}%`)
        .limit(1)
        .single();

      if (groupError || !groupData) {
        setJoinError('Group not found. Check the invite code and try again.');
        setJoinLoading(false);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('chat_id', groupData.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        setJoinError('You are already a member of this group.');
        setJoinLoading(false);
        return;
      }

      // Join the group
      const { error: joinErr } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: groupData.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinErr) {
        setJoinError('Failed to join group. Please try again.');
        setJoinLoading(false);
        return;
      }

      setJoinSuccess(`Successfully joined "${groupData.name}"!`);
      setTimeout(() => {
        setShowJoinModal(false);
        setInviteCode('');
        setJoinSuccess('');
        // Refresh the page to load new group
        window.location.reload();
      }, 1500);
    } catch (err) {
      setJoinError('An unexpected error occurred.');
    } finally {
      setJoinLoading(false);
    }
  };

  const getParticipantCount = (chat: any) => {
    return chat.chat_participants?.length || 0;
  };

  return (
    <div className="flex-1 h-full bg-[#0F0F12] flex flex-col transition-colors duration-300 overflow-hidden text-white relative">
      {/* Header */}
      <div className="px-10 py-12 flex flex-col gap-6 border-b border-outline-variant bg-[#0F0F12]/80 backdrop-blur-md z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black font-display tracking-tight text-white mb-2">Groups</h1>
            <p className="text-text-muted font-bold text-sm tracking-wide">Join communities and collaborate with your team</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#242426] text-white rounded-2xl font-bold border border-outline-variant hover:border-noir-accent hover:text-noir-accent hover:scale-105 transition-all"
            >
              <LogIn size={18} />
              Join Group
            </button>
            <button 
              onClick={() => setNewGroupModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-noir-accent text-white rounded-2xl font-bold shadow-lg shadow-noir-accent/20 hover:scale-105 transition-all"
            >
              <Plus size={18} />
              Create Group
            </button>
          </div>
        </div>

        {/* Filters/Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative group">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-noir-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search groups by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-[#161618] border border-outline-variant rounded-2xl text-white placeholder:text-text-muted shadow-sm focus:ring-2 focus:ring-noir-accent/20 transition-all outline-none font-medium"
            />
          </div>
          <div className="flex bg-[#161618] p-1.5 rounded-2xl border border-outline-variant shadow-sm">
            {(['all', 'public', 'private'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                  activeFilter === filter
                    ? 'bg-noir-accent text-white shadow-md'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-10 py-8 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured/Create Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => setNewGroupModalOpen(true)}
            className="bg-gradient-to-br from-[#1a1a3e] to-[#0d0d2b] rounded-[2.5rem] p-8 text-white relative overflow-hidden group cursor-pointer shadow-xl flex flex-col justify-between min-h-[280px] border border-[#2a2a5e]/50"
          >
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-noir-accent/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <div className="w-14 h-14 bg-noir-accent/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-noir-accent/30">
                <Sparkles size={28} className="text-noir-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Build a Space</h3>
              <p className="text-white/50 text-sm font-medium leading-relaxed">Create a hub for your project team or community interests.</p>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold bg-noir-accent text-white px-5 py-2.5 rounded-xl self-start hover:shadow-lg transition-all group-hover:translate-x-1">
              Start Now <ArrowRight size={16} />
            </button>
          </motion.div>

          {/* Group Cards */}
          {groups.map((group: any) => (
            <motion.div 
              key={group.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setActiveChat(group);
                setActiveView('chat');
              }}
              className="bg-[#161618] border border-outline-variant rounded-[2.5rem] p-8 hover:border-noir-accent/30 transition-all group cursor-pointer flex flex-col gap-6"
            >
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-outline-variant">
                  <img src={getAvatarUrl(group)} alt={group.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-[#242426] rounded-lg text-[10px] font-bold text-text-muted flex items-center gap-1 border border-outline-variant">
                     {group.is_private ? <Lock size={10} /> : <Globe size={10} />}
                     {group.is_private ? 'Private' : 'Public'}
                   </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-noir-accent transition-colors mb-2 truncate">
                  {group.name || 'Unnamed Group'}
                </h3>
                <p className="text-text-muted text-[13px] line-clamp-2 leading-relaxed">
                  {group.description || 'Dedicated workspace for collaboration and real-time communication.'}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-outline-variant flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {(group.chat_participants || []).slice(0, 3).map((p: any, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#161618] overflow-hidden">
                        <img src={getAvatarUrl(p.profiles)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-text-muted">
                    {getParticipantCount(group)} member{getParticipantCount(group) !== 1 ? 's' : ''}
                  </span>
                </div>
                <button className="flex items-center gap-2 text-xs font-bold text-noir-accent opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  Open <MessageSquare size={14} />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Empty State */}
          {groups.length === 0 && (
            <div className="col-span-1 lg:col-span-2 h-full flex flex-col items-center justify-center py-20 bg-[#161618]/30 rounded-[2.5rem] border border-dashed border-outline-variant">
              <Users size={64} className="text-text-muted mb-6 opacity-20" />
              <h3 className="text-xl font-bold text-white mb-2">No groups yet</h3>
              <p className="text-text-muted text-sm max-w-[300px] text-center mb-8">You haven't joined any groups yet. Create one or use an invite code to join.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowJoinModal(true)}
                  className="px-6 py-3 bg-[#242426] border border-outline-variant rounded-2xl text-white font-bold hover:border-noir-accent transition-all"
                >
                  Join with Code
                </button>
                <button 
                  onClick={() => setNewGroupModalOpen(true)}
                  className="px-6 py-3 bg-noir-accent rounded-2xl text-white font-bold shadow-lg shadow-noir-accent/20 hover:scale-105 transition-all"
                >
                  Create Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Join Group Modal Overlay */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[460px] bg-[#161618] rounded-[2.5rem] p-10 border border-outline-variant shadow-2xl"
            >
              {/* Close */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-noir-accent/20 rounded-2xl flex items-center justify-center text-noir-accent">
                    <LogIn size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black font-display text-white">Join a Group</h2>
                    <p className="text-text-muted text-xs font-bold">Enter a group name or invite code below</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowJoinModal(false)}
                  className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-[#242426] transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Input */}
              <div className="relative mb-6">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinGroup()}
                  placeholder="Group name or invite code..."
                  className="w-full pl-12 pr-6 py-4 bg-[#0F0F12] border border-outline-variant rounded-2xl text-white placeholder:text-text-muted focus:ring-2 focus:ring-noir-accent/30 outline-none font-medium transition-all"
                  autoFocus
                />
              </div>

              {/* Error / Success */}
              {joinError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold"
                >
                  {joinError}
                </motion.div>
              )}
              {joinSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 text-sm font-bold"
                >
                  {joinSuccess}
                </motion.div>
              )}

              {/* Action */}
              <button
                onClick={handleJoinGroup}
                disabled={joinLoading || !inviteCode.trim()}
                className="w-full py-4 bg-noir-accent text-white font-bold rounded-2xl shadow-lg shadow-noir-accent/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joinLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Join Group
                  </>
                )}
              </button>

              <p className="text-center text-text-muted text-[11px] font-bold mt-4">
                Ask the group admin for the group name or invite code
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
