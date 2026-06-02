import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles, ChevronRight, Lightbulb } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { AI_GUIDE_OPTIONS, getZoneForPath } from '../../lib/worldZones';

const HIDDEN_PATHS = ['/login', '/register'];

export default function AIWorldGuide() {
  const { navigate, path } = useRouter();
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const currentZone = getZoneForPath(path);
    const sorted = [...AI_GUIDE_OPTIONS].sort((a, b) => a.priority - b.priority);
    if (!currentZone) return sorted.slice(0, 6);
    return sorted
      .filter((o) => o.zone !== currentZone.id)
      .slice(0, 6);
  }, [path]);

  const smartTip = useMemo(() => {
    if (path.includes('donation') || path.includes('offer')) return 'Köszönjük, hogy segítesz — az Adomány Tér a támogatások otthona.';
    if (path.startsWith('/jobs')) return 'Állást keresel? Nézd meg a küldetés jellegű hirdetéseket is.';
    if (path.startsWith('/auction')) return 'Az arénában minden másodperc számít — figyeld az élő liciteket.';
    return 'Mondd el, mit keresel — én navigálok a megfelelő világba.';
  }, [path]);

  if (HIDDEN_PATHS.includes(path) || path === '/') return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className="world-ai-fab world-ai-fab-icon-only fixed z-[90] flex items-center justify-center shadow-2xl rounded-full"
        style={{
          bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))',
          right: '1rem',
          width: '3rem',
          height: '3rem',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="PiacPro AI Guide"
      >
        <Bot className="w-5 h-5 text-cyan-300" />
        <span className="world-ai-pulse absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#00E676]" />
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
              className="world-ai-panel fixed z-[92] inset-x-3 sm:inset-x-auto sm:right-6 sm:w-[400px] rounded-3xl overflow-hidden max-h-[min(80vh,540px)] flex flex-col"
              style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <div
                className="p-4 border-b border-white/10 flex items-center justify-between gap-2"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(6,182,212,0.12))' }}
              >
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

              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{smartTip}</p>
                </div>
              </div>

              <div className="p-3 space-y-2 overflow-y-auto flex-1">
                {suggestions.map((opt, i) => (
                  <motion.button
                    key={opt.key}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => { navigate(opt.path); setOpen(false); }}
                    className="world-ai-option w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-100">{opt.label}</p>
                        {opt.hint && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25">
                            {opt.hint}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">{opt.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  </motion.button>
                ))}
                <button
                  type="button"
                  onClick={() => { navigate('/piac-ai'); setOpen(false); }}
                  className="w-full mt-2 py-3 rounded-2xl text-sm font-bold text-[#07111f] flex items-center justify-center gap-2 world-btn-glow"
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
