<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppUstCubuk from '@/components/layout/AppUstCubuk.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppKart from '@/components/ui/AppKart.vue';
import StatKart from '@/components/ui/StatKart.vue';
import TurRozeti from '@/components/ui/TurRozeti.vue';
import DurumMesaji from '@/components/ui/DurumMesaji.vue';
import { usePanel } from '@/viewmodels/usePanel.js';
import { saat, sayi, tarih, tarihUzun } from '@/utils/format.js';

const router = useRouter();
const vm = usePanel();
onMounted(() => vm.yukle());

const basHarfler = (ad) => ad.split(' ').map((p) => p[0]).join('').slice(0, 2);
</script>

<template>
  <AppUstCubuk baslik="Panel" :alt-baslik="`${tarihUzun(new Date())} · Genel durum özeti`">
    <template #aksiyon>
      <AppButton cesit="birincil" simge="arti" @click="router.push({ name: 'etkinlik-yeni' })">
        Yeni etkinlik
      </AppButton>
    </template>
  </AppUstCubuk>

  <div class="sayfa">
    <DurumMesaji :yukleniyor="vm.yukleniyor.value" :hata="vm.hata.value" />

    <template v-if="!vm.yukleniyor.value && !vm.hata.value">
      <div class="kartlar">
        <StatKart
          v-for="k in vm.kartlar.value" :key="k.anahtar"
          :etiket="k.etiket" :deger="k.deger" :ton="k.ton" :simge="k.simge"
        />
      </div>

      <div class="izgara">
        <AppKart class="izgara__genis" baslik="Yaklaşan etkinlikler">
          <template #aksiyon>
            <RouterLink :to="{ name: 'etkinlikler' }" class="baglanti">Tümünü gör</RouterLink>
          </template>
          <p v-if="!vm.yaklasan.value.length" class="bos">Planlanmış yaklaşan etkinlik yok.</p>
          <ul v-else class="liste">
            <li v-for="e in vm.yaklasan.value" :key="e.id" class="satir">
              <div class="gun">
                <span class="gun__no">{{ tarih(e.baslangic).slice(0, 2) }}</span>
                <span class="gun__ay">{{ tarih(e.baslangic).split(' ')[1] }}</span>
              </div>
              <div class="satir__metin">
                <RouterLink :to="{ name: 'etkinlik-detay', params: { id: e.id } }" class="satir__baslik">
                  {{ e.baslik }}
                </RouterLink>
                <span class="satir__alt">{{ e.sirket }} · {{ e.sehir }} · {{ saat(e.baslangic) }}</span>
              </div>
              <TurRozeti :tur="e.tur" />
              <span class="satir__kota">{{ e.onayli }}/{{ e.kontenjan }}</span>
            </li>
          </ul>
        </AppKart>

        <AppKart baslik="Son başvurular">
          <p v-if="!vm.sonBasvurular.value.length" class="bos">Henüz başvuru yok.</p>
          <ul v-else class="liste">
            <li v-for="b in vm.sonBasvurular.value" :key="b.id" class="satir satir--dar">
              <div class="avatar">{{ basHarfler(b.adSoyad) }}</div>
              <div class="satir__metin">
                <span class="satir__baslik">{{ b.adSoyad }}</span>
                <span class="satir__alt">{{ b.bolum ?? 'Bölüm yok' }} · {{ b.etkinlik }}</span>
              </div>
              <span class="satir__zaman">{{ tarih(b.tarih) }}</span>
            </li>
          </ul>
        </AppKart>
      </div>

      <div class="izgara">
        <AppKart class="izgara__genis" baslik="Aylık etkinlik dağılımı">
          <template #aksiyon>
            <div class="lejant">
              <span><i class="nokta nokta--konferans" />Konferans</span>
              <span><i class="nokta nokta--sunum" />Sunum</span>
              <span><i class="nokta nokta--hackathon" />Hackathon</span>
            </div>
          </template>
          <p v-if="!vm.aylik.value.length" class="bos">Grafik için yeterli veri yok.</p>
          <div v-else class="grafik">
            <div v-for="a in vm.aylik.value" :key="a.etiket" class="grafik__sutun">
              <div class="grafik__cubuklar">
                <div
                  v-for="s in a.seriler" :key="s.ad" class="grafik__cubuk"
                  :class="`grafik__cubuk--${s.ad}`" :style="{ height: `${s.yuzde}%` }"
                  :title="`${s.ad}: ${s.deger}`"
                />
              </div>
              <span class="grafik__etiket">{{ a.etiket }}</span>
            </div>
          </div>
        </AppKart>

        <AppKart baslik="Şehirlere göre">
          <p v-if="!vm.sehirDagilimi.value.length" class="bos">Veri yok.</p>
          <ul v-else class="dagilim">
            <li v-for="s in vm.sehirDagilimi.value" :key="s.sehir">
              <div class="dagilim__ust">
                <span>{{ s.sehir }}</span><span class="dagilim__yuzde">%{{ s.yuzde }} · {{ sayi(s.adet) }}</span>
              </div>
              <div class="dagilim__ray"><div class="dagilim__dolu" :style="{ width: `${s.yuzde}%` }" /></div>
            </li>
          </ul>
        </AppKart>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sayfa { padding: 26px 32px 32px; display: flex; flex-direction: column; gap: 22px; }
.kartlar { display: flex; gap: 16px; flex-wrap: wrap; }
.izgara { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }
.izgara__genis { grid-column: span 2; }
@media (max-width: 1100px) {
  .izgara { grid-template-columns: minmax(0, 1fr); }
  .izgara__genis { grid-column: span 1; }
}

.baglanti { font-size: 13px; font-weight: 600; }
.bos { margin: 0; font-size: 13px; color: var(--ink-3); }

.liste { list-style: none; margin: 0; padding: 0; }
.satir { display: flex; align-items: center; gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--line); }
.satir:last-child { border-bottom: none; }
.satir--dar { gap: 12px; padding: 11px 0; }
.satir__metin { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.satir__baslik { font-size: 14px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.satir__alt { font-size: 12.5px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.satir__kota { font-size: 12.5px; font-weight: 600; color: var(--ink-2); }
.satir__zaman { font-size: 11.5px; color: var(--ink-3); flex: none; }

.gun {
  width: 52px; flex: none; display: flex; flex-direction: column; align-items: center;
  padding: 7px 0; border-radius: 11px; background: var(--paper-2); border: 1px solid var(--line);
}
.gun__no { font-family: var(--font-display); font-size: 18px; font-weight: 700; line-height: 1; }
.gun__ay { font-size: 10.5px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.04em; }

.avatar {
  width: 32px; height: 32px; flex: none; border-radius: 50%;
  background: var(--konferans-tint); border: 1px solid var(--konferans-line); color: var(--konferans-deep);
  display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700;
}

.lejant { display: flex; gap: 14px; font-size: 12px; color: var(--ink-2); }
.lejant span { display: inline-flex; align-items: center; gap: 6px; }
.nokta { width: 9px; height: 9px; border-radius: 3px; display: inline-block; }
.nokta--konferans { background: var(--konferans); }
.nokta--sunum { background: var(--sunum); }
.nokta--hackathon { background: var(--hackathon); }

.grafik { display: flex; align-items: flex-end; gap: 10px; }
.grafik__sutun { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.grafik__cubuklar { display: flex; align-items: flex-end; gap: 4px; height: 118px; }
.grafik__cubuk { width: 11px; border-radius: 4px 4px 0 0; min-height: 2px; }
.grafik__cubuk--konferans { background: var(--konferans); }
.grafik__cubuk--sunum { background: var(--sunum); }
.grafik__cubuk--hackathon { background: var(--hackathon); }
.grafik__etiket { font-size: 11.5px; color: var(--ink-3); font-weight: 500; }

.dagilim { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
.dagilim__ust { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 500; }
.dagilim__yuzde { color: var(--ink-3); font-weight: 600; }
.dagilim__ray { height: 6px; border-radius: 999px; background: var(--paper-2); overflow: hidden; margin-top: 5px; }
.dagilim__dolu { height: 100%; background: var(--konferans); border-radius: 999px; }
</style>
