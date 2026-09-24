import React, { useEffect, useState, useCallback } from 'react';
import { X, CircleUser, LogIn, UserPlus, LogOut, KeyRound, Package, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../lib/supabase.ts';
import { formatINR } from '../lib/format.ts';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

interface CustomerOrder {
  id: string;
  total_amount: number | null;
  total: number | null;
  status: string | null;
  created_at: string | null;
  items_summary: string | null;
}

/**
 * Account modal backed by real Supabase GoTrue authentication.
 *
 * Replaces the pre-fix mock UI (hardcoded `guest.patron@jassproducts.com`
 * profile and fabricated orders JP-89214/JP-78103). Signed-out visitors see a
 * sign-in / sign-up / password-reset form; signed-in customers see their real
 * profile and their own orders, fetched through the RLS-protected `orders`
 * SELECT policy (only rows where user_id = auth.uid() are reachable).
 */
export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { user, isAdmin, signIn, signUp, requestPasswordReset, signOut } = useAuth();

  // Signed-out state
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Signed-in state
  const [tab, setTab] = useState<'profile' | 'orders'>('profile');
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
      setResetSent(false);
      setMode('signin');
    }
  }, [isOpen]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setOrders(null);
    setOrdersError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, total, status, created_at, items_summary')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) {
        setOrdersError('Could not load your orders. Please try again.');
        return;
      }
      setOrders((data as CustomerOrder[]) ?? []);
    } catch {
      setOrdersError('Could not load your orders. Please try again.');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      setTab('profile');
      void loadOrders();
    }
  }, [isOpen, user, loadOrders]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    const { error } = await signIn(email.trim(), password);
    setAuthBusy(false);
    if (error) setAuthError(error);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    const { error } = await signUp(email.trim(), password, name.trim());
    setAuthBusy(false);
    if (error) {
      setAuthError(error);
    } else {
      setMode('signin');
      setAuthError(null);
      setResetSent(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    const { error } = await requestPasswordReset(email.trim());
    setAuthBusy(false);
    if (error) {
      setAuthError(error);
    } else {
      setResetSent(true);
    }
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  const handleTrack = (orderId: string) => {
    onClose();
    onNavigate(`track-order?id=${encodeURIComponent(orderId)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ------------------------------------------------------------------ signed out
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-md bg-[#FAF9F6] rounded-[2rem] shadow-2xl overflow-hidden z-10 border border-[#d2c2ad]/60 animate-in zoom-in-95 duration-200">
          <div className="p-6 bg-[#f4f1ea] border-b border-[#d2c2ad]/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8b6d43]/15 text-[#8b6d43] flex items-center justify-center">
                <CircleUser className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-neutral-900">
                {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
              </h3>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-neutral-200 text-neutral-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {resetSent ? (
              <div className="text-center py-4">
                <KeyRound className="w-10 h-10 mx-auto text-[#8b6d43] mb-3" />
                <p className="text-sm text-neutral-800 font-semibold mb-1">Check your inbox</p>
                <p className="text-xs text-neutral-600 mb-4">If an account exists for {email}, a password-reset link has been sent.</p>
                <button type="button" onClick={() => { setResetSent(false); setMode('signin'); }} className="text-xs font-bold uppercase tracking-widest text-[#8b6d43] cursor-pointer">Back to sign in</button>
              </div>
            ) : (
              <>
                {authError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{authError}</div>}
                {mode === 'reset' ? (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div>
                      <label htmlFor="am-email-r" className="block text-[11px] uppercase font-semibold tracking-wider text-neutral-700 mb-1">Email</label>
                      <input id="am-email-r" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-[#8b6d43] text-sm" />
                    </div>
                    <button type="submit" disabled={authBusy} className="w-full py-3 rounded-full bg-[#8b6d43] hover:bg-[#735835] text-white text-xs font-bold tracking-widest uppercase cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                      {authBusy && <Loader2 className="w-4 h-4 animate-spin" />}Send reset link
                    </button>
                  </form>
                ) : (
                  <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                    {mode === 'signup' && (
                      <div>
                        <label htmlFor="am-name" className="block text-[11px] uppercase font-semibold tracking-wider text-neutral-700 mb-1">Full name</label>
                        <input id="am-name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-[#8b6d43] text-sm" />
                      </div>
                    )}
                    <div>
                      <label htmlFor="am-email" className="block text-[11px] uppercase font-semibold tracking-wider text-neutral-700 mb-1">Email</label>
                      <input id="am-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-[#8b6d43] text-sm" />
                    </div>
                    <div>
                      <label htmlFor="am-pass" className="block text-[11px] uppercase font-semibold tracking-wider text-neutral-700 mb-1">Password</label>
                      <input id="am-pass" type="password" required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-[#8b6d43] text-sm" />
                      {mode === 'signup' && <p className="text-[10px] text-neutral-500 mt-1">Minimum 8 characters.</p>}
                    </div>
                    <button type="submit" disabled={authBusy} className="w-full py-3 rounded-full bg-[#8b6d43] hover:bg-[#735835] text-white text-xs font-bold tracking-widest uppercase cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                      {authBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                  </form>
                )}
                <div className="mt-4 flex flex-col gap-1.5 text-center text-xs text-neutral-600">
                  {mode !== 'signin' && (
                    <button type="button" onClick={() => setMode('signin')} className="text-[#8b6d43] font-semibold cursor-pointer">Already have an account? Sign in</button>
                  )}
                  {mode === 'signin' && (
                    <>
                      <button type="button" onClick={() => setMode('signup')} className="text-[#8b6d43] font-semibold cursor-pointer">New here? Create an account</button>
                      <button type="button" onClick={() => setMode('reset')} className="text-neutral-500 hover:text-neutral-800 cursor-pointer">Forgot your password?</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------- signed in
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-[#FAF9F6] rounded-[2rem] shadow-2xl overflow-hidden z-10 border border-[#d2c2ad]/60 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        <div className="p-6 bg-[#f4f1ea] border-b border-[#d2c2ad]/40 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#8b6d43]/15 text-[#8b6d43] flex items-center justify-center font-serif text-lg font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-xl font-bold text-neutral-900 truncate">{user.name}</h3>
              <p className="text-[11px] font-medium tracking-wider text-[#8b6d43] uppercase truncate">{user.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-neutral-200 text-neutral-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-[#d2c2ad]/30 bg-[#fbfbf9] text-xs font-semibold uppercase tracking-wider">
          <button type="button" onClick={() => setTab('profile')} className={`flex-1 py-3 text-center cursor-pointer border-b-2 ${tab === 'profile' ? 'border-[#8b6d43] text-[#8b6d43] bg-white' : 'border-transparent text-neutral-600'}`}>Profile</button>
          <button type="button" onClick={() => setTab('orders')} className={`flex-1 py-3 text-center cursor-pointer border-b-2 ${tab === 'orders' ? 'border-[#8b6d43] text-[#8b6d43] bg-white' : 'border-transparent text-neutral-600'}`}>
            My Orders {orders ? `(${orders.length})` : ''}
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {tab === 'profile' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-[#d2c2ad]/50 bg-white text-sm space-y-2">
                <div className="flex justify-between"><span className="text-neutral-500">Name</span><span className="font-medium text-neutral-900">{user.name}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Email</span><span className="font-medium text-neutral-900 break-all">{user.email}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Account type</span><span className="font-medium text-neutral-900">{isAdmin ? user.role.replace('_', ' ') : 'Customer'}</span></div>
              </div>
              {isAdmin && (
                <button type="button" onClick={() => { onClose(); onNavigate('admin'); }} className="w-full py-3 rounded-full bg-neutral-900 text-white text-xs font-bold tracking-widest uppercase cursor-pointer">Open Admin Console</button>
              )}
              <button type="button" onClick={handleSignOut} className="w-full py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {ordersError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{ordersError}</div>}
              {orders === null && !ordersError && (
                <div className="py-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading your orders…</div>
              )}
              {orders?.length === 0 && (
                <div className="py-8 text-center">
                  <Package className="w-10 h-10 mx-auto text-[#8b6d43]/50 mb-3" />
                  <p className="text-sm text-neutral-800 font-semibold mb-1">No orders yet</p>
                  <p className="text-xs text-neutral-500">Orders placed while signed in appear here.</p>
                </div>
              )}
              {orders?.map((order) => (
                <div key={order.id} className="p-4 rounded-2xl border border-[#d2c2ad]/50 bg-white">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-mono text-xs font-bold text-neutral-900">{order.id}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f4efe6] text-[#8b6d43]">{order.status ?? '—'}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 truncate mb-1">{order.items_summary ?? ''}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-neutral-500">{order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-neutral-900">{formatINR(Number(order.total_amount ?? order.total ?? 0))}</span>
                      <button type="button" onClick={() => handleTrack(order.id)} className="text-[10px] font-bold uppercase tracking-widest text-[#8b6d43] cursor-pointer">Track</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
