import { createRouter, createWebHistory } from 'vue-router';
import { useOturumStore } from '@/stores/oturum.js';

const rotalar = [
  { path: '/giris', name: 'giris', component: () => import('@/views/GirisView.vue'), meta: { baslik: 'Giriş', acik: true, kabuksuz: true } },
  { path: '/', name: 'panel', component: () => import('@/views/PanelView.vue'), meta: { baslik: 'Panel' } },
  { path: '/etkinlikler', name: 'etkinlikler', component: () => import('@/views/EtkinlikListesiView.vue'), meta: { baslik: 'Etkinlikler' } },
  { path: '/etkinlikler/yeni', name: 'etkinlik-yeni', component: () => import('@/views/EtkinlikFormView.vue'), meta: { baslik: 'Yeni etkinlik' } },
  { path: '/etkinlikler/:id(\\d+)', name: 'etkinlik-detay', component: () => import('@/views/EtkinlikDetayView.vue'), meta: { baslik: 'Etkinlik detay' } },
  { path: '/etkinlikler/:id(\\d+)/duzenle', name: 'etkinlik-duzenle', component: () => import('@/views/EtkinlikFormView.vue'), meta: { baslik: 'Etkinliği düzenle' } },
  { path: '/basvurular', name: 'basvurular', component: () => import('@/views/BasvurularView.vue'), meta: { baslik: 'Başvurular' } },
  { path: '/adaylar/:id(\\d+)', name: 'aday', component: () => import('@/views/AdayView.vue'), meta: { baslik: 'Aday' } },
  { path: '/kullanicilar', name: 'kullanicilar', component: () => import('@/views/KullanicilarView.vue'), meta: { baslik: 'Kullanıcılar', rol: 'admin' } },
  { path: '/:hepsi(.*)', redirect: { name: 'panel' } },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: rotalar,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const oturum = useOturumStore();
  await oturum.baslat();

  if (to.meta.acik) {
    return oturum.girisYapildi ? { name: 'panel' } : true;
  }
  if (!oturum.girisYapildi) {
    return { name: 'giris', query: to.fullPath === '/' ? {} : { devam: to.fullPath } };
  }
  if (to.meta.rol && oturum.kullanici.rol !== to.meta.rol) {
    return { name: 'panel' };
  }
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.baslik ? `${to.meta.baslik} · etkinlig` : 'etkinlig';
});
