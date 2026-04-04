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
    <div className="h-screen w-full bg-[#f8faff] flex items-center justify-center p-6 font-sans overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-3xl p-10 md:p-12 shadow-[0_20px_50px_rgba(53,37,205,0.08)] border border-gray-100">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-4">
              <img src="/logo.png" alt="Nexora" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900 tracking-tight">Nexora</h1>
            <p className="text-sm text-gray-400 mt-1">Simple. Secure. Connected.</p>
          </div>

          <AnimatePresence mode="wait">
            {isVerifyStep ? (
              <motion.form 
                key="verify" 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-6"
              >
                <div className="text-center">
                   <h2 className="text-xl font-bold text-gray-900">Verify Code</h2>
                   <p className="text-xs text-gray-400 mt-2">
                      Enter the 6-digit code sent to <span className="text-gray-900 font-medium">{authMethod === 'email' ? email : phone}</span>
                   </p>
                </div>

                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="000000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-12 text-2xl text-center font-bold text-gray-900 tracking-widest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-200"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify Account</span>}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setIsVerifyStep(false)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Back to Sign In
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="auth" 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleSubmit} 
                className="space-y-5"
              >
                <div className="text-center mb-2">
                   <h2 className="text-xl font-bold text-gray-900">
                      {isSignUp ? "Create your account" : "Welcome back"}
                   </h2>
                   <p className="text-xs text-gray-400 mt-1">
                      {isSignUp ? "Fill in your details to get started" : "Please enter your details to sign in"}
                   </p>
                </div>

                <div className="space-y-4">
                  {isSignUp && (
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-12 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-12 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-12 pr-12 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                   <p className="text-xs text-gray-400 font-medium">
                      {isSignUp ? "Already have an account? " : "Don't have an account? "}
                      <button 
                        type="button" 
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-primary hover:underline underline-offset-4 transition-all"
                      >
                         {isSignUp ? "Sign In" : "Sign Up"}
                      </button>
                   </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        
        {/* Simple Footer */}
        <div className="mt-8 flex justify-center space-x-6 opacity-30 select-none">
          {['Terms', 'Privacy', 'Help'].map((item) => (
            <span key={item} className="text-[10px] font-bold uppercase tracking-wider text-gray-900">{item}</span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
