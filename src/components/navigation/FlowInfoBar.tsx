import { Info } from 'lucide-react';

const FLOW_MESSAGES: Record<string, { title: string; text: string }> = {
  listing: {
    title: 'Hogyan működik?',
    text: 'Nincs online fizetés — üzenetben egyeztek az eladóval az átvételről vagy szállításról.',
  },
  checkout: {
    title: 'Következő lépés',
    text: 'Az üzenetedet elküldjük az eladónak. Ott egyeztettek az átvételről vagy szállításról.',
  },
  shop: {
    title: 'Hogyan működik?',
    text: 'Érdeklődés üzenetben → egyeztetés a bolttal → átvétel vagy szállítás.',
  },
  producer: {
    title: 'Hogyan működik?',
    text: 'Kosárba teszed a termékeket → megrendelés üzenetben → a termelő visszajelez.',
  },
  job: {
    title: 'Hogyan működik?',
    text: 'A jelentkezés üzenet a munkáltatónak — ott folytatjátok az egyeztetést.',
  },
};

export type FlowInfoVariant = keyof typeof FLOW_MESSAGES;

export default function FlowInfoBar({ variant }: { variant: FlowInfoVariant }) {
  const msg = FLOW_MESSAGES[variant];
  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-4 py-3 mb-5 border border-emerald-500/20 bg-emerald-500/8"
      role="note"
    >
      <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-emerald-300">{msg.title}</p>
        <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">{msg.text}</p>
      </div>
    </div>
  );
}
