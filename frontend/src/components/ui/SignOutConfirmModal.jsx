import React from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut, AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';

export const SignOutConfirmModal = () => {
  const { isSignOutModalOpen, setIsSignOutModalOpen, logout, currentUser } = useApp();

  if (!isSignOutModalOpen) return null;

  const handleConfirm = () => {
    setIsSignOutModalOpen(false);
    logout();
  };

  const handleCancel = () => {
    setIsSignOutModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 text-center">
          {/* Warning Icon Badge */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
            <LogOut className="w-8 h-8 ml-0.5" />
          </div>

          <h2 id="signout-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Confirm Sign Out
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
            Are you sure you want to sign out of <span className="font-bold text-slate-800">MedConnect</span>? Your active session and tokens will be securely closed.
          </p>

          {/* User Preview Card */}
          {currentUser && (
            <div className="flex items-center gap-3 p-3.5 mb-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                {currentUser.avatar || (currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'U')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 truncate">{currentUser.name || 'User Account'}</p>
                <p className="text-[11px] text-slate-500 font-medium truncate">{currentUser.email || currentUser.phone || 'Signed In'}</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200 shrink-0">
                {currentUser.role || 'Patient'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 active:bg-slate-100 transition-all focus:outline-hidden focus:ring-2 focus:ring-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:from-rose-700 active:to-red-700 text-white font-black text-sm shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Yes, Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
