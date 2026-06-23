import React, { useState } from 'react';
import CustomerMenu from './components/CustomerMenu';
import AdminSheet from './components/AdminSheet';
import { Shield, Lock, Unlock, X } from 'lucide-react';

export interface UserSession {
  name: string;
  role: 'Super Admin' | 'Manager' | 'Sales';
}

export default function App() {
  const [view, setView] = useState<'menu' | 'admin'>('menu');
  const [showPinGate, setShowPinGate] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Email login states for Super Admin (Owner email, rabiulrami@gmail.com)
  const [loginMode, setLoginMode] = useState<'pin' | 'email'>('pin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPasswordPin, setAdminPasswordPin] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (
        path === '/admin' || 
        path === '/staff' || 
        path === '/sales-person' || 
        path === '/sales' ||
        hash === '#admin'
      ) {
        setView('admin');
        setShowPinGate(true);
      }
    } catch (e) {
      console.warn("Location check failed or blocked in modern sandbox/iframe context:", e);
    }
  }, []);

  const handleBackToMenu = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch (e) {
      console.warn("History pushState blocked in sandbox/iframe context:", e);
    }
    setView('menu');
    setShowPinGate(false);
    setPinCode('');
    setCurrentUser(null);
    setAdminEmail('');
    setAdminPasswordPin('');
    setEmailErrorMsg(null);
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) return;
    setIsVerifying(true);
    setPinError(false);
    setEmailErrorMsg(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, pin: adminPasswordPin })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setView('admin');
        setShowPinGate(false);
        setAdminEmail('');
        setAdminPasswordPin('');
      } else {
        let errText = "Login failed. Please check your admin credentials.";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errText = errData.error || errText;
          } else {
            const textHTML = await response.text();
            if (textHTML.includes("Login failed on server")) {
              errText = textHTML.substring(0, 200);
            } else {
              errText = `Server responded with HTTP ${response.status}: Failed to authenticate code.`;
            }
          }
        } catch {
          errText = `HTTP Error ${response.status}: Failed to authenticate with server.`;
        }
        setEmailErrorMsg(errText);
        setPinError(true);
      }
    } catch (err: any) {
      console.error(err);
      setEmailErrorMsg(`Connection error: ${err.message || 'Server down or unreachable.'}`);
      setPinError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyPIN = async (pin: string) => {
    setIsVerifying(true);
    setPinError(false);
    setEmailErrorMsg(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setView('admin');
        setShowPinGate(false);
        setPinCode('');
      } else {
        let errText = "Incorrect Security PIN Code";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errText = errData.error || errText;
          }
        } catch {}
        setEmailErrorMsg(errText);
        setPinError(true);
        setPinCode('');
      }
    } catch (err: any) {
      console.error(err);
      setEmailErrorMsg(`Connection error: ${err.message}`);
      setPinError(true);
      setPinCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (isVerifying) return;
    setPinError(false);
    if (pinCode.length < 4) {
      const updated = pinCode + num;
      setPinCode(updated);
      if (updated.length === 4) {
        setTimeout(() => {
          handleVerifyPIN(updated);
        }, 200);
      }
    }
  };

  const handleClear = () => {
    if (isVerifying) return;
    setPinCode('');
    setPinError(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      
      {/* Main viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {view === 'admin' && !showPinGate && currentUser ? (
          <AdminSheet currentUser={currentUser} onBackToMenu={handleBackToMenu} />
        ) : (
          /* For customer menu */
          <div className="flex-1 bg-[#ECE9E4] flex items-center justify-center relative py-4 sm:py-8 overflow-y-auto">
            {/* Desktop Background coffee beans vectors decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none select-none bg-[radial-gradient(#9C5D30_1.5px,transparent_1.5px)] [background-size:16px_16px]" />

            {/* Smart Frame Wrappers */}
            <div className="w-full max-w-md bg-white shadow-2xl overflow-hidden sm:rounded-[40px] sm:border-[12px] sm:border-zinc-900 sm:aspect-[9/19] sm:max-h-[880px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] relative flex flex-col transition-all duration-300">
              
              {/* Optional Phone Notch decoration */}
              <div className="hidden sm:block absolute top-0 inset-x-0 h-6 bg-zinc-900 rounded-b-xl z-50 flex items-center justify-center">
                <div className="w-24 h-4 bg-zinc-950 rounded-full" />
              </div>

              {/* Core responsive customer component */}
              <div className="flex-1 overflow-y-auto sm:pt-4">
                <CustomerMenu onGoToAdmin={() => {
                  try {
                    window.history.pushState({}, '', '/admin');
                  } catch (e) {
                    console.warn("History pushState blocked in sandbox/iframe context:", e);
                  }
                  setView('admin');
                  setShowPinGate(true);
                }} />
              </div>

              {/* Optional Screen Home Button Bar simulation */}
              <div className="hidden sm:block h-3.5 bg-zinc-900 shrink-0 relative">
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-zinc-650 rounded-full" />
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Luxury Security Master PIN pad Gate Overlay */}
      {showPinGate && (
        <div className="fixed inset-0 bg-[#1C120C]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FFFDF9] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-amber-900/10 text-center flex flex-col items-center">
            
            {/* Header Lock Icon */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3.5 border transition-all duration-300 ${
              pinError ? 'bg-red-50 border-red-200 text-red-600 animate-shake' : 'bg-amber-50 border-amber-200 text-[#9C5D30]'
            }`}>
              {pinError ? <Shield className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>

            <h3 className="font-serif text-base font-black text-[#3E2412] uppercase tracking-wider">STAFF PORTAL LOGIN</h3>
            <p className="text-[9px] text-[#A28259] uppercase tracking-widest font-bold mt-0.5 mb-4">Iconic Coffee POS Entry</p>

            {/* Elegant Mode Toggle Selector */}
            <div className="flex w-full bg-[#ECE9E4] rounded-xl p-1 mb-5 border border-stone-200 text-[11px] select-none font-sans uppercase tracking-wider">
              <button
                type="button"
                onClick={() => { setLoginMode('pin'); setPinError(false); setEmailErrorMsg(null); }}
                className={`flex-1 py-2 rounded-lg font-black transition-all text-center cursor-pointer ${
                  loginMode === 'pin' ? 'bg-[#9C5D30] text-white shadow-md' : 'text-[#695843] hover:text-[#3E2412]'
                }`}
              >
                Staff PIN
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('email'); setPinError(false); setEmailErrorMsg(null); }}
                className={`flex-1 py-2 rounded-lg font-black transition-all text-center cursor-pointer ${
                  loginMode === 'email' ? 'bg-[#9C5D30] text-white shadow-md' : 'text-[#695843] hover:text-[#3E2412]'
                }`}
              >
                Owner Email
              </button>
            </div>

            {loginMode === 'email' ? (
              /* High-Contrast Email Login Form for Admin */
              <form onSubmit={handleVerifyEmail} className="w-full text-left space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#695843] uppercase tracking-wider block">Super Admin Email / البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rabiulrami@gmail.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:border-[#9C5D30]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-[#695843] uppercase tracking-wider block">Passcode PIN (Verification)</label>
                  </div>
                  <input
                    type="password"
                    placeholder="••••"
                    maxLength={4}
                    value={adminPasswordPin}
                    onChange={(e) => setAdminPasswordPin(e.target.value)}
                    className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:border-[#9C5D30]"
                  />
                </div>

                {emailErrorMsg && (
                  <p className="text-[10px] text-red-600 font-bold leading-normal text-center bg-red-50 p-2 rounded-lg border border-red-150">
                    ✕ {emailErrorMsg}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBackToMenu}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-[#695843] font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Exit
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="flex-1 py-2.5 bg-[#9C5D30] hover:bg-[#854E27] text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isVerifying ? "Verifying..." : "Secure Login"}
                  </button>
                </div>
              </form>
            ) : (
              /* Standard PIN Pad Code */
              <div className="w-full flex flex-col items-center">
                <p className="text-[10.5px] text-stone-500 max-w-[200px] leading-relaxed mb-4">
                  Enter your assigned Security Passcode PIN to access administrative controls.
                </p>

                {/* Dots Display */}
                <div className="flex gap-4.5 mb-5 justify-center">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pinCode.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                          pinError 
                            ? 'border-red-500 bg-red-100'
                            : isFilled
                            ? 'border-[#9C5D30] bg-[#9C5D30] scale-110'
                            : 'border-stone-300 bg-transparent'
                        }`}
                      />
                    );
                  })}
                </div>

                {pinError && (
                  <p className="text-[10px] text-red-655 font-bold mb-3 animate-pulse">
                    🚫 Invalid Staff PIN Code
                  </p>
                )}

                {isVerifying ? (
                  <div className="text-xs text-[#9C5D30] font-mono py-6 animate-pulse">Verifying credentials...</div>
                ) : (
                  /* Custom Premium Tactile Keypad */
                  <div className="grid grid-cols-3 gap-2.5 w-full max-w-[210px] justify-center">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleKeyPress(num)}
                        className="w-12 h-12 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200/50 flex items-center justify-center font-serif text-base font-bold text-[#3D2312] transition-colors active:scale-95 cursor-pointer shadow-xs"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleClear}
                      className="w-12 h-12 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-650 border border-stone-200/50 flex items-center justify-center text-[10px] font-mono font-bold text-stone-600 transition-colors active:scale-95 cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeyPress('0')}
                      className="w-12 h-12 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200/50 flex items-center justify-center font-serif text-base font-bold text-[#3D2312] transition-colors active:scale-95 cursor-pointer shadow-xs"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToMenu}
                      className="w-12 h-12 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200/50 flex items-center justify-center text-[10px] font-bold text-stone-600 transition-colors active:scale-95 cursor-pointer"
                    >
                      Exit
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Developed by credit */}
            <div className="mt-6 pt-4 border-t border-amber-900/10 text-center">
              <p className="text-[10px] font-mono text-[#A28259] tracking-wider uppercase">
                Developed by{' '}
                <a
                  href="https://www.facebook.com/rabiulhasan.2001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline hover:text-amber-800 transition"
                >
                  Rabiul Rami
                </a>
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
