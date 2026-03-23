import { useState, useEffect, useRef, FormEvent } from "react";
import api from "@/lib/api";
import { Gauge, Loader2, Smartphone, CheckCircle2, XCircle, Clock, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/assets/icon-1.png";
import { motion, AnimatePresence } from "framer-motion";

type PaymentStatus = 'idle' | 'sending' | 'waiting' | 'confirmed' | 'failed' | 'timeout';

interface PaymentResult {
  status: PaymentStatus;
  amount?: number;
  mpesaReceipt?: string;
  failureReason?: string;
  tokens?: string[];
  meterNumber?: string;
}

const LipaTokenNaMpesa = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [minAmount, setMinAmount] = useState<number>(1);
  const [validationErrors, setValidationErrors] = useState<{ phone?: string; amount?: string; meterNumber?: string }>({});

  const [paymentResult, setPaymentResult] = useState<PaymentResult>({ status: 'idle' });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStoppedRef = useRef<boolean>(false);


  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Auto-fetch meter number for customers
  useEffect(() => {
    if (user && user.role === 'customer') {
      api.get("/admin/me")
        .then(res => {
          const meter = res.data.user?.meter;
          if (meter && meter.meter_number) {
            setMeterNumber(meter.meter_number);
          }
          if (meter && meter.price_per_unit && Number(meter.price_per_unit) > 0) {
            setMinAmount(Number(meter.price_per_unit));
          }
          if (res.data.user?.phone) {
            let displayPhone = res.data.user.phone;
            if (displayPhone.startsWith('254')) {
              displayPhone = '0' + displayPhone.slice(3);
            }
            setPhone(displayPhone);
          }
        })
        .catch(err => console.error("Failed to fetch customer details", err));
    }
  }, [user]);

  const validateInputs = () => {
    const errors: { phone?: string; amount?: string; meterNumber?: string } = {};

    if (!/^(01|07)\d{8}$/.test(phone)) {
      errors.phone = "Enter valid phone number (0712345678)";
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = "Enter valid amount";
    } else if (numericAmount < minAmount) {
      errors.amount = `Minimum purchase amount is KES ${minAmount}`;
    }

    if (!meterNumber || meterNumber.trim().length < 5) {
      errors.meterNumber = "Enter a valid meter number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const startPolling = (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 10; // With 25s long-polling, 10 attempts cover >4 minutes

    pollingStoppedRef.current = false;
    setPaymentResult({ status: 'waiting', meterNumber });

    const poll = async () => {
      if (pollingStoppedRef.current || attempts >= maxAttempts) {
        if (attempts >= maxAttempts && !pollingStoppedRef.current) {
          setPaymentResult({ status: 'timeout', meterNumber });
          setLoading(false);
        }
        return;
      }

      attempts++;

      try {
        // Long poll: backend will wait up to 25s for the callback
        const response = await api.get(`/mpesa/query/${checkoutRequestId}?wait=1`);
        const { status, amount: paidAmount, mpesa_receipt, failure_reason, result_desc, tokens } = response.data;

        if (pollingStoppedRef.current) return;

        if (status === "confirmed") {
          pollingStoppedRef.current = true;
          setPaymentResult({
            status: 'confirmed',
            amount: paidAmount,
            mpesaReceipt: mpesa_receipt,
            tokens: tokens || [],
            meterNumber,
          });
          setLoading(false);
        } else if (status === "failed") {
          pollingStoppedRef.current = true;
          setPaymentResult({
            status: 'failed',
            failureReason: failure_reason || result_desc || "Transaction failed",
            meterNumber,
          });
          setLoading(false);
        } else {
          // Still pending or server timeout (25s reached), poll again immediately
          poll();
        }
      } catch (error) {
        console.error("Polling error", error);
        // Wait 2s before retrying on network error to avoid infinite loop
        if (!pollingStoppedRef.current) {
          setTimeout(poll, 2000);
        }
      }
    };

    poll();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationErrors({});
    if (!validateInputs()) return;

    setLoading(true);
    setPaymentResult({ status: 'sending' });

    try {
      const formattedPhone = "254" + phone.slice(-9);
      const numericAmount = Number(amount);

      const response = await api.post("/mpesa/stkpush", {
        phone: formattedPhone,
        amount: numericAmount,
        reference: meterNumber
      });

      const { CheckoutRequestID } = response.data || {};

      if (CheckoutRequestID) {
        startPolling(CheckoutRequestID);
      } else {
        throw new Error("Missing CheckoutRequestID");
      }

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Unable to initiate payment. Please try again later.';
      setPaymentResult({
        status: 'failed',
        failureReason: errorMessage,
      });
      setLoading(false);
    }
  };

  const resetPayment = () => {
    setPaymentResult({ status: 'idle' });
    setAmount("");
    setCopiedToken(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-950 transition">

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={Logo}
            draggable={false}
            alt="Logo"
            className="h-14 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-[#0A1F44] dark:text-white">
            Lipia Token na M-Pesa
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Enter your details to receive a payment prompt
          </p>
        </div>

        {/* Real-time Status Panel */}
        <AnimatePresence mode="wait">
          {paymentResult.status !== 'idle' && (
            <motion.div
              key={paymentResult.status}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              {/* Sending STK Push */}
              {paymentResult.status === 'sending' && (
                <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/80 dark:bg-blue-950/40 p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-900 text-sm">Sending M-Pesa Prompt</p>
                      <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">Connecting to Safaricom...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting for user to enter PIN */}
              {paymentResult.status === 'waiting' && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Waiting for Payment</p>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">Check your phone and enter M-Pesa PIN</p>
                    </div>
                  </div>
                  {/* Animated progress dots */}
                  <div className="mt-3 flex justify-center gap-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Confirmed */}
              {paymentResult.status === 'confirmed' && (
                <div className="rounded-2xl border border-[#0A1F44]/20 dark:border-[#0A1F44]/50 bg-[#0A1F44]/5 dark:bg-[#0A1F44]/20 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <CheckCircle2 className="w-7 h-7 text-[#0A1F44] dark:text-blue-300" />
                    </motion.div>
                    <div>
                      <p className="font-bold text-[#0A1F44] dark:text-blue-200 text-sm">Payment Successful</p>
                      <p className="text-xs text-[#0A1F44]/70 dark:text-blue-300/70 mt-0.5">
                        KES {paymentResult.amount} received
                      </p>
                    </div>
                  </div>

                  {/* Receipt Details */}
                  <div className="space-y-2 text-xs">
                    {paymentResult.mpesaReceipt && (
                      <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[#0A1F44]/8 dark:bg-[#0A1F44]/20">
                        <span className="text-[#0A1F44] dark:text-blue-300 font-medium">M-Pesa Receipt Number</span>
                        <span className="font-mono font-bold text-[#0A1F44] dark:text-blue-100">{paymentResult.mpesaReceipt}</span>
                      </div>
                    )}
                    {paymentResult.meterNumber && (
                      <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[#0A1F44]/8 dark:bg-[#0A1F44]/20">
                        <span className="text-[#0A1F44] dark:text-blue-300 font-medium">Meter Number(DRN/PAN)</span>
                        <span className="font-mono font-bold text-[#0A1F44] dark:text-blue-100">{paymentResult.meterNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Generated Tokens */}
                  {paymentResult.tokens && paymentResult.tokens.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#0A1F44] dark:text-blue-300 uppercase tracking-wider">Your Token(s)</p>
                      {paymentResult.tokens.map((token, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0A1F44]/8 dark:bg-[#0A1F44]/30 border border-[#0A1F44]/20 dark:border-[#0A1F44]/40"
                        >
                          <span className="font-mono text-sm font-bold text-[#0A1F44] dark:text-blue-100 tracking-wider break-all">
                            {token.replace(/(.{4})/g, '$1-').replace(/-$/, '')}
                          </span>
                          <button
                            onClick={() => copyToken(token)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-[#0A1F44]/15 dark:hover:bg-[#0A1F44]/40 transition-colors"
                            title="Copy token"
                          >
                            {copiedToken === token ? (
                              <Check className="w-4 h-4 text-[#0A1F44] dark:text-blue-300" />
                            ) : (
                              <Copy className="w-4 h-4 text-[#0A1F44] dark:text-blue-300" />
                            )}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={resetPayment}
                    className="w-full mt-2 py-2.5 text-sm font-semibold text-white bg-[#0A1F44] hover:bg-[#081735] rounded-xl border border-[#0A1F44] transition-colors"
                  >
                    Make Another Purchase
                  </button>
                </div>
              )}

              {/* Payment Failed */}
              {paymentResult.status === 'failed' && (
                <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <XCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
                    </motion.div>
                    <div>
                      <p className="font-bold text-red-800 dark:text-red-300 text-sm">Payment Failed</p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
                        {paymentResult.failureReason}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetPayment}
                    className="w-full py-2.5 text-sm font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl border border-red-200 dark:border-red-800/50 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Timeout */}
              {paymentResult.status === 'timeout' && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Payment Pending</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        We haven't received confirmation yet. Please check your M-Pesa SMS shortly.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetPayment}
                    className="w-full py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form — hide when confirmed, to let results breathe */}
        {paymentResult.status !== 'confirmed' && (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Phone */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                M-Pesa Phone to receive prompt
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                <input
                  type="tel"
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e)=>setPhone(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:text-white transition focus:ring-2 focus:ring-[#0A1F44]
                  ${validationErrors.phone ? "border-red-400" : "border-slate-300 dark:border-slate-700"}`}
                  disabled={loading}
                />
              </div>
              {validationErrors.phone && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
              )}
            </div>

            {/* Meter Number */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                Meter Number
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                <input
                  type="text"
                  placeholder="14123456789"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:text-white transition focus:ring-2 focus:ring-[#0A1F44]
                  ${validationErrors.meterNumber ? "border-red-400" : "border-slate-300 dark:border-slate-700"}`}
                  readOnly={true}
                  disabled={loading}
                />
              </div>
              {validationErrors.meterNumber && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.meterNumber}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                Amount (KES)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  KSh
                </span>
                <input
                  type="number"
                  placeholder={`${minAmount}`}
                  min={minAmount}
                  value={amount}
                  onChange={(e)=>setAmount(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:text-white transition focus:ring-2 focus:ring-[#0A1F44]
                  ${validationErrors.amount ? "border-red-400" : "border-slate-300 dark:border-slate-700"}`}
                  disabled={loading}
                />
              </div>
              {validationErrors.amount ? (
                <p className="text-xs text-red-500 mt-1">{validationErrors.amount}</p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Minimum purchase: KES {minAmount}</p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 font-semibold text-white bg-[#0A1F44] hover:bg-[#081735] rounded-xl transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin"/>
                  Processing...
                </>
              ) : (
                `Pay KES ${Number(amount) || 0}`
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};

export default LipaTokenNaMpesa;