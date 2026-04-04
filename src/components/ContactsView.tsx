'use client'

import React from 'react'
import { Users, UserPlus, Search, Mail, MessageSquare, Phone, MoreVertical, ShieldCheck, Globe, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { supabase } from '@/lib/supabase'

export function ContactsView() {
  const { user } = useAuthStore()
  const { setChats, setActiveChat, setActiveView } = useChatStore()
  const [profiles, setProfiles] = React.useState<any[]>([])
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
      
      if (!error && data) setProfiles(data)
      setLoading(false)
    }

    fetchProfiles()
  }, [user?.id])

  const startChat = async (targetUserId: string) => {
    // 1. Find if a private chat already exists
    const { data: myChats } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', user?.id)

    const chatIds = myChats?.map(c => c.chat_id) || []

    const { data: existingParticipant } = await supabase
      .from('chat_participants')
      .select('chat_id, chats!inner(type)')
      .in('chat_id', chatIds)
      .eq('user_id', targetUserId)
      .eq('chats.type', 'private')
      .maybeSingle()

    if (existingParticipant) {
      // Fetch full chat details
      const { data: fullChat } = await supabase
        .from('chats')
        .select('*, chat_participants(user_id, profiles:user_id(*))')
        .eq('id', existingParticipant.chat_id)
        .single()
      
      if (fullChat) {
        setActiveChat(fullChat)
        setActiveView('chat')
        return
      }
    }

    // 2. If not, create a new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({ type: 'private' })
      .select()
      .single()

    if (createError || !newChat) {
      console.error('Error creating chat:', createError)
      return
    }

    // 3. Add both participants
    const { error: partError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_id: newChat.id, user_id: user?.id },
        { chat_id: newChat.id, user_id: targetUserId }
      ])

    if (partError) {
      console.error('Error adding participants:', partError)
      return
    }

    // 4. Update local state and navigation
    // We need to re-fetch the chat with participant details to match Sidebar's expectation
    const { data: fullChat } = await supabase
      .from('chats')
      .select('*, chat_participants(user_id, profiles:user_id(*))')
      .eq('id', newChat.id)
      .single()

    if (fullChat) {
      setChats([fullChat, ...useChatStore.getState().chats])
      setActiveChat(fullChat)
      setActiveView('chat')
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex bg-bg-base overflow-hidden font-sans">
      {/* Contacts List */}
      <div className="w-full md:w-[350px] lg:w-[400px] bg-white border-r border-[#f1f1f1] flex flex-col shrink-0 overflow-hidden">
        <div className="p-8 flex items-center justify-between pb-6">
          <h1 className="font-display font-black text-3xl tracking-tight text-gray-900 leading-none">Contacts</h1>
          <button className="p-2.5 bg-[#eef2ff] text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
             <UserPlus className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..." 
              className="w-full bg-[#f8faff] rounded-xl py-3.5 pl-11 pr-4 text-sm focus:bg-white outline-none transition-all placeholder:text-zinc-300 border border-transparent focus:border-primary/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24 no-scrollbar">
           {loading ? (
             <div className="p-8 text-center text-zinc-400 font-bold tracking-tight animate-pulse flex flex-col items-center">
                <Globe className="w-10 h-10 mb-4 text-primary/20 animate-spin" />
                Loading contacts...
             </div>
           ) : (
             <AnimatePresence mode="popLayout">
               {filteredProfiles.map((profile, index) => (
                 <motion.button 
                  layout
                  key={profile.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startChat(profile.id)}
                  className="w-full p-5 rounded-[2rem] flex items-center justify-between bg-white hover:bg-white transition-all group ambient-shadow hover:ambient-shadow-lg ring-1 ring-black/5"
                 >
                    <div className="flex items-center space-x-5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-[1.75rem] bg-white overflow-hidden shadow-sm border-2 border-white group-hover:rotate-3 transition-transform duration-500">
                           <img 
                            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email || profile.id}`} 
                            alt="" 
                            className="w-full h-full object-cover" 
                           />
                        </div>
                        {profile.status === 'online' && (
                           <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary-presence rounded-full border-4 border-white z-20 shadow-sm animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                         <h3 className="font-display font-black text-[17px] text-gray-900 truncate tracking-tighter mb-1 transition-colors group-hover:text-primary">
                           {profile.name}
                         </h3>
                         <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${profile.status === 'online' ? 'text-secondary-presence' : 'text-zinc-400'}`}>
                           {profile.status || 'Offline'}
                         </span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-primary/5 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                       <ArrowRight className="w-5 h-5" />
                    </div>
                 </motion.button>
               ))}
             </AnimatePresence>
           )}
        </div>
      </div>

      {/* Profile Detail Workspace */}
      <div className="hidden md:flex flex-1 items-center justify-center p-12 bg-[#f8faff] relative overflow-hidden">
         <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
         <div className="text-center max-w-[320px] z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 rotate-3 border border-[#f1f1f1]">
               <Globe className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight uppercase tracking-widest mb-3">Contact Details</h2>
            <p className="text-zinc-400 font-sans tracking-tight leading-relaxed text-sm mb-10">
               View contact information and chat history. Select a contact to see more details.
            </p>
            <div className="flex space-x-4">
               <ActionButton icon={Mail} label="Email" />
               <ActionButton icon={ShieldCheck} label="Verify" />
            </div>
         </div>
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, label }: any) {
  return (
     <div className="flex flex-col items-center space-y-2 opacity-40">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center ambient-shadow border border-[#f1f1f1]">
           <Icon className="w-5 h-5 text-gray-900" />
        </div>
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
           {label}
        </span>
     </div>
  )
}
