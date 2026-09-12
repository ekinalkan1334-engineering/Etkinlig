import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vitrin canlıda /etkinlig/api (PHP) adresine konuşur.
// Lokalde aynı yolu PHP'nin dahili sunucusuna yönlendiriyoruz:
//   cd admin-panel/api && php -S localhost:8000
// Farklı bir adres kullanacaksan .env dosyasına VITE_API_URL yaz.
const PHP = process.env.PHP_API ?? 'http://localhost:8000'

export default defineConfig({
  // Site alt dizinde (/etkinlig/) yayınlanıyor: varlıklar göreli yolla istensin.
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/etkinlig/api': { target: PHP, changeOrigin: true, rewrite: (p) => p.replace(/^\/etkinlig\/api/, '') },
      '/yuklemeler': { target: PHP, changeOrigin: true },
    },
  },
})
