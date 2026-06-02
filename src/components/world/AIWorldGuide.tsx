import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { AI_GUIDE_OPTIONS } from '../../lib/worldZones';

const HIDDEN_PATHS = ['/login', '/register'];

export default function AIWorldGuide() {
  const { navigate, path } = useRouter();
  const [open, setOpen] = useState(false);

  if (HIDDEN_PATHS.includes(path)) return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className="world-ai-fab fixed z-[90] flex items-center gap-2 shadow-2xl"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))', right: '1rem' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="PiacPro AI Guide"
      >
        <Bot className="w-5 h-5 text-cyan-300" />
        <span className="hidden sm:inline text-xs font-bold text-zinc-100">AI Guide</span>
        <span className="world-ai-pulse absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00E676]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[91] bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="world-ai-panel fixed z-[92] inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[380px] rounded-3xl overflow-hidden max-h-[min(80vh,520px)] flex flex-col"
              style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/20 border border-purple-400/30">
                    <Sparkles className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-100">PiacPro AI Guide</p>
                    <p className="text-[10px] text-cyan-400/80">Mit keresel ma?</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="p-2 text-zinc-500 hover:text-zinc-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-2 overflow-y-auto flex-1">
                {AI_GUIDE_OPTIONS.map((opt, i) => (
                  <motion.button
                    key={opt.key}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => { navigate(opt.path); setOpen(false); }}
                    className="world-ai-option w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{opt.label}</p>
                      <p className="text-[11px] text-zinc-500">{opt.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto" />
                  </motion.button>
                ))}
                <button
                  type="button"
                  onClick={() => { navigate('/piac-ai'); setOpen(false); }}
                  className="w-full mt-2 py-3 rounded-2xl text-sm font-bold text-[#07111f] flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #00E676, #06B6D4)' }}
                >
                  <Bot className="w-4 h-4" /> Teljes AI chat
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
