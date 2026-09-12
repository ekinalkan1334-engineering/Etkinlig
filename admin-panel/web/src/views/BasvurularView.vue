<script setup>
import { onMounted, reactive, ref } from 'vue';
import AppUstCubuk from '@/components/layout/AppUstCubuk.vue';
import AppKart from '@/components/ui/AppKart.vue';
import AppButton from '@/components/ui/AppButton.vue';
import DurumRozeti from '@/components/ui/DurumRozeti.vue';
import DurumMesaji from '@/components/ui/DurumMesaji.vue';
import { basvuruService } from '@/services';
import { useTanimlarStore } from '@/stores/tanimlar.js';
import { useOturumStore } from '@/stores/oturum.js';
import { saat, sinifEtiketi, tarih } from '@/utils/format.js';

const tanimlar = useTanimlarStore();
const oturum = useOturumStore();
const filtre = reactive({ durum: 'beklemede', sinif: '', sirketId: '' });
const kayitlar = ref([]);
const yukleniyor = ref(false);
const hata = ref(null);

async function yukle() {
  yukleniyor.value = true;
  hata.value = null;
  try {
    const { data } = await basvuruService.listele({
      durum: filtre.durum || undefined,
      sinif: filtre.sinif === '' ? undefined : filtre.sinif,
      sirketId: filtre.sirketId || undefined,
      limit: 100,
    });
    kayitlar.value = data;
  } catch (e) {
    hata.value = e;
  } finally {
    yukleniyor.value = false;
  }
}

async function karar(id, durum) {
  await basvuruService.durumDegistir(id, durum);
  await yukle();
}

onMounted(yukle);
</script>

<template>
  <AppUstCubuk
    baslik="Başvurular"
    :alt-baslik="oturum.admin
      ? 'Tüm şirketlerin etkinliklerine gelen öğrenci başvuruları'
      : `${oturum.sirketAdi} etkinliklerine gelen öğrenci başvuruları`"
  />

  <div class="sayfa">
    <div class="filtreler">
      <select v-if="oturum.admin" v-model="filtre.sirketId" class="secim" @change="yukle">
        <option value="">Şirket: Tümü</option>
        <option v-for="s in tanimlar.sirketler" :key="s.id" :value="s.id">{{ s.ad }}</option>
      </select>
      <select v-model="filtre.durum" class="secim" @change="yukle">
        <option value="">Durum: Tümü</option>
        <option value="beklemede">Beklemede</option>
        <option value="onaylandi">Onaylandı</option>
        <option value="reddedildi">Reddedildi</option>
        <option value="yedek">Yedek</option>
      </select>
      <select v-model="filtre.sinif" class="secim" @change="yukle">
        <option value="">Sınıf: Tümü</option>
        <option v-for="s in tanimlar.siniflar" :key="s.deger" :value="s.deger">{{ s.etiket }}</option>
      </select>
    </div>

    <AppKart govde-dolgusu="18px 6px 6px">
      <DurumMesaji
        :yukleniyor="yukleniyor" :hata="hata" :bos="!yukleniyor && !hata && kayitlar.length === 0"
        bos-baslik="Başvuru yok" bos-aciklama="Seçili filtrelerle eşleşen başvuru bulunmuyor."
      />
      <div v-if="!yukleniyor && !hata && kayitlar.length" class="tablo-sarmal">
        <table class="tablo">
          <thead>
            <tr>
              <th>Öğrenci</th><th>Bölüm / Sınıf</th><th>Etkinlik</th>
              <th v-if="oturum.admin">Şirket</th>
              <th>Tarih</th><th>Durum</th><th class="sag">İşlem</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in kayitlar" :key="b.id">
              <td>
                <span class="kalin">{{ b.ogrenci.adSoyad }}</span>
                <span class="alt">{{ b.ogrenci.eposta ?? "—" }}</span>
              </td>
              <td>
                <span class="notr">{{ b.ogrenci.bolum ?? '—' }} · {{ sinifEtiketi(b.ogrenci.sinif) }}</span>
                <span v-if="b.ogrenci.universite" class="alt">{{ b.ogrenci.universite }}</span>
              </td>
              <td class="notr">{{ b.etkinlik.baslik }}</td>
              <td v-if="oturum.admin" class="notr">{{ b.sirket?.ad ?? '—' }}</td>
              <td class="notr">{{ tarih(b.basvuruTarihi) }} · {{ saat(b.basvuruTarihi) }}</td>
              <td><DurumRozeti :durum="b.durum" kapsam="basvuru" /></td>
              <td class="sag">
                <div class="islemler">
                  <AppButton v-if="b.durum !== 'onaylandi'" yalniz-simge simge="onay" title="Onayla" @click="karar(b.id, 'onaylandi')" />
                  <AppButton v-if="b.durum !== 'reddedildi'" yalniz-simge simge="capraz" cesit="tehlike" title="Reddet" @click="karar(b.id, 'reddedildi')" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppKart>
  </div>
</template>

<style scoped>
.sayfa { padding: 26px 32px 32px; display: flex; flex-direction: column; gap: 18px; }
.filtreler { display: flex; gap: 9px; flex-wrap: wrap; }
.secim {
  height: 34px; border-radius: 9px; border: 1px solid var(--line);
  background: var(--surface); padding: 0 10px; font-size: 13px; color: var(--ink-2); cursor: pointer;
}
.tablo-sarmal { overflow-x: auto; }
.tablo { width: 100%; border-collapse: collapse; min-width: 820px; }
.tablo th {
  text-align: left; padding: 0 14px 11px; font-size: 11.5px; font-weight: 600;
  color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
}
.tablo td { padding: 14px; border-top: 1px solid var(--line); }
.sag { text-align: right; }
.kalin { display: block; font-size: 13.5px; font-weight: 600; }
.alt { display: block; font-size: 12.5px; color: var(--ink-3); margin-top: 2px; }
.notr { font-size: 13px; color: var(--ink-2); }
.islemler { display: inline-flex; gap: 6px; }
.islemler :deep(.btn) { width: 32px; height: 32px; border-radius: var(--r-sm); }
</style>
