import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { Mail, User, Lock, Eye, EyeOff, ChevronDown, CheckCircle2, Phone, User2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import Logo from "@/assets/icon.png";
import React from "react";

type LoginMode = "email" | "kanisa" | "customer";

interface ModeOption {
  value: LoginMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const modeOptions: ModeOption[] = [
  {
    value: "email",
    label: "Email Address",
    description: "Login using your registered email",
    icon: <Mail className="w-5 h-5" />,
  },
  {
    value: "kanisa",
    label: "Account ID",
    description: "Login using your account number",
    icon: <User className="w-5 h-5" />,
  },
  {
    value: "customer",
    label: "Customer Account",
    description: "Login using your phone number & Google Account",
    icon: <User2 className="w-5 h-5" />,
  },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<LoginMode>("email");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [customerChoice, setCustomerChoice] = useState<"otp" | "google" | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const errorShownRef = React.useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const userData = searchParams.get("user");
    const errorParam = searchParams.get("error");

    if (errorParam && !errorShownRef.current) {
      errorShownRef.current = true;
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: decodeURIComponent(errorParam),
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
      // Remove query parameters to clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        login(user, token);
        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: `Welcome back, ${user.name}!`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        navigate("/dashboard/customer");
      } catch (e) {
        console.error("Failed to parse user data from URL", e);
      }
    }
  }, [searchParams, login, navigate]);

  const handleModeSelect = useCallback((selectedMode: LoginMode) => {
    setMode(selectedMode);
    setCustomerChoice(null);
    setIdentifier("");
    setPassword("");
    setOtp("");
    setIsOtpSent(false);
    setShowModeSelector(false);
  }, []);

  const handleGoogleLogin = () => {
    // Redirect to backend google auth route
    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/auth/google/redirect`;
  };

  const handleSendOtp = async () => {
    if (!identifier) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter your phone number",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/customer/send-otp", {
        phone: identifier,
      });

      if (response.status === 200) {
        setIsOtpSent(true);
        Swal.fire({
          icon: "success",
          title: "OTP Sent",
          text: "A 6-digit verification code has been sent to your phone.",
          timer: 3000,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to send OTP",
        text: err.response?.data?.message || "An error occurred",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "customer") {
      if (!isOtpSent) {
        await handleSendOtp();
        return;
      }

      if (!otp || otp.length !== 6) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please enter a valid 6-digit OTP",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.post("/customer/login-otp", {
          phone: identifier,
          otp: otp,
        });

        if (response.data.status === 200 && response.data.token) {
          Swal.fire({
            icon: "success",
            title: "Login successful!",
            timer: 1500,
            toast: true,
            position: "top-end",
            showConfirmButton: false,
          });

          login(response.data.user, response.data.token);
          navigate("/dashboard/customer");
        }
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: err.response?.data?.message || "Invalid OTP",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!identifier || !password) {
      const msg = "Please enter both credentials";
      setError(msg);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });

      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/admin/login", {
        identifier,
        password,
      });

      if (response.data.status === 200 && response.data.token) {
        Swal.fire({
          icon: "success",
          title: "Login successful!",
          timer: 1500,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });

        login(response.data.user, response.data.token);

        if (response.data.user.role === "vendor") {
          if (response.data.user.vendor_type === "Company") {
            navigate("/dashboard/company");
          } else if (response.data.user.vendor_type === "Individual") {
            navigate("/dashboard/individual");
          } else {
            navigate("/dashboard");
          }
        } else if (response.data.user.role === "customer") {
            navigate("/dashboard/customer");
        } else {
          navigate("/dashboard");
        }
      } else {
        const msg = response.data.message || "Authentication failed";
        setError(msg);

        Swal.fire({
          icon: "error",
          title: "Authentication Failed",
          text: msg,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
        });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "An error occurred during login";

      setError(msg);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentMode =
    modeOptions.find((m) => m.value === mode) || modeOptions[0];

  return (
    <div className="min-h-screen bg-[#E8F4FD] dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/20 blur-[120px] rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-400/20 blur-[120px] rounded-full" />

      {/* Main container */}
      <div className="w-full max-w-[380px] relative">

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800">

          {/* Logo */}
          <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="flex flex-col items-center mb-5"
           >
             <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner mb-3">
               <img src={Logo} alt="Token Utility System" className="w-12 h-12 object-contain" />
             </div>
           
             <h2 className="text-lg font-bold text-slate-800 dark:text-white text-center">
               Tokenpap Utility System
             </h2>
           
             <p className="text-[11px] text-slate-400 mt-1 text-center">
               Powering secure token distribution and seamless utility management
             </p>
           </motion.div>

          <form onSubmit={handleLogin} className="space-y-3.5">

            {/* Login method selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 ml-1">
                Login method
              </label>

              <button
                type="button"
                onClick={() => setShowModeSelector(true)}
                className="w-full mt-1"
              >
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition">

                  <div className="flex items-center gap-3">
                    <motion.div
                      key={mode}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                    >
                      {currentMode.icon}
                    </motion.div>

                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight">
                        {currentMode.label}
                      </p>

                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {currentMode.description}
                      </p>
                    </div>
                  </div>

                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            </div>

            {mode === "customer" && !customerChoice ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setCustomerChoice("otp")}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 transition shadow-sm group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0A1F44] dark:bg-[#0A1F44] flex items-center justify-center text-blue-600 mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <img
                      src="https://www.svgrepo.com/show/210458/mobile-phone-smartphone.svg"
                      alt="phone"
                      draggable={false}
                      className="w-5 h-5"
                    />
                  </div>
                
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    SMS OTP
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setCustomerChoice("google")}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 transition shadow-sm group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0A1F44] dark:bg-[#0A1F44] flex items-center justify-center text-blue-600 mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google"
                      draggable={false}
                      className="w-5 h-5"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Google</span>
                </motion.button>
              </div>
            ) : (
              <>
                {/* Identifier (Email, Account ID, or Phone) */}
                {(mode !== "customer" || customerChoice === "otp") && (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {mode === "email" ? <Mail size={15} /> : mode === "customer" ? <Phone size={15} /> : <User size={15} />}
                    </div>

                    <input
                      type={mode === "email" ? "email" : "text"}
                      placeholder={
                        mode === "email"
                          ? "Enter your email"
                          : mode === "customer"
                          ? "Enter your phone number"
                          : "Enter your account ID"
                      }
                      value={identifier}
                      disabled={mode === "customer" && isOtpSent && isLoading}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400"
                    />
                  </div>
                )}

                {/* Password or OTP */}
                {mode !== "customer" ? (
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                ) : customerChoice === "otp" && isOtpSent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400 tracking-[0.5em] font-bold text-center"
                    />
                  </motion.div>
                ) : customerChoice === "google" ? (
                  <div className="text-center py-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-bold text-slate-700 dark:text-slate-200 shadow-sm"
                    >
                      <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-5 h-5"
                      />
                      Sign in with Google
                    </motion.button>
                  </div>
                ) : null}

                {/* Login/OTP button */}
                <AnimatePresence mode="wait">
                  {!isLoading && customerChoice !== "google" ? (
                    <motion.button
                      key={mode === "customer" && !isOtpSent ? "send-otp" : "login"}
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-2.5 rounded-xl text-white text-[13px] font-bold bg-[#0A1F44] hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    >
                      {mode === "customer"
                        ? isOtpSent
                          ? "Verify & Login"
                          : "Send OTP"
                        : "Login to dashboard"}
                    </motion.button>
                  ) : isLoading ? (
                    <div className="flex justify-center py-2.5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-[13px] font-medium">
                          {mode === "customer" && !isOtpSent ? "Sending OTP..." : "Logging in..."}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </AnimatePresence>

                {mode === "customer" && (
                  <div className="flex items-center justify-center gap-4 mt-2">
                    {isOtpSent && !isLoading && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Resend OTP
                      </button>
                    )}
                    
                    {!isLoading && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerChoice(null);
                          setIsOtpSent(false);
                          setOtp("");
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                      >
                        Change method
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {mode !== "customer" && (
              <div className="text-center pt-1">
                <a
                  href="/forgot-password"
                  className="text-xs text-slate-500 hover:text-blue-600"
                >
                  Forgot password?
                </a>
              </div>
            )}
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} TokenPap Utility Sytem . All rights reserved.
          </div>
        </div>

        {/* Login Method Selector */}
        <AnimatePresence>
          {showModeSelector && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModeSelector(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
              />

              <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl border-t border-slate-100 dark:border-slate-800 pointer-events-auto"
                >
                  <div className="p-5">

                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />

                    <h3 className="text-sm font-bold text-center dark:text-white">
                      Login using
                    </h3>

                    <p className="text-center text-[11px] text-slate-400 mb-5">
                      Choose your preferred login method
                    </p>

                    <div className="space-y-2.5">
                      {modeOptions.map((option) => {
                        const isSelected = option.value === mode;

                        return (
                          <button
                            key={option.value}
                            onClick={() => handleModeSelect(option.value)}
                            className={`w-full flex items-center gap-3.5 p-3 rounded-xl border transition
                            ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                                : "border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 flex items-center justify-center rounded-lg
                              ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              {option.icon}
                            </div>

                            <div className="flex-1 text-left">
                              <p className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight">
                                {option.label}
                              </p>

                              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                                {option.description}
                              </p>
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="text-blue-500 w-5 h-5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setShowModeSelector(false)}
                      className="w-full mt-3 py-2 text-[13px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>

                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Login;