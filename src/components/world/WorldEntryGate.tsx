import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { HOME_WOW_STORAGE } from '../../lib/homeWow';

const STORAGE_KEY = HOME_WOW_STORAGE.worldEntered;

export default function WorldEntryGate({ onEnter }: { onEnter: () => void }) {
  const [exiting, setExiting] = useState(false);

  function handleEnter() {
    setExiting(true);
    sessionStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => {
      onEnter();
    }, 900);
  }

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.5 }}
          className="world-entry-gate fixed inset-0 z-[200] flex items-center justify-center px-4"
        >
          <div className="world-entry-fog absolute inset-0 pointer-events-none" aria-hidden />
          <div className="world-entry-particles absolute inset-0 pointer-events-none" aria-hidden />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-xl w-full text-center"
          >
            <motion.div
              className="world-entry-logo mx-auto mb-8 w-20 h-20 rounded-full flex items-center justify-center"
              animate={{ boxShadow: ['0 0 40px rgba(0,230,118,0.3)', '0 0 80px rgba(124,58,237,0.4)', '0 0 40px rgba(6,182,212,0.35)'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-9 h-9 text-[#00E676]" />
            </motion.div>

            <p className="text-[10px] font-black tracking-[0.35em] uppercase text-cyan-400/80 mb-4">
              PiacPro · Digitális Ökoszisztéma
            </p>
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-4">
              Egyetlen platform.
              <br />
              <span className="bg-gradient-to-r from-[#00E676] via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Minden lehetőség.
              </span>
              <br />
              Egy élő digitális világ.
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base mb-10 max-w-md mx-auto leading-relaxed">
              Ne böngéssz oldalakat — lépj be egy zónákból álló univerzumba, ahol minden funkció egy hely.
            </p>

            <motion.button
              type="button"
              onClick={handleEnter}
              className="world-entry-cta relative px-10 py-4 rounded-2xl text-base sm:text-lg font-black text-[#07111f] overflow-hidden"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                BELÉPÉS A VILÁGBA
              </span>
              <span className="world-entry-cta-sweep absolute inset-0 pointer-events-none" aria-hidden />
            </motion.button>
            <button
              type="button"
              onClick={handleEnter}
              className="mt-5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline-offset-2 hover:underline"
            >
              Kihagyás — egyből a térkép
            </button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="zoom"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="world-entry-gate fixed inset-0 z-[200] bg-[#07111f]"
        />
      )}
    </AnimatePresence>
  );
}

export function shouldShowWorldEntry(): boolean {
  try {
    return !sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}
