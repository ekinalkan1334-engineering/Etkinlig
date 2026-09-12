// Vitrinin API katmanı — oturumsuz /api/acik uçları.
const TEMEL = import.meta.env.VITE_API_URL ?? '/api';

const sorgu = (params) => {
  const a = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null || v === '') continue;
    a.set(k, String(v));
  }
  const s = a.toString();
  return s ? `?${s}` : '';
};

async function iste(yol, params) {
  const yanit = await fetch(`${TEMEL}/acik${yol}${sorgu(params)}`);
  const govde = await yanit.json().catch(() => null);
  if (!yanit.ok) throw new Error(govde?.error?.message ?? 'Veri alınamadı');
  return govde.data;
}

export const etkinlikleriGetir = (filtre) => iste('/etkinlikler', filtre);
export const etkinligiGetir = (id) => iste(`/etkinlikler/${id}`);
export const filtreleriGetir = () => iste('/filtreler');
