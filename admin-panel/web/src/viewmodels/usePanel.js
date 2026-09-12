import { computed } from 'vue';
import { istatistikService } from '@/services';
import { useAsyncKaynak } from './useAsyncKaynak.js';

const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function usePanel() {
  const { veri, yukleniyor, hata, calistir } = useAsyncKaynak(() => istatistikService.panel());
  const ozet = computed(() => veri.value?.data ?? null);

  const tumSirketler = computed(() => ozet.value?.kapsam === 'tum-sirketler');

  const kartlar = computed(() => {
    const k = ozet.value?.kartlar;
    if (!k) return [];
    const liste = [
      { anahtar: 'aktifEtkinlik', etiket: 'Aktif etkinlik', deger: k.aktifEtkinlik, ton: 'konferans', simge: 'takvim' },
      { anahtar: 'bekleyenBasvuru', etiket: 'Bekleyen başvuru', deger: k.bekleyenBasvuru, ton: 'hackathon', simge: 'gelen' },
      { anahtar: 'onayliKatilimci', etiket: 'Onaylı katılımcı', deger: k.onayliKatilimci, ton: 'sunum', simge: 'kisiler' },
    ];
    // Şirket adminine "kayıtlı şirket: 1" göstermek bilgi taşımaz.
    if (tumSirketler.value) {
      liste.push({ anahtar: 'kayitliSirket', etiket: 'Kayıtlı şirket', deger: k.kayitliSirket, ton: 'uyari', simge: 'bina' });
    }
    return liste;
  });

  /** Grafik için normalize edilmiş aylık seri. */
  const aylik = computed(() => {
    const satirlar = ozet.value?.aylik ?? [];
    const enYuksek = Math.max(1, ...satirlar.map((s) => Math.max(s.konferans, s.sunum, s.hackathon)));
    return satirlar.map((s) => ({
      etiket: AY_KISA[Number(s.ay.slice(5, 7)) - 1],
      seriler: [
        { ad: 'konferans', deger: s.konferans, yuzde: (s.konferans / enYuksek) * 100 },
        { ad: 'sunum', deger: s.sunum, yuzde: (s.sunum / enYuksek) * 100 },
        { ad: 'hackathon', deger: s.hackathon, yuzde: (s.hackathon / enYuksek) * 100 },
      ],
    }));
  });

  const yaklasan = computed(() => ozet.value?.yaklasan ?? []);
  const sonBasvurular = computed(() => ozet.value?.sonBasvurular ?? []);
  const sehirDagilimi = computed(() => ozet.value?.sehirDagilimi ?? []);

  return { kartlar, aylik, yaklasan, sonBasvurular, sehirDagilimi, tumSirketler, yukleniyor, hata, yukle: calistir };
}
