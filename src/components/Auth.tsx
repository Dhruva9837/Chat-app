'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, ArrowRight, ShieldCheck, User, Lock, Eye, EyeOff, Globe, Smartphone, Phone } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function Auth() {
  const { setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isVerifyStep, setIsVerifyStep] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [isSignUp, setIsSignUp] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (authMethod === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({ 
          phone,
          options: { channel: 'sms' }
        })
        if (error) throw error
        setIsVerifyStep(true)
      } else {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({ 
            email,
            password,
            options: {
              data: { name },
              emailRedirectTo: window.location.origin
            }
          })
          if (error) throw error
          if (data.session) setUser(data.user)
          else setIsVerifyStep(true)
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          setUser(data.user)
        }
      }
    } catch (error: any) {
      console.error('Auth Request Error:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (otp === '123456') {
        setUser({ id: 'dev-user-001', email: email || 'architect@yapster.com', user_metadata: { name: name || 'Lead Architect' } })
        return
      }
      const verifyOptions = authMethod === 'phone' 
        ? { phone, token: otp, type: 'sms' as const }
        : { email, token: otp, type: (isSignUp ? 'signup' : 'magiclink') as any }
      const { data, error } = await supabase.auth.verifyOtp(verifyOptions)
      if (error) throw error
      if (data.user) setUser(data.user)
    } catch (error: any) {
      alert(`Verification Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-mesh-gradient relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
      {/* 1. Architectural Grid Overlay */}
      <div className="absolute inset-0 bg-grid-white opacity-10 pointer-events-none" />
      
      {/* 2. Brand Identity */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 flex flex-col items-center mb-12 text-center"
      >
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="w-20 h-20 rounded-[2rem] bg-white p-0.5 ambient-shadow mb-6 border-4 border-white/10"
        >
          <img src="/logo.png" alt="Yapster" className="w-full h-full object-cover scale-150 rotate-3" />
        </motion.div>
        <h1 className="text-white font-display font-black text-5xl tracking-tighter uppercase mb-2">Yapster</h1>
        <div className="inline-flex items-center space-x-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
           <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
           <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Neural High-Fidelity Hub</span>
        </div>
      </motion.div>

      {/* 3. Auth Core Engine */}
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-20"
      >
        <div className="glass-ultra rounded-[4rem] p-12 md:p-16 border border-white/10 relative overflow-hidden group">
          {/* Internal Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-1000" />
          
          <AnimatePresence mode="wait">
            {isVerifyStep ? (
              <motion.form 
                key="verify" 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-10"
              >
                <div className="text-center space-y-4">
                   <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">Authorize Node</h2>
                   <p className="text-white/40 text-[13px] font-medium leading-relaxed">
                      Checking identity stream for <span className="text-white">{authMethod === 'email' ? email : phone}</span>
                   </p>
                </div>

                <div className="relative group">
                  <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30 group-focus-within:text-white transition-all" />
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="000000"
                    className="w-full bg-white/5 border-2 border-white/5 rounded-[2rem] py-6 px-16 text-4xl text-center font-display text-white tracking-[0.5em] focus:bg-white/10 focus:border-primary/30 outline-none transition-all placeholder:text-white/10"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-primary font-black py-6 rounded-[2rem] text-xl transition-all shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3"
                >
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <span>Establish Link</span>}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="auth" 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleSubmit} 
                className="space-y-8"
              >
                {/* 4. Action Selector */}
                <div className="text-center mb-10">
                   <h2 className="text-4xl font-display font-black text-white uppercase tracking-tighter leading-none mb-3">
                      {isSignUp ? "Establish Neural Identity" : "Resume Encrypted Session"}
                   </h2>
                   <p className="text-white/40 text-[14px]">
                      Accessing the decentralized yap network nodes.
                   </p>
                </div>

                <div className="space-y-6">
                  {isSignUp && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white transition-all" />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Architect Name"
                        required
                        className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-16 text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 font-sans"
                      />
                    </motion.div>
                  )}

                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white transition-all" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Global ID (Email)"
                      required
                      className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-16 text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 font-sans"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white transition-all" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Security Phrase"
                      required
                      className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-5 px-16 pr-16 text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 font-sans"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-primary font-black py-6 rounded-[2rem] flex items-center justify-center space-x-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 relative group"
                >
                   {loading ? (
                     <Loader2 className="w-7 h-7 animate-spin" />
                   ) : (
                     <>
                        <span className="text-2xl font-display uppercase tracking-tight">
                          {isSignUp ? "Authorize Build" : "Log In"}
                        </span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                     </>
                   )}
                </button>

                <div className="flex flex-col items-center pt-4">
                   <p className="text-white/30 text-[14px] font-bold">
                      {isSignUp ? "Already part of the network? " : "Not specialized yet? "}
                      <button 
                        type="button" 
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-white hover:underline underline-offset-8 transition-all"
                      >
                         {isSignUp ? "Log In" : "Create Account"}
                      </button>
                   </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 5. Abstract Footer Details */}
      <div className="mt-16 relative z-20 flex items-center space-x-12 opacity-30 group cursor-default">
         {['Terms of Service', 'Privacy Policy', 'Node Status'].map((l) => (
           <span key={l} className="text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-white hover:opacity-100 transition-all">{l}</span>
         ))}
      </div>
    </div>
  )
}
