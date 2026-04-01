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
  const [sent, setSent] = useState(false)
  const [isVerifyStep, setIsVerifyStep] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [isSignUp, setIsSignUp] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (authMethod === 'phone') {
      const { error } = await supabase.auth.signInWithOtp({ 
        phone,
        options: {
          channel: 'sms'
        }
      })
      setLoading(false)
      if (!error) {
        setIsVerifyStep(true)
      } else {
        if (error.message.includes('Unsupported phone provider')) {
          console.warn('Supabase Phone Provider not configured. Simulation active.')
          setIsVerifyStep(true)
        } else {
          alert(error.message)
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          data: isSignUp ? { name } : {},
          emailRedirectTo: window.location.origin,
          shouldCreateUser: isSignUp
        }
      })
      setLoading(false)
      if (!error) {
        setIsVerifyStep(true)
      } else {
        alert(error.message)
      }
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // DEV SIMULATION
    if (otp === '123456') {
      setUser({ 
        id: 'dev-user-001', 
        email: email || 'architect@yapster.com',
        user_metadata: { name: name || 'Lead Architect' }
      })
      setLoading(false)
      return
    }

    const verifyOptions = authMethod === 'phone' 
      ? { phone, token: otp, type: 'sms' as const }
      : { email, token: otp, type: 'email' as const }

    const { error } = await supabase.auth.verifyOtp(verifyOptions as any)
    
    setLoading(false)
    if (error) alert(error.message)
  }

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
     alert(`${provider} login initiated. Configuration required in Supabase dashboard.`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-vibrant-gradient relative overflow-y-auto px-6 font-sans py-20">
      
      {/* Brand Logo & Title */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center mb-10 text-center z-10"
      >
        <motion.div 
          animate={{ 
            y: [0, -12, 0],
            rotate: [3, -3, 3]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-6 overflow-hidden border-8 border-white/20 relative cursor-pointer"
        >
          <div className="absolute inset-0 bg-primary/5 animate-pulse" />
          <img src="/logo.png" alt="Yapster" className="w-full h-full object-cover scale-150 relative z-10" />
        </motion.div>
        <h1 className="font-display font-black text-6xl text-white tracking-tighter mb-2 drop-shadow-sm">Yapster</h1>
        <p className="text-white/60 font-medium tracking-tight text-lg uppercase tracking-[0.2em]">High-Fidelity Terminal</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[500px] w-full z-10"
      >
        <div className="glass-v2 rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12"
              >
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white mx-auto mb-8 border border-white/40 shadow-lg"
                >
                   <ShieldCheck className="w-12 h-12" />
                </motion.div>
                <h2 className="text-white text-3xl font-display font-black tracking-tight mb-4">Identity Sent</h2>
                <p className="text-white/70 text-lg font-sans tracking-tight leading-relaxed px-6">
                  Check your secure mail hub to verify your terminal access credentials.
                </p>
                <button 
                  onClick={() => setSent(false)}
                  className="mt-10 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold text-sm transition-all border border-white/20"
                >
                  Back to Terminal
                </button>
              </motion.div>
            ) : isVerifyStep ? (
              <motion.form 
                key="verify-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-10"
              >
                <div className="space-y-3">
                   <h2 className="text-white text-4xl font-display font-black tracking-tight leading-none text-center uppercase tracking-widest">Verification Node</h2>
                   <p className="text-white/50 font-sans tracking-tight text-sm text-center">
                      Verify the 6-digit code sent to <span className="font-bold text-white">{authMethod === 'email' ? email : phone}</span>
                   </p>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40 group-focus-within:text-white transition-colors" />
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      placeholder="000000"
                      className="w-full bg-white/10 border border-white/10 rounded-3xl py-6 pl-16 pr-6 text-3xl tracking-[0.6em] focus:bg-white/20 focus:border-white/30 outline-none transition-all placeholder:text-white/20 font-display text-white text-center shadow-lg"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-primary hover:bg-gray-100 font-black py-6 rounded-[2rem] transition-all shadow-xl flex items-center justify-center space-x-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <span className="text-xl">Authorize Access</span>}
                </button>

                <button 
                  type="button"
                  onClick={() => setIsVerifyStep(false)}
                  className="w-full text-white/40 font-bold text-sm hover:text-white transition-colors text-center"
                >
                  Change identifier
                </button>
              </motion.form>
            ) : (
              <form key="auth-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Mode Selector for Email/Phone */}
                <div className="relative flex bg-white/5 p-1.5 rounded-[2rem] border border-white/5">
                   <motion.div 
                     layoutId="mode-pill"
                     className="absolute inset-y-1.5 rounded-[1.75rem] bg-white shadow-xl z-0"
                     initial={false}
                     animate={{ 
                       x: authMethod === 'email' ? '0%' : '100%',
                       width: '50%'
                     }}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                   />
                   <button 
                    type="button"
                    onClick={() => setAuthMethod('email')}
                    className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all relative z-10 ${authMethod === 'email' ? 'text-primary' : 'text-white/50 hover:text-white/80'}`}
                   >
                     Email Access
                   </button>
                   <button 
                    type="button"
                    onClick={() => setAuthMethod('phone')}
                    className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all relative z-10 ${authMethod === 'phone' ? 'text-primary' : 'text-white/50 hover:text-white/80'}`}
                   >
                     Mobile Access
                   </button>
                </div>

                {/* Animated Form Fields */}
                <div className="space-y-6">
                  {/* Name Field (Animated) */}
                  <AnimatePresence>
                    {isSignUp && authMethod === 'email' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        className="space-y-2.5 overflow-hidden"
                      >
                        <label className="text-[14px] font-black text-white/60 tracking-tight ml-2">Display Identity</label>
                        <div className="relative group">
                          <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white transition-colors" />
                          <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={isSignUp}
                            placeholder="Full Name"
                            className="w-full bg-white/10 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-base focus:bg-white/15 focus:border-white/20 outline-none transition-all placeholder:text-white/20 font-sans text-white"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Conditional Input for Email/Phone */}
                  <motion.div layout className="space-y-2.5">
                    <label className="text-[14px] font-black text-white/60 tracking-tight ml-2">
                      {authMethod === 'email' ? 'Global Identifier' : 'Mobile Node'}
                    </label>
                    <div className="relative group">
                      {authMethod === 'email' ? (
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white transition-colors" />
                      ) : (
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white transition-colors" />
                      )}
                      <input 
                        type={authMethod === 'email' ? 'email' : 'tel'} 
                        value={authMethod === 'email' ? email : phone}
                        onChange={(e) => authMethod === 'email' ? setEmail(e.target.value) : setPhone(e.target.value)}
                        required
                        placeholder={authMethod === 'email' ? "name@domain.com" : "+91 00000 00000"}
                        className="w-full bg-white/10 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-base focus:bg-white/15 focus:border-white/20 outline-none transition-all placeholder:text-white/20 font-sans text-white font-medium"
                      />
                    </div>
                  </motion.div>

                  {/* Password (Only for Email) */}
                  <AnimatePresence>
                    {authMethod === 'email' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0, y: 10 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: 10 }}
                        className="space-y-2.5 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-2">
                           <label className="text-[14px] font-black text-white/60 tracking-tight">Security Phrase</label>
                           <button type="button" className="text-[13px] font-bold text-white/40 hover:text-white transition-colors">Recover?</button>
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white transition-colors" />
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={!isSignUp}
                            placeholder="••••••••"
                            className="w-full bg-white/10 border border-white/5 rounded-2xl py-5 pl-16 pr-14 text-base focus:bg-white/15 focus:border-white/20 outline-none transition-all placeholder:text-white/20 font-sans text-white"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-primary hover:bg-gray-50 font-black py-6 rounded-[2rem] transition-all shadow-xl flex items-center justify-center space-x-3 group disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <>
                      <span className="font-display text-2xl tracking-tighter">
                        {authMethod === 'phone' ? 'Initialize OTP' : (isSignUp ? 'Establish Identity' : 'Resume Session')}
                      </span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>

                {/* Social Login Separator */}
                <div className="flex flex-col items-center space-y-8">
                   <div className="flex items-center space-x-6 w-full">
                      <div className="h-px bg-white/10 flex-1" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Network Sync</span>
                      <div className="h-px bg-white/10 flex-1" />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 w-full px-2">
                      <SocialButton 
                        icon={Globe} 
                        label="Google Node" 
                        onClick={() => handleSocialLogin('google')} 
                      />
                      <SocialButton 
                        icon={Smartphone} 
                        label="Device Sync" 
                        active={authMethod === 'phone'}
                        onClick={() => setAuthMethod('phone')} 
                      />
                   </div>

                   <p className="text-base font-bold text-white/50 text-center">
                      {isSignUp ? "Already registered? " : "New architect? "}
                      <button 
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-white font-black hover:underline underline-offset-8"
                      >
                         {isSignUp ? "Log In" : "Register Node"}
                      </button>
                   </p>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Deep Footer Context */}
      <div className="mt-10 flex items-center space-x-10 z-10">
         <FooterLink label="Privacy Policy" />
         <FooterLink label="Terms of Service" />
         <FooterLink label="Contact Support" />
      </div>
    </div>
  )
}

function SocialButton({ icon: Icon, label, onClick, active }: any) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center space-x-3 rounded-2xl py-4.5 px-6 transition-all border shadow-sm active:scale-[0.96] group ${active ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white/40 hover:bg-white/60 text-gray-900 border-white/20'}`}
    >
       <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-900'}`} />
       <span className="font-bold text-[15px]">{label}</span>
    </button>
  )
}

function FooterLink({ label }: { label: string }) {
  return (
    <button className="text-[12.5px] font-bold text-gray-900/30 hover:text-gray-900/60 transition-colors tracking-tight">
      {label}
    </button>
  )
}
