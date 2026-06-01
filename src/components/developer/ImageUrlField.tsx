import { useState } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadSiteAsset } from '../../lib/uploadSiteAsset';

export function ImageUrlField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    const { url, error } = await uploadSiteAsset(file);
    setUploading(false);
    if (error) setErr(error);
    else if (url) onChange(url);
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-zinc-500 block">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/képem.jpg vagy https://..."
          className="flex-1 px-3 py-2.5 glass-input rounded-xl text-zinc-100 text-sm focus:outline-none"
        />
        <label
          className={`flex items-center justify-center w-11 h-11 rounded-xl border border-dashed cursor-pointer transition-colors ${
            uploading ? 'border-[#00d084]/40 opacity-60' : 'border-white/15 hover:border-[#00d084]/40'
          }`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 text-[#00d084] animate-spin" />
          ) : (
            <Upload className="w-4 h-4 text-zinc-500" />
          )}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onFile} />
        </label>
      </div>
      {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
      {err && <p className="text-[10px] text-red-400">{err}</p>}
      {value && (
        <div className="relative h-24 rounded-xl overflow-hidden border border-white/10 bg-black/30">
          <img src={value} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.opacity = '0.3')} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ImageIcon className="w-6 h-6 text-zinc-600 opacity-0" />
          </div>
        </div>
      )}
    </div>
  );
}

export function inputCls() {
  return 'w-full px-3 py-2.5 glass-input rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm';
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
