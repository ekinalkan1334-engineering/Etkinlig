<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppUstCubuk from '@/components/layout/AppUstCubuk.vue';
import AppKart from '@/components/ui/AppKart.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppRozet from '@/components/ui/AppRozet.vue';
import TurRozeti from '@/components/ui/TurRozeti.vue';
import DurumRozeti from '@/components/ui/DurumRozeti.vue';
import DurumMesaji from '@/components/ui/DurumMesaji.vue';
import { adayService, basvuruService } from '@/services';
import { saat, sinifEtiketi, tarih } from '@/utils/format.js';

const route = useRoute();
const router = useRouter();

const veri = ref(null);
const yukleniyor = ref(true);
const hata = ref(null);
const islemde = ref(false);

const DUZEY = {
  on_lisans: 'Ön lisans', lisans: 'Lisans', yuksek_lisans: 'Yüksek lisans', doktora: 'Doktora',
};

const profil = computed(() => veri.value?.profil ?? null);
const basHarfler = computed(() =>
  (profil.value?.adSoyad ?? '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR'),
);

/** Bu adayın hangi başvurusu üzerinden gelindiyse onun kararı öne çıkar. */
const odaklananBasvuru = computed(() => {
  const id = Number(route.query.basvuru);
  const liste = veri.value?.basvurular ?? [];
  return liste.find((b) => b.id === id) ?? liste[0] ?? null;
});

async function yukle() {
  yukleniyor.value = true;
  hata.value = null;
  try {
    const { data } = await adayService.bul(Number(route.params.id));
    veri.value = data;
  } catch (e) {
    hata.value = e;
  } finally {
    yukleniyor.value = false;
  }
}

async function karar(basvuruId, durum) {
  islemde.value = true;
  try {
    await basvuruService.durumDegistir(basvuruId, durum);
    await yukle();
  } catch (e) {
    window.alert(e.message);
  } finally {
    islemde.value = false;
  }
}

onMounted(yukle);
</script>

<template>
  <AppUstCubuk
    :baslik="profil?.adSoyad ?? 'Aday'"
    :alt-baslik="profil ? `${profil.universite ?? 'Üniversite belirtilmemiş'} · ${profil.bolum ?? 'Bölüm belirtilmemiş'}` : ''"
  >
    <template #aksiyon>
      <AppButton cesit="hayalet" simge="geri" @click="router.back()">Geri</AppButton>
      <template v-if="odaklananBasvuru">
        <AppButton
          v-if="odaklananBasvuru.durum !== 'onaylandi'"
          cesit="birincil" simge="onay" :pasif="islemde"
          @click="karar(odaklananBasvuru.id, 'onaylandi')"
        >Onayla</AppButton>
        <AppButton
          v-if="odaklananBasvuru.durum !== 'reddedildi'"
          cesit="tehlike" simge="capraz" :pasif="islemde"
          @click="karar(odaklananBasvuru.id, 'reddedildi')"
        >Reddet</AppButton>
      </template>
    </template>
  </AppUstCubuk>

  <div class="sayfa">
    <DurumMesaji :yukleniyor="yukleniyor" :hata="hata" />

    <div v-if="profil" class="izgara">
      <div class="izgara__yan">
        <AppKart>
          <div class="kimlik">
            <div class="kimlik__foto">
              <img v-if="profil.foto" :src="profil.foto" :alt="`${profil.adSoyad} fotoğrafı`" />
              <span v-else>{{ basHarfler }}</span>
            </div>
            <h2>{{ profil.adSoyad }}</h2>
            <p v-if="odaklananBasvuru" class="kimlik__durum">
              <DurumRozeti :durum="odaklananBasvuru.durum" kapsam="basvuru" />
            </p>
            <div v-if="veri.rozetler?.toplam" class="rozetler">
              <AppRozet v-for="(adet, tur) in veri.rozetler.turler" :key="tur" :ton="tur" yuvarlak>
                {{ adet }} {{ tur === 'konferans' ? 'konferans' : tur === 'sunum' ? 'sunum' : 'hackathon' }}
              </AppRozet>
            </div>
          </div>

          <dl class="bilgiler">
            <div><dt>E-posta</dt><dd><a :href="`mailto:${profil.eposta}`">{{ profil.eposta }}</a></dd></div>
            <div><dt>Telefon</dt><dd>{{ profil.telefon ?? '—' }}</dd></div>
            <div><dt>Üniversite</dt><dd>{{ profil.universite ?? '—' }}</dd></div>
            <div><dt>Bölüm</dt><dd>{{ profil.bolum ?? '—' }}</dd></div>
            <div><dt>Öğrenim düzeyi</dt><dd>{{ DUZEY[profil.ogrenimDuzeyi] ?? '—' }}</dd></div>
            <div><dt>Sınıf</dt><dd>{{ profil.sinif !== null ? sinifEtiketi(profil.sinif) : '—' }}</dd></div>
            <div><dt>Öğrenci no</dt><dd>{{ profil.ogrenciNo ?? '—' }}</dd></div>
            <div>
              <dt>Not ortalaması</dt>
              <dd><strong class="gano">{{ profil.gano !== null ? profil.gano.toFixed(2) : '—' }}</strong></dd>
            </div>
          </dl>

          <a v-if="veri.cvAdresi" class="cv" :href="veri.cvAdresi" target="_blank" rel="noopener">
            CV'yi aç · {{ profil.cv.ad }}
          </a>
          <p v-else class="cv cv--yok">Aday CV yüklememiş.</p>
        </AppKart>
      </div>

      <div class="izgara__ana">
        <AppKart baslik="Başvurular" govde-dolgusu="18px 6px 6px">
          <DurumMesaji :bos="veri.basvurular.length === 0" bos-baslik="Başvuru yok" bos-aciklama="" />
          <div v-if="veri.basvurular.length" class="tablo-sarmal">
            <table class="tablo">
              <thead>
                <tr><th>Etkinlik</th><th>Tür</th><th>Tarih</th><th>Başvuru</th><th>Durum</th><th class="sag">İşlem</th></tr>
              </thead>
              <tbody>
                <tr v-for="b in veri.basvurular" :key="b.id" :class="{ odak: b.id === odaklananBasvuru?.id }">
                  <td>
                    <RouterLink :to="{ name: 'etkinlik-detay', params: { id: b.etkinlik.id } }" class="baglanti">
                      {{ b.etkinlik.baslik }}
                    </RouterLink>
                    <span class="alt">{{ b.etkinlik.sirket }}</span>
                  </td>
                  <td><TurRozeti :tur="b.etkinlik.tur" /></td>
                  <td class="notr">{{ tarih(b.etkinlik.baslangic) }}</td>
                  <td class="notr">{{ tarih(b.basvuruTarihi) }} · {{ saat(b.basvuruTarihi) }}</td>
                  <td>
                    <DurumRozeti :durum="b.durum" kapsam="basvuru" />
                    <span v-if="b.katildi" class="katildi">Katıldı</span>
                  </td>
                  <td class="sag">
                    <div class="islemler">
                      <AppButton
                        v-if="b.durum !== 'onaylandi'" yalniz-simge simge="onay" title="Onayla"
                        :pasif="islemde" @click="karar(b.id, 'onaylandi')"
                      />
                      <AppButton
                        v-if="b.durum !== 'reddedildi'" yalniz-simge simge="capraz" cesit="tehlike" title="Reddet"
                        :pasif="islemde" @click="karar(b.id, 'reddedildi')"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppKart>

        <AppKart :baslik="`Yorumları (${veri.yorumlar.length})`">
          <p v-if="!veri.yorumlar.length" class="bos">Bu aday henüz yorum yazmamış.</p>
          <ul v-else class="yorumlar">
            <li v-for="y in veri.yorumlar" :key="y.id">
              <div class="yorumlar__ust">
                <RouterLink :to="{ name: 'etkinlik-detay', params: { id: y.etkinlik.id } }" class="baglanti">
                  {{ y.etkinlik.baslik }}
                </RouterLink>
                <span class="notr">{{ tarih(y.olusturuldu) }} · {{ saat(y.olusturuldu) }}</span>
              </div>
              <p class="yorumlar__metin">{{ y.metin }}</p>
            </li>
          </ul>
        </AppKart>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sayfa { padding: 26px 32px 32px; }
.izgara { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 18px; align-items: start; }
.izgara__ana { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
@media (max-width: 1040px) { .izgara { grid-template-columns: minmax(0, 1fr); } }

.kimlik { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 18px; }
.kimlik__foto {
  width: 108px; height: 108px; border-radius: 50%; overflow: hidden;
  background: var(--paper-2); border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 34px; font-weight: 700; color: var(--ink-3);
}
.kimlik__foto img { width: 100%; height: 100%; object-fit: cover; }
.kimlik h2 { font-size: 19px; font-weight: 700; text-align: center; }
.kimlik__durum { margin: 0; }
.rozetler { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.katildi { display: block; margin-top: 5px; font-size: 11.5px; font-weight: 600; color: var(--sunum-deep); }

.bilgiler { margin: 0; display: flex; flex-direction: column; }
.bilgiler div { display: flex; gap: 12px; padding: 9px 0; border-top: 1px solid var(--line); }
.bilgiler dt { flex: none; width: 122px; font-size: 12.5px; color: var(--ink-3); }
.bilgiler dd { margin: 0; font-size: 13.5px; font-weight: 500; overflow-wrap: anywhere; }
.gano { font-size: 16px; font-family: var(--font-display); }

.cv {
  display: block; margin-top: 16px; padding: 11px 14px; border-radius: var(--r-md);
  background: var(--sunum-tint); border: 1px solid var(--sunum-line); color: var(--sunum-deep);
  font-size: 13.5px; font-weight: 600; text-align: center; text-decoration: none;
}
.cv:hover { background: #cdf2e2; }
.cv--yok { background: var(--paper-2); border-color: var(--line); color: var(--ink-3); font-weight: 500; }

.tablo-sarmal { overflow-x: auto; }
.tablo { width: 100%; border-collapse: collapse; min-width: 760px; }
.tablo th {
  text-align: left; padding: 0 14px 11px; font-size: 11.5px; font-weight: 600;
  color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
}
.tablo td { padding: 14px; border-top: 1px solid var(--line); vertical-align: middle; }
.odak td { background: var(--konferans-tint); }
.sag { text-align: right; }
.notr { font-size: 13px; color: var(--ink-2); }
.alt { display: block; font-size: 12.5px; color: var(--ink-3); margin-top: 3px; }
.baglanti { font-size: 14px; font-weight: 600; }
.islemler { display: inline-flex; gap: 6px; }
.islemler :deep(.btn) { width: 32px; height: 32px; border-radius: var(--r-sm); }

.bos { margin: 0; font-size: 13px; color: var(--ink-3); }
.yorumlar { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.yorumlar li { padding: 13px 0; border-top: 1px solid var(--line); }
.yorumlar li:first-child { border-top: none; padding-top: 0; }
.yorumlar__ust { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 5px; flex-wrap: wrap; }
.yorumlar__metin { margin: 0; font-size: 14px; line-height: 1.6; color: var(--ink-2); white-space: pre-line; overflow-wrap: anywhere; }
</style>
