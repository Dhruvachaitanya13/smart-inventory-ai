/**
 * @file LoginPage.jsx
 * @description Enterprise Authentication Portal with MFA Simulation.
 * @version 5.0.0
 * @author SmartInv Engineering
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FiMail, FiLock, FiUser, FiArrowRight, FiCheckCircle, 
  FiGithub, FiLinkedin, FiChrome, FiAlertCircle, FiEye, FiEyeOff, FiShield 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONSTANTS & CONFIGURATION ---
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const ANIMATION_DURATION = 0.5;

// --- SUB-COMPONENTS ---

/**
 * @component PasswordStrengthMeter
 * @description Visual indicator of password complexity.
 */
const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => {
    let score = 0;
    if (password.length > 5) score++;
    if (password.length > 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const getColor = () => {
    switch (strength) {
      case 0: return 'bg-slate-200';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-emerald-400';
      case 5: return 'bg-emerald-600';
      default: return 'bg-slate-200';
    }
  };

  const getLabel = () => {
    switch (strength) {
      case 0: return 'Enter Password';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <div className="w-full space-y-1 mt-2">
      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
        <span>Security</span>
        <span>{getLabel()}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${(strength / 5) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  
  // --- STATE MANAGEMENT ---
  const [viewState, setViewState] = useState('login'); // 'login' | 'register' | 'forgot' | 'otp'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  const [errors, setErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // OTP Timer Logic
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field-specific error on type
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { email, password, name, confirmPassword } = formData;

    // Email
    if (!email) newErrors.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email address";

    // Password (Login vs Register)
    if (!password) newErrors.password = "Password is required";
    
    if (viewState === 'register') {
      if (!name) newErrors.name = "Full name is required";
      if (!PASSWORD_REGEX.test(password)) {
        newErrors.password = "Password must contain uppercase, lowercase, number, and symbol.";
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Simulate Network Latency for realism
      await new Promise(r => setTimeout(r, 800));

      let success = false;
      if (viewState === 'login') {
        success = await login(formData.email, formData.password);
      } else if (viewState === 'register') {
        success = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      }

      if (success) navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error("Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    toast.info(`Connecting to ${provider}...`);
    // Simulation
    setTimeout(() => {
      toast.success(`Authenticated via ${provider}`);
      navigate('/dashboard');
    }, 1500);
  };

  const initiateReset = (e) => {
    e.preventDefault();
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: "Please enter a valid email to reset password" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setViewState('otp');
      setOtpTimer(60);
      toast.success(`OTP sent to ${formData.email}`);
    }, 1000);
  };

  const verifyOtp = (e) => {
    e.preventDefault();
    if (formData.otp.length !== 6) {
      toast.error("Invalid OTP length");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Password reset successful. Please login.");
      setViewState('login');
    }, 1000);
  };

  // --- SUB-COMPONENTS (RENDER HELPERS) ---

  const InputField = ({ icon: Icon, type, name, placeholder, showEye = false }) => (
    <div className="space-y-1 group">
      <label className="text-xs font-bold text-slate-500 uppercase ml-1">
        {name.replace(/([A-Z])/g, ' $1').trim()}
      </label>
      <div className={`
        relative flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl transition-all duration-200 border-2
        ${errors[name] 
          ? 'border-red-100 bg-red-50/50' 
          : 'border-transparent group-hover:border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10'}
      `}>
        <div className={`pl-4 ${errors[name] ? 'text-red-400' : 'text-slate-400'}`}>
          <Icon size={18} />
        </div>
        <input
          type={showEye ? (showPassword ? 'text' : 'password') : type}
          name={name}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          className="w-full py-3.5 px-4 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 font-medium"
        />
        {showEye && (
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="pr-4 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
      {errors[name] && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-xs text-red-500 font-bold pl-1"
        >
          <FiAlertCircle size={10} /> {errors[name]}
        </motion.div>
      )}
    </div>
  );

  const SocialButton = ({ icon: Icon, label, color, onClick }) => (
    <button 
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-md group"
    >
      <Icon size={20} className={`${color} transition-transform group-hover:scale-110`} />
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 hidden xl:block">{label}</span>
    </button>
  );

  // --- RENDER ---

  return (
    <div className="min-h-screen w-full bg-[#0f172a] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Main Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1100px] bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[650px] border border-slate-200/50 dark:border-slate-700/50"
      >
        
        {/* LEFT: Branding Panel */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
              className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl"
            >
              <FiShield size={28} className="text-emerald-300" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
              Smart<br/>Inventory<span className="text-indigo-300">.AI</span>
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed font-light opacity-90 max-w-sm">
              The next generation of asset intelligence. Predictive analytics, real-time telemetry, and automated logistics in one platform.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <FiCheckCircle className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-indigo-200 uppercase tracking-wider font-bold">Status</p>
                <p className="font-bold">System Operational</p>
              </div>
            </div>
            <p className="text-[10px] opacity-50 uppercase tracking-widest">© 2024 Enterprise Corp. Security Verified.</p>
          </div>
        </div>

        {/* RIGHT: Dynamic Form Panel */}
        <div className="w-full md:w-7/12 p-8 lg:p-12 bg-white dark:bg-slate-800 flex flex-col justify-center relative">
          
          <AnimatePresence mode='wait'>
            
            {/* VIEW: LOGIN & REGISTER */}
            {(viewState === 'login' || viewState === 'register') && (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-md mx-auto"
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {viewState === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    {viewState === 'login' 
                      ? 'Please enter your credentials to access the dashboard.' 
                      : 'Setup your enterprise workspace in seconds.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {viewState === 'register' && (
                    <InputField icon={FiUser} type="text" name="name" placeholder="John Doe" />
                  )}
                  
                  <InputField icon={FiMail} type="email" name="email" placeholder="name@company.com" />
                  
                  <div>
                    <InputField icon={FiLock} type="password" name="password" placeholder="••••••••" showEye={true} />
                    {viewState === 'register' && formData.password && (
                      <PasswordStrengthMeter password={formData.password} />
                    )}
                  </div>

                  {viewState === 'register' && (
                    <InputField icon={FiCheckCircle} type="password" name="confirmPassword" placeholder="Confirm Password" />
                  )}

                  {viewState === 'login' && (
                    <div className="flex justify-end">
                      <button 
                        type="button" 
                        onClick={() => { setErrors({}); setViewState('forgot'); }}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {viewState === 'login' ? 'Sign In' : 'Get Started'} <FiArrowRight />
                      </>
                    )}
                  </button>
                </form>

                <div className="my-8 flex items-center gap-4">
                  <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or continue with</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                </div>

                <div className="flex gap-3">
                  <SocialButton icon={FiChrome} label="Google" color="text-red-500" onClick={() => handleSocialLogin('Google')} />
                  <SocialButton icon={FiGithub} label="GitHub" color="text-slate-800 dark:text-white" onClick={() => handleSocialLogin('GitHub')} />
                  <SocialButton icon={FiLinkedin} label="LinkedIn" color="text-blue-600" onClick={() => handleSocialLogin('LinkedIn')} />
                </div>

                <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                  {viewState === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => { 
                      setViewState(viewState === 'login' ? 'register' : 'login'); 
                      setErrors({}); 
                      setFormData({name:'', email:'', password:'', confirmPassword:'', otp:''});
                    }}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold ml-1"
                  >
                    {viewState === 'login' ? 'Register Now' : 'Sign In'}
                  </button>
                </p>
              </motion.div>
            )}

            {/* VIEW: FORGOT PASSWORD */}
            {viewState === 'forgot' && (
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-md mx-auto"
              >
                <button onClick={() => setViewState('login')} className="mb-6 text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2">
                  <FiArrowRight className="rotate-180"/> Back to Login
                </button>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset Password</h2>
                <p className="text-slate-500 mb-6">Enter your email to receive a One-Time Password (OTP).</p>
                
                <form onSubmit={initiateReset} className="space-y-6">
                  <InputField icon={FiMail} type="email" name="email" placeholder="name@company.com" />
                  <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* VIEW: OTP VERIFICATION */}
            {viewState === 'otp' && (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-md mx-auto"
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verify Identity</h2>
                <p className="text-slate-500 mb-6">Enter the 6-digit code sent to <span className="font-bold text-indigo-600">{formData.email}</span></p>
                
                <form onSubmit={verifyOtp} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">One-Time Password</label>
                    <input 
                      type="text" 
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full py-4 text-center text-3xl font-mono tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Expires in: 00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</span>
                    <button type="button" disabled={otpTimer > 0} onClick={initiateReset} className="font-bold text-indigo-600 disabled:opacity-50 hover:underline">
                      Resend Code
                    </button>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;