import { useEffect, useState, useCallback } from 'react';
import { X, Save, Upload, Loader2, MousePointer2 } from 'lucide-react';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  getEditMeta,
  getConfigValueByEditKey,
  setConfigValueByEditKey,
} from '../lib/piacEdit';
import { uploadSiteAsset } from '../lib/uploadSiteAsset';

export default function InlineDevEditor() {
  const { devModeActive, config, saveConfig } = useSiteCustomization();
  const { showToast } = useNotification();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const close = useCallback(() => {
    setActiveKey(null);
    setDraft('');
  }, []);

  useEffect(() => {
    if (!devModeActive) {
      close();
      document.body.classList.remove('piac-dev-edit-active');
      return;
    }
    document.body.classList.add('piac-dev-edit-active');

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('.piac-inline-editor, .piac-dev-toolbar, .city-map-hotspot-editor')) return;
      if (target.closest('.city-map-hotspot-editor, .city-building-pin')) return;
      if (target.closest('[data-dev-map-tool]') && !target.closest('[data-piac-edit]')) return;
      if (target.closest('input, textarea, select, option, [contenteditable="true"]')) return;
      if (target.closest('button, a') && !target.closest('[data-piac-edit]')) return;
      const el = target.closest('[data-piac-edit]') as HTMLElement | null;
      if (!el) return;
      if (el.matches('input, textarea, select')) return;
      e.preventDefault();
      e.stopPropagation();
      const key = el.getAttribute('data-piac-edit');
      if (!key) return;
      setActiveKey(key);
      document.querySelectorAll('.piac-editable-selected').forEach((n) =>
        n.classList.remove('piac-editable-selected'),
      );
      el.classList.add('piac-editable-selected');
    }

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.body.classList.remove('piac-dev-edit-active');
    };
  }, [devModeActive, close]);

  useEffect(() => {
    if (activeKey) setDraft(getConfigValueByEditKey(config, activeKey));
  }, [activeKey, config]);

  async function handleSave() {
    if (!activeKey) return;
    setSaving(true);
    const next = setConfigValueByEditKey(config, activeKey, draft);
    const { error, usedLocalFallback } = await saveConfig(next);
    setSaving(false);
    if (error) showToast('error', 'Mentés sikertelen', error);
    else {
      showToast(
        'success',
        'Mentve',
        usedLocalFallback ? 'Helyi mentés (futtasd a Supabase migrációt az élő szinkronhoz).' : 'Az oldal frissült.',
      );
      close();
    }
  }

  async function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeKey) return;
    setUploading(true);
    const { url, error } = await uploadSiteAsset(file);
    setUploading(false);
    e.target.value = '';
    if (error) {
      showToast('error', 'Kép', error);
      return;
    }
    if (!url) return;
    setDraft(url);
    setSaving(true);
    const next = setConfigValueByEditKey(config, activeKey, url);
    const { error: saveErr, usedLocalFallback } = await saveConfig(next);
    setSaving(false);
    if (saveErr) showToast('error', 'Mentés sikertelen', saveErr);
    else {
      showToast(
        'success',
        'Kép mentve',
        usedLocalFallback ? 'Helyi mentés — a kép azonnal frissült.' : 'A kép azonnal frissült az oldalon.',
      );
      close();
    }
  }

  if (!devModeActive) return null;

  const meta = activeKey ? getEditMeta(activeKey) : null;

  return (
    <>
        <div className="piac-dev-toolbar fixed top-20 left-1/2 -translate-x-1/2 z-[95] px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 pointer-events-none max-w-[min(100vw-1rem,42rem)] text-center"
        style={{
          background: 'rgba(124,58,237,0.9)',
          color: '#fff',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
        <MousePointer2 className="w-3.5 h-3.5" />
        Kattints a lila keretes elemre, vagy a felső fejlesztői gombokra
      </div>

      {activeKey && meta && (
        <div className="piac-inline-editor fixed inset-x-0 bottom-20 z-[96] px-4 flex justify-center">
          <div
            className="w-full max-w-lg rounded-2xl p-4 space-y-3 shadow-2xl"
            style={{
              background: 'rgba(7,17,31,0.98)',
              border: '1px solid rgba(124,58,237,0.5)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-violet-300">{meta.label}</p>
              <button type="button" onClick={close} className="p-1.5 text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {meta.type === 'image' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="URL vagy feltöltés után automatikus"
                  className="w-full px-3 py-2 glass-input rounded-xl text-sm text-zinc-100"
                />
                <label className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-violet-500/40 cursor-pointer hover:bg-violet-500/10">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="text-sm text-zinc-300">Kép feltöltése</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onImageFile} disabled={uploading} />
                </label>
                {draft && (
                  <img src={draft} alt="" className="h-20 w-full object-cover rounded-lg border border-white/10" />
                )}
              </div>
            ) : meta.type === 'textarea' ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 glass-input rounded-xl text-sm text-zinc-100 resize-none"
              />
            ) : meta.type === 'color' ? (
              <div className="flex gap-2">
                <input type="color" value={draft || '#00d084'} onChange={(e) => setDraft(e.target.value)} className="w-12 h-10 rounded-lg" />
                <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 px-3 py-2 glass-input rounded-xl text-sm" />
              </div>
            ) : (
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-sm text-zinc-100"
              />
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-zinc-900 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Mentés...' : 'Mentés az élő oldalra'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
