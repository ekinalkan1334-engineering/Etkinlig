const TEMEL = import.meta.env.VITE_API_URL ?? '/api';

export class ApiHatasi extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details ?? null;
  }
}

/** 401 gelince oturum store'u haberdar olsun diye tek kanal. */
let oturumDustuHandler = null;
export const oturumDustugundeCagir = (fn) => { oturumDustuHandler = fn; };

const sorguDizesi = (params) => {
  if (!params) return '';
  const arama = new URLSearchParams();
  for (const [anahtar, deger] of Object.entries(params)) {
    if (deger === undefined || deger === null || deger === '') continue;
    arama.set(anahtar, String(deger));
  }
  const s = arama.toString();
  return s ? `?${s}` : '';
};

/** Tüm istekler tek kapıdan — çerez taşıma, hata çevirisi ve JSON zarfı burada. */
async function istek(yol, { method = 'GET', body, params } = {}) {
  const basliklar = {};
  if (body) basliklar['Content-Type'] = 'application/json';

  // IIS+WebDAV gibi kurulumlar PUT/PATCH/DELETE'i sunucuya ulaştırmıyor;
  // bu metotlar POST olarak gidip gerçeğini başlıkta bildiriyor.
  let gercekMetot = method;
  if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    basliklar['X-HTTP-Method-Override'] = method;
    gercekMetot = 'POST';
  }

  const yanit = await fetch(`${TEMEL}${yol}${sorguDizesi(params)}`, {
    method: gercekMetot,
    credentials: 'include',
    headers: basliklar,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (yanit.status === 204) return null;

  const govde = await yanit.json().catch(() => null);
  if (!yanit.ok) {
    const hata = govde?.error ?? {};
    if (yanit.status === 401 && !yol.startsWith('/oturum')) oturumDustuHandler?.();
    throw new ApiHatasi(yanit.status, hata.code ?? `http_${yanit.status}`, hata.message ?? `Sunucu ${yanit.status} döndürdü`, hata.details);
  }
  return govde;
}

export const http = {
  get: (yol, params) => istek(yol, { params }),
  post: (yol, body) => istek(yol, { method: 'POST', body }),
  put: (yol, body) => istek(yol, { method: 'PUT', body }),
  patch: (yol, body) => istek(yol, { method: 'PATCH', body }),
  del: (yol) => istek(yol, { method: 'DELETE' }),
};
