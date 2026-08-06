import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Upload, Eye, EyeOff, ArrowUp, ArrowDown, X } from 'lucide-react';
import { CATEGORIES } from '../data';

interface Promo {
  id: string;
  label: string;
  labelAr: string;
  image: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

/**
 * Editor for the "Iconic Range" cards on the customer menu.
 *
 * Staff use this to run a giveaway or a sale: upload the artwork, name it, point it
 * at a category (or leave it as a pure announcement), and hide it again when the
 * promotion ends. Hiding is preferred over deleting so a seasonal card can come back.
 */
export default function AdminPromos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // New-card form
  const [showForm, setShowForm] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftLabelAr, setDraftLabelAr] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftImage, setDraftImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (text: string, kind: 'ok' | 'err' = 'ok') => {
    setMsg({ text, kind });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      // ?all=1 returns hidden cards too, which the customer endpoint filters out.
      const res = await fetch('/api/promos?all=1');
      if (res.ok) setPromos(await res.json());
    } catch {
      flash('Could not load the promo cards.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      flash('That file is not an image.', 'err');
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, base64 }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
      setDraftImage(data.url);
      flash('Image uploaded.');
    } catch (err: any) {
      flash(err.message || 'Upload failed.', 'err');
    } finally {
      setUploading(false);
    }
  };

  const createPromo = async () => {
    if (!draftImage) { flash('Upload an image first.', 'err'); return; }
    setBusyId('new');
    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: draftLabel, labelAr: draftLabelAr,
          image: draftImage, category: draftCategory, isActive: true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDraftLabel(''); setDraftLabelAr(''); setDraftCategory(''); setDraftImage('');
      setShowForm(false);
      await load();
      flash('Promo card added — it is live on the menu now.');
    } catch (err: any) {
      flash(err.message || 'Could not add the card.', 'err');
    } finally {
      setBusyId(null);
    }
  };

  const patchPromo = async (id: string, changes: Partial<Promo>) => {
    setBusyId(id);
    // Optimistic: the row updates immediately and load() reconciles after.
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
    try {
      const res = await fetch(`/api/promos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await load();
    } catch (err: any) {
      flash(err.message || 'Could not save the change.', 'err');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const removePromo = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/promos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setConfirmDelete(null);
      await load();
      flash('Promo card removed.');
    } catch (err: any) {
      flash(err.message || 'Could not remove the card.', 'err');
    } finally {
      setBusyId(null);
    }
  };

  /** Swap sortOrder with the neighbour so the card moves one place on the menu. */
  const move = async (index: number, direction: -1 | 1) => {
    const target = promos[index + direction];
    const current = promos[index];
    if (!target || !current) return;
    await patchPromo(current.id, { sortOrder: target.sortOrder });
    await patchPromo(target.id, { sortOrder: current.sortOrder });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-500" />
            Iconic Range Cards
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[52ch] leading-relaxed">
            The scrolling showcase at the top of the customer menu. Add a card for a
            giveaway or a sale, and hide it when the promotion ends.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-3.5 py-2 bg-[#9C5D30] hover:bg-[#854E27] text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition shrink-0"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'New card'}
        </button>
      </div>

      {msg && (
        <p className={`text-[11px] font-bold px-3 py-2 rounded-lg border ${
          msg.kind === 'ok'
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
            : 'text-red-400 bg-red-500/10 border-red-500/30'
        }`}>
          {msg.text}
        </p>
      )}

      {showForm && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-4 text-center cursor-pointer transition"
          >
            {draftImage ? (
              <img src={draftImage} alt="" className="w-full aspect-[3/2] object-cover rounded-lg" />
            ) : (
              <div className="py-6 text-slate-500">
                <Upload className="w-6 h-6 mx-auto mb-2" />
                <p className="text-[11px] font-bold">{uploading ? 'Uploading…' : 'Click or drop an image'}</p>
                <p className="text-[10px] mt-1">Wide artwork works best (3:2)</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">Title</label>
              <input
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                placeholder="e.g. Buy 1 Get 1 Free"
                className="w-full text-[12px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">Title (Arabic)</label>
              <input
                dir="rtl"
                value={draftLabelAr}
                onChange={(e) => setDraftLabelAr(e.target.value)}
                placeholder="اشترِ واحدة واحصل على أخرى"
                className="w-full text-[12px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">Tapping it opens</label>
            <select
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
              className="w-full text-[12px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/60"
            >
              <option value="">Nothing — announcement only</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.nameEn}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={createPromo}
            disabled={busyId === 'new' || uploading || !draftImage}
            className="w-full py-2.5 bg-[#9C5D30] hover:bg-[#854E27] disabled:opacity-40 text-white text-[12px] font-bold rounded-lg cursor-pointer transition"
          >
            {busyId === 'new' ? 'Adding…' : 'Add to the menu'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-[11px] text-slate-500 py-6 text-center font-mono">Loading cards…</p>
      ) : promos.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[12px] text-slate-400 font-bold">No custom cards yet</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-[46ch] mx-auto leading-relaxed">
            The menu is showing the seven built-in category banners. Add a card here and
            it replaces them.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {promos.map((p, i) => (
            <div
              key={p.id}
              className={`bg-slate-950 border rounded-xl p-3 flex items-center gap-3 transition ${
                p.isActive ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
              }`}
            >
              <img src={p.image} alt="" className="w-24 aspect-[3/2] object-cover rounded-lg shrink-0 bg-slate-900" />

              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-slate-100 truncate">{p.label || 'Untitled card'}</p>
                {p.labelAr && <p className="text-[11px] text-slate-400 truncate" dir="rtl">{p.labelAr}</p>}
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {p.category
                    ? `opens ${CATEGORIES.find((c) => c.id === p.category)?.nameEn ?? p.category}`
                    : 'announcement only'}
                  {!p.isActive && ' · hidden'}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || busyId !== null}
                  title="Move earlier"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-25 cursor-pointer transition"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === promos.length - 1 || busyId !== null}
                  title="Move later"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-25 cursor-pointer transition"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => patchPromo(p.id, { isActive: !p.isActive })}
                  disabled={busyId !== null}
                  title={p.isActive ? 'Hide from the menu' : 'Show on the menu'}
                  className={`p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition ${
                    p.isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {p.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(p.id)}
                  disabled={busyId !== null}
                  title="Remove"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-xs w-full text-center space-y-3">
            <p className="text-[13px] font-bold text-slate-100">Remove this card?</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              It disappears from the customer menu straight away. To bring it back later,
              hide it instead.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer transition"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={() => removePromo(confirmDelete)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-lg cursor-pointer transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
