import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Smartphone, Monitor, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed in standalone mode, show clean subtle status or hide
  if (isInstalled) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md font-medium border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Инсталирано</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) setShowGuide(true);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors shadow-2xs"
        title="Инсталирај на компјутер, таблет или телефон"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Инсталирај</span>
      </button>

      {/* Guide Modal for iOS, Android, or Desktop instructions */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  W
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Инсталирај Whiteboard Studio</h3>
                  <p className="text-[11px] text-slate-500">Работи офлајн како домашна апликација</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  За инсталација на вашиот iPad или iPhone:
                </p>
                <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>1. Притиснете го копчето <strong>Share</strong> (Сподели) во Safari.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlusSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>2. Скролајте и изберете <strong>Add to Home Screen</strong> (Додај на почетен екран).</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  За инсталација на вашиот компјутер, таблет или Android:
                </p>
                <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2">
                    <Monitor className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Во Chrome, Edge или Android, притиснете ја иконата за инсталација во лентата со адреси (горе десно) или од менито изберете <strong>„Инсталирај апликација“</strong>.</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Во ред, разбрав
            </button>
          </div>
        </div>
      )}
    </>
  );
};
