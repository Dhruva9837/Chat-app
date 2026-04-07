"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Loader2,
  ArrowRight,
  User,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { BrandLogo } from "./BrandLogo";

export function Auth() {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVerifyStep, setIsVerifyStep] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("nexora_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              username: username.replace("@", "").toLowerCase(),
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.session) setUser(data.user);
        else setIsVerifyStep(true);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (rememberMe) {
          localStorage.setItem("nexora_remembered_email", email);
        } else {
          localStorage.removeItem("nexora_remembered_email");
        }
        setUser(data.user);
      }
    } catch (error: any) {
      console.error("Auth Request Error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      alert("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup", // Ensuring type is signup for registration flow
      });
      if (error) throw error;
      if (data.user) setUser(data.user);
    } catch (error: any) {
      alert(`Verification Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-lowest flex items-center justify-center p-6 font-sans overflow-hidden relative">
      {/* --- PREMIUM DYNAMIC BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-150" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] relative z-10"
      >
        {/* --- GLASS CARD --- */}
        <div className="backdrop-blur-2xl bg-surface-main/40 rounded-[2.5rem] border border-outline-variant p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          {/* Subtle Inner Glow */}
          <div className="absolute -inset-x-20 -top-20 h-40 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10 translate-y-0 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <BrandLogo />
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {isVerifyStep ? (
              <motion.form
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-display font-black tracking-tight text-text-main">
                    Final Step
                  </h2>
                  <p className="text-text-muted text-sm px-4">
                    Confirm the 6-digit code sent to <br />
                    <span className="text-primary font-bold">{email}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-center gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      placeholder="······"
                      className="w-full bg-surface-lowest/50 border border-outline-variant rounded-2xl py-4 px-4 text-3xl text-center font-display font-black text-white tracking-[0.5em] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all placeholder:text-text-muted/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span>Verify Account</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVerifyStep(false)}
                    className="w-full text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest"
                  >
                    Wrong Details? Go Back
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="text-center space-y-1 mb-8">
                  <h2 className="text-3xl font-display font-black text-text-main tracking-tight">
                    {isSignUp ? "Create an account" : "Welcome back!"}
                  </h2>
                  <p className="text-text-muted text-[14px]">
                    {isSignUp
                      ? "Jump in and start chatting"
                      : "We're so excited to see you again!"}
                  </p>
                </div>

                <div className="space-y-4">
                  {isSignUp && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em] ml-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Name"
                            className="w-full bg-surface-lowest/50 border border-outline-variant rounded-2xl py-3 pl-11 pr-4 text-text-main text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all placeholder:text-text-muted/40"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em] ml-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          placeholder="@username"
                          className="w-full bg-surface-lowest/50 border border-outline-variant rounded-2xl py-3 px-4 text-text-main text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all placeholder:text-text-muted/40"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em] ml-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="user@example.com"
                        className="w-full bg-surface-lowest/50 border border-outline-variant rounded-2xl py-3.5 pl-12 pr-4 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em] ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full bg-surface-lowest/50 border border-outline-variant rounded-2xl py-3.5 pl-12 pr-12 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {!isSignUp && (
                      <div className="flex items-center justify-between mt-2 px-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded-md bg-surface-lowest border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer"
                          />
                          <span className="text-[11px] text-text-muted group-hover:text-text-main transition-colors font-bold uppercase tracking-wider">
                            Remember me
                          </span>
                        </label>
                        <button
                          type="button"
                          className="text-[11px] text-primary hover:underline font-black uppercase tracking-wider"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-primary to-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center text-xs disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{isSignUp ? "Continue" : "Log In"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-text-muted font-bold tracking-widest">
                    {isSignUp
                      ? "Already have an account? "
                      : "Need an account? "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-primary hover:text-indigo-400 transition-colors uppercase font-black"
                    >
                      {isSignUp ? "Log In" : "Register"}
                    </button>
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* --- FOOTER DECORATION --- */}
        <div className="mt-8 flex justify-center gap-8 items-center text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">
          <span className="hover:text-primary transition-colors cursor-help">
            Secure Node
          </span>
          <div className="w-1 h-1 bg-text-muted/20 rounded-full" />
          <span className="hover:text-primary transition-colors cursor-help">
            End-to-End
          </span>
          <div className="w-1 h-1 bg-text-muted/20 rounded-full" />
          <span className="hover:text-primary transition-colors cursor-help">
            v2.0.4 Nexora
          </span>
        </div>
      </motion.div>
    </div>
  );
}
