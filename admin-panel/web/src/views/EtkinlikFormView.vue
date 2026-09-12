<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppUstCubuk from '@/components/layout/AppUstCubuk.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppKart from '@/components/ui/AppKart.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppAnahtar from '@/components/ui/AppAnahtar.vue';
import FormAlani from '@/components/ui/FormAlani.vue';
import SecimCipi from '@/components/ui/SecimCipi.vue';
import { useEtkinlikForm } from '@/viewmodels/useEtkinlikForm.js';
import { useTanimlarStore } from '@/stores/tanimlar.js';
import { etkinlikService } from '@/services';
import { sinifEtiketi } from '@/utils/format.js';

const route = useRoute();
const router = useRouter();
const tanimlar = useTanimlarStore();
const vm = useEtkinlikForm();

const duzenleme = computed(() => !!route.params.id);

onMounted(async () => {
  await tanimlar.yukle();
  if (duzenleme.value) {
    const { data } = await etkinlikService.bul(Number(route.params.id));
    vm.doldur(data);
  }
});

const TUR_SIMGESI = { konferans: 'kisiler', sunum: 'mezuniyet', hackathon: 'trend' };

async function kaydet(durum) {
  const sonuc = await vm.kaydet(durum);
  if (sonuc) router.push({ name: 'etkinlik-detay', params: { id: sonuc.id } });
}
</script>

<template>
  <AppUstCubuk
    :baslik="duzenleme ? 'Etkinliği düzenle' : 'Yeni etkinlik oluştur'"
    alt-baslik="Etkinlik bilgilerini ve ön katılım şartlarını tanımlayın"
  >
    <template #aksiyon>
      <AppButton cesit="hayalet" :pasif="vm.kaydediyor.value" @click="kaydet('taslak')">Taslak kaydet</AppButton>
      <AppButton cesit="birincil" simge="onay" :pasif="vm.kaydediyor.value || !vm.gecerli.value" @click="kaydet('yayinda')">
        {{ vm.kaydediyor.value ? 'Kaydediliyor…' : 'Yayınla' }}
      </AppButton>
    </template>
  </AppUstCubuk>

  <form class="sayfa" @submit.prevent="kaydet()">
    <p v-if="vm.hatalar.value._genel" class="genel-hata">{{ vm.hatalar.value._genel }}</p>

    <ol class="adimlar">
      <li v-for="(a, i) in vm.ADIMLAR" :key="a.anahtar" class="adim">
        <button type="button" class="adim__dugme" :class="`adim__dugme--${vm.adimDurumu(i)}`" @click="vm.adim.value = i">
          <span class="adim__no">
            <AppIcon v-if="vm.adimDurumu(i) === 'done' && vm.adimGecerli(i)" ad="onay" :boyut="13" :kalinlik="3" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="adim__etiket">{{ a.etiket }}</span>
        </button>
        <span v-if="i < vm.ADIMLAR.length - 1" class="adim__cizgi" />
      </li>
    </ol>

    <div class="izgara">
      <div class="izgara__ana">
        <AppKart baslik="Temel bilgiler">
          <div class="alanlar">
            <FormAlani etiket="Etkinlik adı" zorunlu :hata="vm.hatalar.value.baslik">
              <template #default="{ hatali }">
                <input v-model="vm.model.baslik" :aria-invalid="hatali" placeholder="Örn. Yapay Zeka ve Endüstri 4.0 Konferansı" />
              </template>
            </FormAlani>

            <div class="ikili">
              <FormAlani etiket="Şirket / kurum" zorunlu :hata="vm.hatalar.value.sirketId">
                <template #default="{ hatali }">
                  <select v-model="vm.model.sirketId" :aria-invalid="hatali">
                    <option value="">Şirket seçin</option>
                    <option v-for="s in tanimlar.sirketler" :key="s.id" :value="s.id">{{ s.ad }}</option>
                  </select>
                </template>
              </FormAlani>
              <FormAlani etiket="İletişim e-postası" :hata="vm.hatalar.value.iletisimEpostasi">
                <template #default="{ hatali }">
                  <input v-model="vm.model.iletisimEpostasi" type="email" :aria-invalid="hatali" placeholder="etkinlik@sirket.com" />
                </template>
              </FormAlani>
            </div>

            <FormAlani
              etiket="Etkinlik açıklaması"
              :yardim="`${vm.model.aciklama.length} / 2000 karakter`"
              :hata="vm.hatalar.value.aciklama"
            >
              <textarea v-model="vm.model.aciklama" maxlength="2000" placeholder="Programı, konuşmacıları ve katılımcıların ne kazanacağını yazın." />
            </FormAlani>
          </div>
        </AppKart>

        <AppKart baslik="Ön katılım şartları">
          <template #aksiyon>
            <span class="ipucu">Şartları sağlamayan öğrenciler başvuru formunu göremez</span>
          </template>
          <div class="alanlar">
            <FormAlani etiket="Öğrenim düzeyi" zorunlu>
              <div class="cipler">
                <SecimCipi
                  v-for="d in tanimlar.ogrenimDuzeyleri" :key="d.deger"
                  :secili="vm.model.sartOgrenimDuzeyi === d.deger"
                  @sec="vm.model.sartOgrenimDuzeyi = d.deger"
                >{{ d.etiket }}</SecimCipi>
              </div>
            </FormAlani>

            <FormAlani etiket="Sınıf" zorunlu yardim="Birden fazla sınıf seçilebilir" :hata="vm.hatalar.value.sartSiniflar">
              <div class="cipler">
                <SecimCipi
                  v-for="s in tanimlar.siniflar" :key="s.deger"
                  :secili="vm.model.sartSiniflar.includes(s.deger)"
                  @sec="vm.cokluSec(vm.model.sartSiniflar, s.deger)"
                >{{ s.etiket }}</SecimCipi>
              </div>
            </FormAlani>

            <FormAlani etiket="Bölümler" yardim="Boş bırakılırsa tüm bölümlere açık olur">
              <div class="cipler">
                <SecimCipi
                  v-for="b in tanimlar.bolumler" :key="b.id"
                  :secili="vm.model.sartBolumIdleri.includes(b.id)"
                  @sec="vm.cokluSec(vm.model.sartBolumIdleri, b.id)"
                >{{ b.ad }}</SecimCipi>
              </div>
            </FormAlani>

            <div class="ikili">
              <FormAlani etiket="Asgari not ortalaması" :hata="vm.hatalar.value.sartMinOrtalama">
                <template #default="{ hatali }">
                  <input v-model="vm.model.sartMinOrtalama" type="number" step="0.01" min="0" max="4" :aria-invalid="hatali" placeholder="Örn. 2.00" />
                </template>
              </FormAlani>
              <FormAlani etiket="Kontenjan" zorunlu :hata="vm.hatalar.value.kontenjan">
                <template #default="{ hatali }">
                  <input v-model.number="vm.model.kontenjan" type="number" min="0" :aria-invalid="hatali" />
                </template>
              </FormAlani>
            </div>

            <label class="onay-kutusu">
              <input v-model="vm.model.sartBelgeZorunlu" type="checkbox" />
              <span>Öğrenci belgesi zorunlu (başvuruda dosya istenir, onay manuel yapılır)</span>
            </label>
          </div>
        </AppKart>

        <AppKart baslik="Zaman ve yer">
          <div class="alanlar">
            <div class="uclu">
              <FormAlani etiket="Şehir" zorunlu :hata="vm.hatalar.value.sehirId">
                <template #default="{ hatali }">
                  <select v-model="vm.model.sehirId" :aria-invalid="hatali">
                    <option value="">Şehir seçin</option>
                    <option v-for="s in tanimlar.sehirler" :key="s.id" :value="s.id">{{ s.ad }}</option>
                  </select>
                </template>
              </FormAlani>
              <FormAlani etiket="Başlangıç" zorunlu :hata="vm.hatalar.value.baslangic">
                <template #default="{ hatali }">
                  <input v-model="vm.model.baslangic" type="datetime-local" :aria-invalid="hatali" />
                </template>
              </FormAlani>
              <FormAlani etiket="Bitiş" :hata="vm.hatalar.value.bitis">
                <template #default="{ hatali }">
                  <input v-model="vm.model.bitis" type="datetime-local" :aria-invalid="hatali" />
                </template>
              </FormAlani>
            </div>
            <div class="uclu">
              <FormAlani etiket="İlçe">
                <input v-model="vm.model.ilce" placeholder="Örn. Çankaya" />
              </FormAlani>
              <FormAlani etiket="Son başvuru tarihi" :hata="vm.hatalar.value.sonBasvuru">
                <template #default="{ hatali }">
                  <input v-model="vm.model.sonBasvuru" type="date" :aria-invalid="hatali" />
                </template>
              </FormAlani>
              <FormAlani etiket="Adres / mekân">
                <input v-model="vm.model.adres" placeholder="Etkinliğin yapılacağı yer" />
              </FormAlani>
            </div>
          </div>
        </AppKart>
      </div>

      <div class="izgara__yan">
        <AppKart baslik="Organizasyon türü">
          <div class="tur-kartlari">
            <button
              v-for="t in tanimlar.turler" :key="t.deger" type="button"
              class="tur" :class="[`tur--${t.deger}`, { 'tur--secili': vm.model.tur === t.deger }]"
              @click="vm.model.tur = t.deger"
            >
              <div class="tur__ust">
                <span class="tur__simge"><AppIcon :ad="TUR_SIMGESI[t.deger]" /></span>
                <span class="tur__isaret" :class="{ 'tur__isaret--secili': vm.model.tur === t.deger }">
                  <AppIcon v-if="vm.model.tur === t.deger" ad="onay" :boyut="12" :kalinlik="3" />
                </span>
              </div>
              <span class="tur__ad">{{ t.etiket }}</span>
              <span class="tur__aciklama">{{ t.aciklama }}</span>
            </button>
          </div>
        </AppKart>

        <AppKart baslik="Yayın ayarları">
          <div class="ayarlar">
            <AppAnahtar v-model="vm.model.basvuruyaAcik" etiket="Başvurulara açık" />
            <AppAnahtar v-model="vm.model.otomatikOnay" etiket="Otomatik onay" />
            <AppAnahtar v-model="vm.model.yedekListe" etiket="Yedek liste tut" />
            <AppAnahtar v-model="vm.model.katilimBelgesi" etiket="Katılım belgesi ver" />
          </div>
        </AppKart>

        <AppKart baslik="Özet">
          <ul class="ozet">
            <li><span>Tür</span><strong>{{ tanimlar.turler.find((t) => t.deger === vm.model.tur)?.etiket ?? '—' }}</strong></li>
            <li><span>Sınıflar</span><strong>{{ vm.model.sartSiniflar.length ? vm.model.sartSiniflar.map(sinifEtiketi).join(', ') : '—' }}</strong></li>
            <li><span>Bölüm</span><strong>{{ vm.model.sartBolumIdleri.length || 'Tümü' }}</strong></li>
            <li><span>Kontenjan</span><strong>{{ vm.model.kontenjan }}</strong></li>
          </ul>
        </AppKart>
      </div>
    </div>
  </form>
</template>

<style scoped>
.sayfa { padding: 26px 32px 32px; display: flex; flex-direction: column; gap: 18px; }

.genel-hata {
  margin: 0; padding: 12px 16px; border-radius: var(--r-md);
  background: var(--konferans-tint); border: 1px solid var(--konferans-line);
  color: var(--konferans-deep); font-size: 13px; font-weight: 500;
}

.adimlar {
  list-style: none; margin: 0; padding: 14px 20px;
  display: flex; align-items: center; gap: 16px;
  border-radius: 14px; background: var(--surface); border: 1px solid var(--line);
}
.adim { display: contents; }
.adim__dugme { display: flex; align-items: center; gap: 9px; border: none; background: none; cursor: pointer; padding: 0; }
.adim__no {
  width: 26px; height: 26px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  background: var(--surface); border: 1px solid var(--line); color: var(--ink-3);
}
.adim__etiket { font-size: 13px; font-weight: 500; color: var(--ink-2); }
.adim__dugme--now .adim__no { background: var(--ink); border-color: var(--ink); color: #fff; }
.adim__dugme--now .adim__etiket { font-weight: 600; color: var(--ink); }
.adim__dugme--done .adim__no { background: var(--sunum); border-color: var(--sunum); color: #fff; }
.adim__cizgi { flex: 1; height: 1px; background: var(--line); }

.izgara { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: 18px; align-items: start; }
.izgara__ana, .izgara__yan { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
@media (max-width: 1100px) { .izgara { grid-template-columns: minmax(0, 1fr); } }

.alanlar { display: flex; flex-direction: column; gap: 16px; }
.ikili { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.uclu { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 760px) { .ikili, .uclu { grid-template-columns: minmax(0, 1fr); } }

.cipler { display: flex; flex-wrap: wrap; gap: 8px; }
.ipucu { font-size: 12px; color: var(--ink-3); }

.onay-kutusu { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--ink-2); cursor: pointer; }
.onay-kutusu input { width: 16px; height: 16px; margin-top: 1px; accent-color: var(--konferans); }

.tur-kartlari { display: flex; flex-direction: column; gap: 10px; }
.tur {
  text-align: left; padding: 14px; border-radius: 13px;
  border: 1.5px solid var(--line); background: var(--surface);
  cursor: pointer; display: flex; flex-direction: column; gap: 8px;
}
.tur__ust { display: flex; align-items: center; justify-content: space-between; }
.tur__simge {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  background: var(--paper-2); border: 1px solid var(--line); color: var(--ink-2);
}
.tur__isaret {
  width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--line);
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.tur__ad { font-family: var(--font-display); font-size: 14px; font-weight: 700; letter-spacing: -0.01em; }
.tur__aciklama { font-size: 12px; color: var(--ink-2); line-height: 1.4; }

.tur--konferans.tur--secili { border-color: var(--konferans-deep); background: var(--konferans-tint); }
.tur--konferans.tur--secili .tur__simge { background: var(--surface); border-color: var(--konferans-line); color: var(--konferans-deep); }
.tur--konferans.tur--secili .tur__isaret--secili { background: var(--konferans-deep); border-color: var(--konferans-deep); }
.tur--sunum.tur--secili { border-color: var(--sunum-deep); background: var(--sunum-tint); }
.tur--sunum.tur--secili .tur__simge { background: var(--surface); border-color: var(--sunum-line); color: var(--sunum-deep); }
.tur--sunum.tur--secili .tur__isaret--secili { background: var(--sunum-deep); border-color: var(--sunum-deep); }
.tur--hackathon.tur--secili { border-color: var(--hackathon-deep); background: var(--hackathon-tint); }
.tur--hackathon.tur--secili .tur__simge { background: var(--surface); border-color: var(--hackathon-line); color: var(--hackathon-deep); }
.tur--hackathon.tur--secili .tur__isaret--secili { background: var(--hackathon-deep); border-color: var(--hackathon-deep); }

.ayarlar { display: flex; flex-direction: column; gap: 14px; }

.ozet { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.ozet li { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; }
.ozet span { color: var(--ink-2); }
.ozet strong { font-weight: 600; text-align: right; }
</style>
