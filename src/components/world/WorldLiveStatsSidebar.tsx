import { Activity, ChevronRight } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { useLiveWorldStats } from '../../hooks/useLiveWorldStats';

export default function WorldLiveStatsSidebar() {
  const { navigate } = useRouter();
  const { stats } = useLiveWorldStats();

  const rows = [
    { label: 'aktív hirdetés', value: stats.listings, accent: '#00E676' },
    { label: 'új hirdetés ma', value: stats.listingsToday, accent: '#38BDF8' },
    { label: 'aktív licit', value: stats.auctions, accent: '#A855F7' },
    { label: 'nyitott állás', value: stats.jobs, accent: '#FBBF24' },
  ];

  return (
    <aside className="world-stats-sidebar piac-glass-panel p-4 flex flex-col gap-3 h-fit">
      <div className="flex items-center gap-2 px-1">
        <Activity className="w-4 h-4 text-[#00E676]" />
        <p className="text-[11px] font-black uppercase tracking-wide text-zinc-200">
          Élő statisztika
        </p>
      </div>
      <ul className="space-y-2.5 px-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="text-zinc-500">{row.label}</span>
            <strong className="font-black tabular-nums" style={{ color: row.accent }}>
              {stats.loading ? '…' : row.value.toLocaleString('hu-HU')}
            </strong>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => navigate('/discover')}
        className="mt-1 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[11px] font-bold text-[#07111f] transition-transform hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, #00E676, #00C853)',
          boxShadow: '0 0 20px rgba(0,230,118,0.35)',
        }}
      >
        Összes tartalom
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
}
