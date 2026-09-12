<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppUstCubuk from '@/components/layout/AppUstCubuk.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppKart from '@/components/ui/AppKart.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppRozet from '@/components/ui/AppRozet.vue';
import TurRozeti from '@/components/ui/TurRozeti.vue';
import DurumRozeti from '@/components/ui/DurumRozeti.vue';
import StatKart from '@/components/ui/StatKart.vue';
import DurumMesaji from '@/components/ui/DurumMesaji.vue';
import { useEtkinlikDetay } from '@/viewmodels/useEtkinlikDetay.js';
import { useTanimlarStore } from '@/stores/tanimlar.js';
import { etkinlikService } from '@/services';
import { saat, sinifEtiketi, tarih, tarihUzun } from '@/utils/format.js';

const route = useRoute();
const router = useRouter();
const tanimlar = useTanimlarStore();
const vm = useEtkinlikDetay(Number(route.params.id));
const raporAdresi = etkinlikService.raporAdresi(Number(route.params.id));

onMounted(() => vm.yukle());

const basHarfler = (ad) => ad.split(' ').map((p) => p[0]).join('').slice(0, 2);
</script>

<template>
  <AppUstCubuk
    :baslik="vm.etkinlik.value?.baslik ?? 'Etkinlik'"
    :alt-baslik="vm.etkinlik.value ? `${vm.etkinlik.value.sirket.ad} · ${vm.etkinlik.value.kod}` : ''"
  >
    <template #aksiyon>
      <AppButton cesit="hayalet" simge="geri" @click="router.push({ name: 'etkinlikler' })">Listeye dön</AppButton>
      <a :href="raporAdresi" class="rapor-baglantisi">
        <AppButton simge="disaAktar">Katılımcıları Excel indir</AppButton>
      </a>
      <AppButton simge="duzenle" @click="router.push({ name: 'etkinlik-duzenle', params: { id: route.params.id } })">
        Düzenle
      </AppButton>
      <AppButton
        v-if="vm.etkinlik.value?.durum === 'taslak'" cesit="birincil" simge="onay"
        @click="vm.durumDegistir('yayinda')"
      >Yayınla</AppButton>
    </template>
  </AppUstCubuk>

  <div class="sayfa">
    <DurumMesaji :yukleniyor="vm.yukleniyor.value" :hata="vm.hata.value" />

    <template v-if="vm.etkinlik.value">
      <div class="ust-satir">
        <TurRozeti :tur="vm.etkinlik.value.tur" />
        <DurumRozeti :durum="vm.etkinlik.value.durum" />
        <AppRozet v-if="vm.etkinlik.value.sonBasvuru">
          Son başvuru: {{ tarih(vm.etkinlik.value.sonBasvuru) }}
        </AppRozet>
        <span class="ust-satir__zaman">Son güncelleme: {{ tarih(vm.etkinlik.value.guncellendi) }}</span>
      </div>

      <div class="izgara">
        <div class="izgara__ana">
          <div class="kartlar">
            <StatKart etiket="Başvuru" :deger="vm.sayaclar.value.basvuru" ton="hackathon" simge="gelen" />
            <StatKart etiket="Onaylı" :deger="vm.sayaclar.value.onayli" :alt-bilgi="`%${vm.sayaclar.value.oran} oran`" ton="sunum" simge="onay" />
            <StatKart etiket="Boş kontenjan" :deger="vm.sayaclar.value.bos" :alt-bilgi="`${vm.etkinlik.value.kontenjan} kapasite`" ton="uyari" simge="kisiler" />
          </div>

          <AppKart :govde-dolgusu="vm.etkinlik.value.kapakGorseli ? '0' : '20px'">
            <img
              v-if="vm.etkinlik.value.kapakGorseli"
              :src="vm.etkinlik.value.kapakGorseli" alt="Etkinlik kapak görseli" class="kapak"
            />
            <div :class="{ kapakli: vm.etkinlik.value.kapakGorseli }">
              <h2 class="bolum-basligi">Açıklama</h2>
              <p class="aciklama">{{ vm.etkinlik.value.aciklama || 'Açıklama girilmemiş.' }}</p>
            </div>
          </AppKart>

          <AppKart baslik="Başvurular" govde-dolgusu="18px 6px 6px">
            <template #aksiyon>
              <div class="basvuru-filtre">
                <select v-model="vm.basvuruFiltresi.durum" class="secim" @change="vm.basvurulariYukle()">
                  <option value="">Durum: Tümü</option>
                  <option value="beklemede">Beklemede</option>
                  <option value="onaylandi">Onaylandı</option>
                  <option value="reddedildi">Reddedildi</option>
                  <option value="yedek">Yedek</option>
                </select>
                <select v-model="vm.basvuruFiltresi.sinif" class="secim" @change="vm.basvurulariYukle()">
                  <option value="">Sınıf: Tümü</option>
                  <option v-for="s in tanimlar.siniflar" :key="s.deger" :value="s.deger">{{ s.etiket }}</option>
                </select>
              </div>
            </template>

            <DurumMesaji
              :yukleniyor="vm.basvurularYukleniyor.value"
              :bos="!vm.basvurularYukleniyor.value && vm.basvurular.value.length === 0"
              bos-baslik="Başvuru yok"
              bos-aciklama="Bu filtrelerle eşleşen başvuru bulunmuyor."
            />
            <div v-if="!vm.basvurularYukleniyor.value && vm.basvurular.value.length" class="tablo-sarmal">
              <table class="tablo">
                <thead>
                  <tr><th>Öğrenci</th><th>Bölüm</th><th>Sınıf</th><th>Başvuru</th><th>Durum</th><th class="sag">İşlem</th></tr>
                </thead>
                <tbody>
                  <tr v-for="b in vm.basvurular.value" :key="b.id">
                    <td>
                      <div class="ogrenci">
                        <span class="avatar">{{ basHarfler(b.ogrenci.adSoyad) }}</span>
                        <span class="ogrenci__ad">{{ b.ogrenci.adSoyad }}</span>
                      </div>
                    </td>
                    <td class="notr">{{ b.ogrenci.bolum ?? '—' }}</td>
                    <td class="notr">{{ sinifEtiketi(b.ogrenci.sinif) }}</td>
                    <td class="notr">{{ tarih(b.basvuruTarihi) }} · {{ saat(b.basvuruTarihi) }}</td>
                    <td><DurumRozeti :durum="b.durum" kapsam="basvuru" /></td>
                    <td class="sag">
                      <div class="islemler">
                        <AppButton
                          v-if="b.durum !== 'onaylandi'" yalniz-simge simge="onay" title="Onayla"
                          @click="vm.basvuruKarari(b.id, 'onaylandi')"
                        />
                        <AppButton
                          v-if="b.durum !== 'reddedildi'" yalniz-simge simge="capraz" cesit="tehlike" title="Reddet"
                          @click="vm.basvuruKarari(b.id, 'reddedildi')"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </AppKart>
        </div>

        <div class="izgara__yan">
          <AppKart baslik="Etkinlik künyesi" govde-dolgusu="20px 20px 6px">
            <ul class="kunye">
              <li>
                <AppIcon ad="takvim" />
                <div><span>Tarih</span><strong>{{ tarihUzun(vm.etkinlik.value.baslangic) }}</strong></div>
              </li>
              <li>
                <AppIcon ad="saat" />
                <div>
                  <span>Saat</span>
                  <strong>{{ saat(vm.etkinlik.value.baslangic) }}{{ vm.etkinlik.value.bitis ? ` – ${saat(vm.etkinlik.value.bitis)}` : '' }}</strong>
                </div>
              </li>
              <li>
                <AppIcon ad="konum" />
                <div>
                  <span>Yer</span>
                  <strong>{{ vm.etkinlik.value.adres || '—' }}<br>{{ vm.etkinlik.value.ilce ? `${vm.etkinlik.value.ilce} / ` : '' }}{{ vm.etkinlik.value.sehir.ad }}</strong>
                </div>
              </li>
              <li>
                <AppIcon ad="bina" />
                <div><span>Düzenleyen</span><strong>{{ vm.etkinlik.value.sirket.ad }}</strong></div>
              </li>
            </ul>
          </AppKart>

          <AppKart baslik="Ön katılım şartları">
            <div class="sartlar">
              <div class="sart">
                <span class="sart__etiket">Öğrenim düzeyi</span>
                <div class="sart__degerler">
                  <AppRozet ton="hackathon" yuvarlak>
                    {{ tanimlar.ogrenimDuzeyleri.find((d) => d.deger === vm.etkinlik.value.sartlar.ogrenimDuzeyi)?.etiket ?? 'Tümü' }}
                  </AppRozet>
                </div>
              </div>
              <div class="sart">
                <span class="sart__etiket">Sınıf</span>
                <div class="sart__degerler">
                  <AppRozet v-for="s in vm.etkinlik.value.sartlar.siniflar" :key="s" ton="hackathon" yuvarlak>
                    {{ sinifEtiketi(s) }}
                  </AppRozet>
                  <span v-if="!vm.etkinlik.value.sartlar.siniflar.length" class="notr">Tümü</span>
                </div>
              </div>
              <div class="sart">
                <span class="sart__etiket">Bölümler</span>
                <div class="sart__degerler">
                  <AppRozet v-for="b in vm.etkinlik.value.sartlar.bolumler" :key="b.id">{{ b.ad }}</AppRozet>
                  <span v-if="!vm.etkinlik.value.sartlar.bolumler.length" class="notr">Tüm bölümlere açık</span>
                </div>
              </div>
              <div class="sart-satir">
                <span>Asgari ortalama</span>
                <strong>{{ vm.etkinlik.value.sartlar.minOrtalama?.toFixed(2) ?? '—' }}</strong>
              </div>
              <div class="sart-satir">
                <span>Öğrenci belgesi</span>
                <strong>{{ vm.etkinlik.value.sartlar.belgeZorunlu ? 'Zorunlu' : 'İstenmiyor' }}</strong>
              </div>
            </div>
          </AppKart>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sayfa { padding: 26px 32px 32px; display: flex; flex-direction: column; gap: 18px; }

.rapor-baglantisi { display: inline-flex; }
.ust-satir { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ust-satir__zaman { margin-left: auto; font-size: 12.5px; color: var(--ink-3); }

.izgara { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: 18px; align-items: start; }
.izgara__ana, .izgara__yan { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
@media (max-width: 1100px) { .izgara { grid-template-columns: minmax(0, 1fr); } }

.kartlar { display: flex; gap: 16px; flex-wrap: wrap; }
.kapak { display: block; width: 100%; aspect-ratio: 1200 / 500; object-fit: cover; border-radius: var(--r-lg) var(--r-lg) 0 0; }
.kapakli { padding: 20px; }
.bolum-basligi { font-size: 16px; font-weight: 700; letter-spacing: -0.015em; margin-bottom: 14px; }
.aciklama { margin: 0; font-size: 14px; line-height: 1.7; color: var(--ink-2); }

.basvuru-filtre { display: flex; gap: 9px; }
.secim {
  height: 34px; border-radius: 9px; border: 1px solid var(--line);
  background: var(--surface); padding: 0 10px; font-size: 13px; color: var(--ink-2); cursor: pointer;
}

.tablo-sarmal { overflow-x: auto; }
.tablo { width: 100%; border-collapse: collapse; min-width: 720px; }
.tablo th {
  text-align: left; padding: 0 14px 11px; font-size: 11.5px; font-weight: 600;
  color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
}
.tablo td { padding: 14px; border-top: 1px solid var(--line); }
.sag { text-align: right; }
.notr { font-size: 13px; color: var(--ink-2); }
.ogrenci { display: flex; align-items: center; gap: 11px; }
.ogrenci__ad { font-size: 13.5px; font-weight: 600; }
.avatar {
  width: 32px; height: 32px; flex: none; border-radius: 50%;
  background: var(--paper-2); border: 1px solid var(--line); color: var(--ink-2);
  display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700;
}
.islemler { display: inline-flex; gap: 6px; }
.islemler :deep(.btn) { width: 32px; height: 32px; border-radius: var(--r-sm); }

.kunye { list-style: none; margin: 0; padding: 0; }
.kunye li { display: flex; align-items: flex-start; gap: 11px; padding: 12px 0; border-bottom: 1px solid var(--line); color: var(--ink-3); }
.kunye li:last-child { border-bottom: none; }
.kunye div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.kunye span { font-size: 11.5px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; }
.kunye strong { font-size: 13.5px; font-weight: 500; color: var(--ink); line-height: 1.45; }

.sartlar { display: flex; flex-direction: column; gap: 14px; }
.sart { display: flex; flex-direction: column; gap: 7px; }
.sart__etiket { font-size: 11.5px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; }
.sart__degerler { display: flex; flex-wrap: wrap; gap: 7px; }
.sart-satir { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--ink-2); padding-top: 12px; border-top: 1px solid var(--line); }
.sart-satir strong { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.sart-satir + .sart-satir { border-top: none; padding-top: 0; }
</style>
