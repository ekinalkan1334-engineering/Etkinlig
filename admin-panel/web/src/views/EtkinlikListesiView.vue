<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppUstCubuk from '@/components/layout/AppUstCubuk.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppKart from '@/components/ui/AppKart.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import SecimCipi from '@/components/ui/SecimCipi.vue';
import TurRozeti from '@/components/ui/TurRozeti.vue';
import DurumRozeti from '@/components/ui/DurumRozeti.vue';
import DolulukCubugu from '@/components/ui/DolulukCubugu.vue';
import SayfaGezgini from '@/components/ui/SayfaGezgini.vue';
import DurumMesaji from '@/components/ui/DurumMesaji.vue';
import { useEtkinlikListesi } from '@/viewmodels/useEtkinlikListesi.js';
import { useTanimlarStore } from '@/stores/tanimlar.js';
import { useOturumStore } from '@/stores/oturum.js';
import { etkinlikService } from '@/services';
import { saat, tarih } from '@/utils/format.js';

const router = useRouter();
const tanimlar = useTanimlarStore();
const oturum = useOturumStore();
const vm = useEtkinlikListesi();

onMounted(() => vm.yukle());

async function sil(e) {
  if (!window.confirm(`"${e.baslik}" silinsin mi? Bu işlem geri alınamaz.`)) return;
  await vm.sil(e.id);
}
</script>

<template>
  <AppUstCubuk baslik="Etkinlikler" :alt-baslik="`Toplam ${vm.meta.value.toplam} kayıt`">
    <template #aksiyon>
      <AppButton cesit="birincil" simge="arti" @click="router.push({ name: 'etkinlik-yeni' })">
        Yeni etkinlik
      </AppButton>
    </template>
  </AppUstCubuk>

  <div class="sayfa">
    <div class="filtreler">
      <label class="arama">
        <AppIcon ad="ara" />
        <input v-model="vm.filtre.arama" type="search" placeholder="Etkinlik veya şirket ara…" />
      </label>

      <span class="ayirac" />

      <SecimCipi ton="ink" :secili="vm.filtre.tur === ''" @sec="vm.filtre.tur = ''">Tümü</SecimCipi>
      <SecimCipi
        v-for="t in tanimlar.turler" :key="t.deger" ton="ink"
        :secili="vm.filtre.tur === t.deger" @sec="vm.turSec(t.deger)"
      >{{ t.etiket }}</SecimCipi>

      <div class="filtreler__sag">
        <select v-if="oturum.admin" v-model="vm.filtre.sirketId" class="secim" aria-label="Şirket filtresi">
          <option value="">Şirket: Tümü</option>
          <option v-for="s in tanimlar.sirketler" :key="s.id" :value="s.id">{{ s.ad }}</option>
        </select>
        <select v-model="vm.filtre.sehirId" class="secim" aria-label="Şehir filtresi">
          <option value="">Şehir: Tümü</option>
          <option v-for="s in tanimlar.sehirler" :key="s.id" :value="s.id">{{ s.ad }}</option>
        </select>
        <select v-model="vm.filtre.durum" class="secim" aria-label="Durum filtresi">
          <option value="">Durum: Tümü</option>
          <option v-for="d in tanimlar.durumlar" :key="d.deger" :value="d.deger">{{ d.etiket }}</option>
        </select>
        <select v-model="vm.filtre.siralama" class="secim" aria-label="Sıralama">
          <option value="baslangic">Tarihe göre</option>
          <option value="baslik">İsme göre</option>
          <option value="olusturuldu">Eklenme sırasına göre</option>
          <option value="basvuru_sayisi">Başvuru sayısına göre</option>
        </select>
      </div>
    </div>

    <AppKart govde-dolgusu="18px 6px 6px">
      <DurumMesaji
        :yukleniyor="vm.yukleniyor.value" :hata="vm.hata.value" :bos="vm.bos.value"
        bos-baslik="Etkinlik bulunamadı" bos-aciklama="Arama veya filtreleri değiştirip tekrar deneyin."
      />
      <div v-if="!vm.yukleniyor.value && !vm.hata.value && !vm.bos.value" class="tablo-sarmal">
        <table class="tablo">
          <thead>
            <tr>
              <th>Etkinlik</th><th>Tür</th><th>Şehir</th><th>Tarih / Saat</th>
              <th>Kontenjan</th><th>Durum</th><th class="sag">İşlem</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in vm.kayitlar.value" :key="e.id">
              <td>
                <RouterLink :to="{ name: 'etkinlik-detay', params: { id: e.id } }" class="hucre__baslik">
                  {{ e.baslik }}
                </RouterLink>
                <span class="hucre__alt">{{ e.sirket.ad }} · {{ e.kod }}</span>
              </td>
              <td><TurRozeti :tur="e.tur" /></td>
              <td class="notr">{{ e.sehir.ad }}</td>
              <td>
                <span class="hucre__baslik hucre__baslik--sade">{{ tarih(e.baslangic) }}</span>
                <span class="hucre__alt">{{ saat(e.baslangic) }}</span>
              </td>
              <td><DolulukCubugu :deger="e.onayliSayisi" :toplam="e.kontenjan" /></td>
              <td><DurumRozeti :durum="e.durum" /></td>
              <td class="sag">
                <div class="islemler">
                  <a :href="etkinlikService.raporAdresi(e.id)" title="Katılımcıları Excel indir">
                    <AppButton yalniz-simge simge="disaAktar" />
                  </a>
                  <AppButton
                    yalniz-simge simge="duzenle" title="Düzenle"
                    @click="router.push({ name: 'etkinlik-duzenle', params: { id: e.id } })"
                  />
                  <AppButton yalniz-simge simge="cop" cesit="tehlike" title="Sil" @click="sil(e)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppKart>

    <SayfaGezgini
      :sayfa="vm.meta.value.sayfa" :sayfa-sayisi="vm.meta.value.sayfaSayisi"
      :toplam="vm.meta.value.toplam" :limit="vm.meta.value.limit"
      @degisti="vm.sayfaSec"
    />
  </div>
</template>

<style scoped>
.sayfa { padding: 26px 32px 32px; display: flex; flex-direction: column; gap: 18px; }

.filtreler { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.arama {
  display: flex; align-items: center; gap: 9px; height: 34px; padding: 0 12px;
  border-radius: 9px; border: 1px solid var(--line); background: var(--surface);
  width: 280px; color: var(--ink-3);
}
.arama input { border: none; outline: none; background: none; font-size: 13px; width: 100%; color: var(--ink); }
.ayirac { width: 1px; height: 22px; background: var(--line); }
.filtreler__sag { margin-left: auto; display: flex; gap: 9px; flex-wrap: wrap; }
.secim {
  height: 34px; border-radius: 9px; border: 1px solid var(--line);
  background: var(--surface); padding: 0 10px; font-size: 13px; color: var(--ink-2); cursor: pointer;
}

.tablo-sarmal { overflow-x: auto; }
.tablo { width: 100%; border-collapse: collapse; min-width: 900px; }
.tablo th {
  text-align: left; padding: 0 14px 11px; font-size: 11.5px; font-weight: 600;
  color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
}
.tablo td { padding: 14px; border-top: 1px solid var(--line); vertical-align: middle; }
.sag { text-align: right; }
.notr { font-size: 13.5px; color: var(--ink-2); }
.hucre__baslik { display: block; font-size: 14px; font-weight: 600; color: var(--ink); }
.hucre__baslik--sade { font-weight: 500; font-size: 13.5px; }
.hucre__alt { display: block; font-size: 12.5px; color: var(--ink-3); margin-top: 3px; }
.islemler { display: inline-flex; gap: 6px; }
.islemler :deep(.btn) { width: 32px; height: 32px; border-radius: var(--r-sm); }
</style>
