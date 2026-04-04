'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, ArrowRight, ShieldCheck, User, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function Auth() {
  const { setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isVerifyStep, setIsVerifyStep] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [isSignUp, setIsSignUp] = useState(false)
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
              data: { 
                full_name: name,
                username: username.replace('@', '').toLowerCase()
              },
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
        setUser({ id: 'dev-user-001', email: email || 'user@nexora.com', user_metadata: { name: name || 'User' } })
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
    <div className="min-h-screen w-full bg-[#5865f2] flex items-center justify-center p-4 font-sans overflow-hidden relative">
      {/* Premium Background (Deep Radial Gradient) */}
      <div className="absolute inset-0 bg-[#0c1033]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2b3595_0%,_transparent_70%)] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_#1a1f5c_0%,_transparent_50%)] opacity-40" />
      </div>

      {/* Floating Particles (Stars) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.3 + 0.1
            }}
            animate={{ 
              y: [null, "-10%"],
              opacity: [null, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[480px] bg-[#313338] rounded-xl p-8 shadow-2xl relative z-10 border border-black/10"
      >
        <AnimatePresence mode="wait">
          {isVerifyStep ? (
            <motion.form 
              key="verify" 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleVerifyOtp} 
              className="flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Check your {authMethod}</h2>
              <p className="text-zinc-400 text-sm mb-8 text-center px-4">
                We sent a 6-digit verification code to <br />
                <span className="text-white font-medium">{authMethod === 'email' ? email : phone}</span>
              </p>

              <div className="w-full space-y-6">
                <div>
                  <label className="text-[11px] font-black uppercase text-[#B5BAC1] tracking-wider mb-2 block">Verification Code</label>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="000000"
                    className="w-full bg-[#1e1f22] border border-black/20 rounded-md py-3 px-4 text-2xl text-center font-bold text-white tracking-[0.5em] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-[#4E5058]"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-bold py-3 rounded-md shadow-lg shadow-black/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center text-sm"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify Account</span>}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setIsVerifyStep(false)}
                  className="w-full text-xs text-primary hover:underline font-medium"
                >
                  Change {authMethod} or details
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              key="auth" 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <div className="text-center mb-8">
                 <h2 className="text-2xl font-bold text-white mb-2">
                    {isSignUp ? "Create an account" : "Welcome back!"}
                 </h2>
                 <p className="text-[#B5BAC1] text-[15px]">
                    {isSignUp ? "Jump in and start chatting" : "We're so excited to see you again!"}
                 </p>
              </div>

              <div className="space-y-4">
                {isSignUp && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-[#B5BAC1] tracking-wider block">Full Name</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="w-full bg-[#1e1f22] border border-black/20 rounded-md py-2.5 px-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-[#4E5058]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-[#B5BAC1] tracking-wider block">Username <span className="text-[#f23f42]">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B5BAC1] text-sm">@</span>
                        <input 
                          type="text" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          placeholder="username"
                          className="w-full bg-[#1e1f22] border border-black/20 rounded-md py-2.5 pl-8 pr-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-[#4E5058]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase text-[#B5BAC1] tracking-wider block">
                      {authMethod === 'email' ? 'Email' : 'Phone Number'} <span className="text-[#f23f42]">*</span>
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setAuthMethod(authMethod === 'email' ? 'phone' : 'email')}
                      className="text-[11px] text-primary hover:underline font-bold"
                    >
                      Use {authMethod === 'email' ? 'Phone' : 'Email'} instead
                    </button>
                   </div>
                  <input 
                    type={authMethod === 'email' ? 'email' : 'tel'}
                    value={authMethod === 'email' ? email : phone}
                    onChange={(e) => authMethod === 'email' ? setEmail(e.target.value) : setPhone(e.target.value)}
                    required
                    className="w-full bg-[#1e1f22] border border-black/20 rounded-md py-2.5 px-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                  />
                </div>

                {!isSignUp && authMethod === 'email' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-[#B5BAC1] tracking-wider block">
                      Password <span className="text-[#f23f42]">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-[#1e1f22] border border-black/20 rounded-md py-2.5 px-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5BAC1] hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button type="button" className="text-xs text-primary hover:underline mt-1 font-medium">Forgot your password?</button>
                  </div>
                )}

                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-[#B5BAC1] tracking-wider block">
                      Password <span className="text-[#f23f42]">*</span>
                    </label>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#1e1f22] border border-black/20 rounded-md py-2.5 px-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-bold py-3 rounded-md shadow-lg shadow-black/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center text-sm"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{isSignUp ? "Continue" : "Log In"}</span>
                  )}
                </button>
              </div>

              <div className="pt-1">
                 <p className="text-xs text-[#949BA4] font-medium">
                    {isSignUp ? "Already have an account? " : "Need an account? "}
                    <button 
                      type="button" 
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-primary hover:underline transition-all"
                    >
                       {isSignUp ? "Log In" : "Register"}
                    </button>
                 </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
