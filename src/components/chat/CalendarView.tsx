'use client'

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Video, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Edit2, X, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
// @ts-ignore
import Holidays from 'date-holidays';

const hd = new Holidays('IN'); // Defaulting to Indian Holidays

export const CalendarView = () => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date()); // Start at today's real date
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate()); // Default to today
  const [view, setView] = useState<'month' | 'week'>('month');

  // Persistence State
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real worldwide holidays state mapped by day
  const [holidays, setHolidays] = useState<Record<number, any[]>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null); // If null, it's a new event
  const [eventForm, setEventForm] = useState({ title: '', time: '10:00 AM - 11:00 AM', type: 'meeting', members: 1 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 1. Fetch Events from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      setLoading(true);
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('event_date', startOfMonth.split('T')[0])
        .lte('event_date', endOfMonth.split('T')[0]);

      if (!error && data) {
        setEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();

    // 2. Real-time Subscription
    const channel = supabase
      .channel('calendar_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'calendar_events',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setEvents(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setEvents(prev => prev.map(ev => ev.id === payload.new.id ? payload.new : ev));
        } else if (payload.eventType === 'DELETE') {
          setEvents(prev => prev.filter(ev => ev.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, year, month]);

  // 3. Load Real Holidays
  useEffect(() => {
    const yearHolidays = hd.getHolidays(year);
    const newHolidaysMap: Record<number, any[]> = {};

    yearHolidays.forEach((holiday: any) => {
      const holidayDate = new Date(holiday.date);
      if (holidayDate.getMonth() === month && holidayDate.getFullYear() === year) {
        const day = holidayDate.getDate();
        if (!newHolidaysMap[day]) newHolidaysMap[day] = [];
        newHolidaysMap[day].push({
          id: `hld-${holiday.date}-${holiday.name}`,
          title: holiday.name,
          time: 'All Day Event',
          type: 'holiday',
          members: 0,
          isRealHoliday: true
        });
      }
    });

    setHolidays(newHolidaysMap);
  }, [year, month]);

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(1);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(1);
  };

  const handleDelete = async (id: string | number) => {
    if (typeof id === 'string' && id.startsWith('hld-')) return; // Cannot delete holidays

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) alert('Failed to delete event');
  };

  const handleOpenModal = (ev: any = null) => {
    if (ev && !ev.isRealHoliday) {
      setEditingEvent(ev);
      setEventForm({ title: ev.title, time: ev.time, type: ev.type, members: ev.members });
    } else {
      setEditingEvent(null);
      setEventForm({ title: '', time: '10:00 AM - 11:00 AM', type: 'meeting', members: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim() || !user) return;

    const eventData = {
      user_id: user.id,
      title: eventForm.title,
      time: eventForm.time,
      type: eventForm.type,
      members: eventForm.members,
      event_date: new Date(year, month, selectedDate).toISOString().split('T')[0]
    };

    if (editingEvent) {
      const { error } = await supabase
        .from('calendar_events')
        .update(eventData)
        .eq('id', editingEvent.id);
      
      if (error) alert('Failed to update event');
    } else {
      const { error } = await supabase
        .from('calendar_events')
        .insert([eventData]);
      
      if (error) alert('Failed to create event');
    }
    setIsModalOpen(false);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  // Adjust so Monday is 0
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; 

  // Combine user events and holidays for the currently selected date
  const selectedUserEvents = events.filter(ev => {
    const d = new Date(ev.event_date).getDate();
    return d === selectedDate;
  });
  const selectedHolidays = holidays[selectedDate] || [];
  const currentEvents = [...selectedHolidays, ...selectedUserEvents];

  return (
    <div className="flex-1 h-full bg-surface-lowest flex flex-col transition-colors duration-300 overflow-hidden text-white relative">
      
      {/* Header */}
      <div className="px-6 md:px-10 py-8 md:py-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant z-10 bg-surface-lowest/80 backdrop-blur-md">
        <div>
          <div className="flex gap-4 items-center mb-2">
            <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-white">Schedule</h1>
            <span className="bg-noir-accent/20 text-noir-accent px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-full border border-noir-accent/30 hidden md:flex items-center gap-1">
              <Sparkles size={12} /> Syncing Real Holidays
            </span>
          </div>
          <p className="text-text-muted font-bold text-xs md:text-sm tracking-wide">Manage your upcoming meetings and synchronized events.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-noir-accent text-white rounded-[1.2rem] font-bold shadow-lg shadow-noir-accent/20 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          New Event
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-6 md:p-10 flex flex-col xl:flex-row gap-8 overflow-y-auto no-scrollbar">
         
         {/* Upcoming Panel */}
         <div className="w-full xl:w-[35%] flex flex-col gap-6 shrink-0 lg:max-h-full">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-text-muted tracking-widest">Events for {monthName} {selectedDate}</h3>
              <span className="text-[10px] font-bold bg-surface-low px-3 py-1 rounded-full border border-outline-variant">{currentEvents.length} Events</span>
            </div>
            
            <AnimatePresence mode="wait">
              {currentEvents.length > 0 ? (
                <motion.div 
                  key={`events-${selectedDate}-${month}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4 overflow-y-auto no-scrollbar pb-10"
                >
                  {currentEvents.map(event => (
                    <motion.div 
                      key={event.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-6 bg-surface-low border border-outline-variant rounded-[2rem] flex flex-col gap-4 group/event transition-colors shadow-sm relative overflow-hidden ${event.isRealHoliday ? 'bg-gradient-to-br from-[#161618] to-orange-950/20 border-orange-500/20' : ''}`}
                    >
                       <div className="flex justify-between items-start">
                          <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center 
                            ${event.isRealHoliday ? 'bg-orange-500/20 text-orange-400' 
                            : event.type === 'video' ? 'bg-noir-accent/20 text-noir-accent' : 'bg-purple-500/20 text-purple-400'}`}>
                             {event.isRealHoliday ? <Sparkles size={20} /> : event.type === 'video' ? <Video size={20} /> : <CalendarIcon size={20} />}
                          </div>
                          
                          {/* Actions (Edit / Delete) - Cannot modify real holidays */}
                          {!event.isRealHoliday && (
                            <div className="flex gap-2 opacity-100 xl:opacity-0 group-hover/event:opacity-100 transition-opacity bg-surface-lowest p-1 rounded-xl border border-outline-variant">
                               <button onClick={() => handleOpenModal(event)} className="p-2 text-text-muted hover:text-noir-accent transition-colors">
                                 <Edit2 size={14} />
                               </button>
                               <button onClick={() => handleDelete(event.id)} className="p-2 text-text-muted hover:text-red-400 transition-colors">
                                 <Trash2 size={14} />
                               </button>
                            </div>
                          )}
                          {event.isRealHoliday && (
                            <span className="text-[9px] uppercase tracking-widest text-orange-400/80 font-black border border-orange-500/30 px-2 py-1 rounded-full">Public Holiday</span>
                          )}
                       </div>
                       <div>
                          <h4 className={`text-lg font-bold mb-1 ${event.isRealHoliday ? 'text-orange-100' : 'text-white'}`}>{event.title}</h4>
                          <p className="text-sm font-medium text-text-muted flex items-center gap-2">
                             <Clock size={14} /> {event.time}
                          </p>
                       </div>
                       
                       {!event.isRealHoliday && event.members > 0 && (
                         <div className="mt-2 flex -space-x-2">
                           {Array.from({length: event.members}).map((_, i) => (
                             <div key={i} className="w-8 h-8 rounded-full border-2 border-surface-low overflow-hidden">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=ev-${event.id}-${i}`} alt="" />
                             </div>
                           ))}
                         </div>
                       )}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="no-events"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-[2rem] bg-surface-low/30 p-10"
                >
                   <CalendarIcon size={40} className="text-text-muted mb-4 opacity-30" />
                   <p className="text-sm font-bold text-text-muted text-center max-w-[200px]">No meetings scheduled for this day.</p>
                   <button onClick={() => handleOpenModal()} className="mt-6 text-xs font-bold text-noir-accent hover:underline">Quick Add +</button>
                </motion.div>
              )}
            </AnimatePresence>
         </div>
         
         {/* Calendar Grid Structure */}
         <div className="flex-1 bg-surface-low rounded-[2.5rem] border border-outline-variant p-6 md:p-8 flex flex-col shadow-xl min-w-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
               <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                 <h2 className="text-xl md:text-2xl font-black font-display tracking-tight">{monthName} {year}</h2>
                 <div className="flex gap-1 bg-surface-high rounded-[1rem] p-1 border border-outline-variant">
                   <button onClick={prevMonth} className="px-3 py-2 hover:bg-surface-highest rounded-lg transition-colors"><ChevronLeft size={16} /></button>
                   <button onClick={nextMonth} className="px-3 py-2 hover:bg-surface-highest rounded-lg transition-colors"><ChevronRight size={16} /></button>
                 </div>
               </div>
               <div className="flex gap-2 w-full md:w-auto bg-surface-lowest p-1 rounded-[1.4rem]">
                  <button 
                    onClick={() => setView('month')}
                    className={`flex-1 md:flex-none px-5 py-2.5 rounded-[1.2rem] text-xs font-bold transition-all ${view === 'month' ? 'bg-surface-high text-white shadow-sm border border-outline-variant' : 'bg-transparent text-text-muted hover:text-white'}`}
                  >
                    Month
                  </button>
                  <button 
                    onClick={() => setView('week')}
                    className={`flex-1 md:flex-none px-5 py-2.5 rounded-[1.2rem] text-xs font-bold transition-all ${view === 'week' ? 'bg-surface-high text-white shadow-sm border border-outline-variant' : 'bg-transparent text-text-muted hover:text-white'}`}
                  >
                    Week
                  </button>
               </div>
            </div>
            
            {/* Interactive Monthly Grid */}
            <div className="flex-1 flex flex-col overflow-x-auto no-scrollbar">
               <div className="min-w-[500px]">
                 <div className="grid grid-cols-7 gap-2 md:gap-3 mb-4">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                       <div key={day} className="text-center text-[10px] md:text-[11px] font-black uppercase text-text-muted tracking-widest">{day}</div>
                    ))}
                 </div>
                 <div className="flex-1 grid grid-cols-7 gap-2 md:gap-3 grid-rows-5 border-t border-outline-variant/30 pt-4">
                    {/* Empty offsets */}
                    {Array.from({length: startOffset}).map((_, i) => (
                      <div key={`empty-${i}`} className="rounded-xl md:rounded-2xl border border-transparent p-2 md:p-3 opacity-20"></div>
                    ))}
                    
                    {/* Actual Days */}
                    {Array.from({length: daysInMonth}).map((_, i) => {
                      const day = i + 1;
                      const isSelected = day === selectedDate;
                      const hasUserEvents = events.some(ev => new Date(ev.event_date).getDate() === day);
                      const hasHolidays = holidays[day] && holidays[day].length > 0;
                      
                      return (
                        <motion.div 
                           key={day} 
                           onClick={() => setSelectedDate(day)}
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           className={`rounded-[1rem] md:rounded-[1.5rem] border p-2 md:p-3 flex flex-col items-center justify-center transition-colors cursor-pointer relative min-h-[60px] md:min-h-[80px]
                              ${isSelected 
                                ? 'border-noir-accent bg-noir-accent shadow-lg shadow-noir-accent/30' 
                                : hasHolidays 
                                  ? 'border-orange-500/30 bg-orange-950/10 hover:border-orange-500'
                                  : 'border-outline-variant/30 hover:border-outline-variant bg-surface-lowest/50'
                              }`}
                        >
                           <span className={`text-sm md:text-base font-bold 
                             ${isSelected ? 'text-white' : hasHolidays ? 'text-orange-400 font-black' : 'text-text-muted md:group-hover:text-white'}`}>
                              {day}
                           </span>
                           
                           {/* Event Indicators */}
                           {(hasUserEvents || hasHolidays) && (
                             <div className="absolute bottom-1.5 md:bottom-2 flex gap-1 flex-wrap justify-center px-1">
                               {hasHolidays && holidays[day].map((_, idx) => (
                                 <div key={`hol-${idx}`} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
                               ))}
                               {hasUserEvents && events.filter(ev => new Date(ev.event_date).getDate() === day).map((ev, idx) => (
                                 <div key={`usr-${idx}`} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isSelected ? 'bg-white' : (ev.type === 'video' ? 'bg-noir-accent' : 'bg-purple-500')}`} />
                               ))}
                             </div>
                           )}
                        </motion.div>
                      )
                    })}
                 </div>
               </div>
            </div>
         </div>
      </div>

      {/* CRUD Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[400px] bg-surface-low rounded-[2.5rem] border border-outline-variant p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black font-display text-white tracking-tight">{editingEvent ? 'Edit Event' : 'New Event'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-text-muted hover:text-white bg-surface-lowest rounded-xl transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1 block">Title</label>
                  <input 
                    type="text" 
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({...prev, title: e.target.value}))}
                    className="w-full bg-surface-lowest border border-outline-variant rounded-[1rem] px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-noir-accent transition-colors"
                    placeholder="Event Title..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1 block">Time Frame</label>
                  <input 
                    type="text" 
                    value={eventForm.time}
                    onChange={(e) => setEventForm(prev => ({...prev, time: e.target.value}))}
                    className="w-full bg-surface-lowest border border-outline-variant rounded-[1rem] px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-noir-accent transition-colors"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1 block">Type</label>
                    <select 
                      value={eventForm.type}
                      onChange={(e) => setEventForm(prev => ({...prev, type: e.target.value}))}
                      className="w-full bg-surface-lowest border border-outline-variant rounded-[1rem] px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-noir-accent transition-colors appearance-none"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="video">Video Sync</option>
                    </select>
                  </div>
                  <div className="w-1/3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1 block">Members</label>
                    <input 
                      type="number" 
                      min="1"
                      value={eventForm.members}
                      onChange={(e) => setEventForm(prev => ({...prev, members: parseInt(e.target.value) || 1}))}
                      className="w-full bg-surface-lowest border border-outline-variant rounded-[1rem] px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-noir-accent transition-colors"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveEvent}
                  className="w-full mt-4 bg-noir-accent text-white font-bold py-4 rounded-[1.2rem] shadow-lg shadow-noir-accent/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Save Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
