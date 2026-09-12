/** API genelinde tek hata tipi ve tek cevap zarfı. */
export class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
  static badRequest(message, details) { return new ApiError(400, 'gecersiz_istek', message, details); }
  static notFound(message = 'Kayıt bulunamadı') { return new ApiError(404, 'bulunamadi', message); }
  static conflict(message, details) { return new ApiError(409, 'cakisma', message, details); }
}

/** async controller'larda try/catch tekrarını kaldırır. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const ok = (res, data, meta) =>
  res.json(meta ? { data, meta } : { data });

export const created = (res, data) => res.status(201).json({ data });

/** zod şemasıyla req parçasını doğrular ve temizlenmiş veriyi döndürür. */
export const parse = (schema, value) => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw ApiError.badRequest('Doğrulama hatası', result.error.issues.map((i) => ({
      alan: i.path.join('.'),
      mesaj: i.message,
    })));
  }
  return result.data;
};

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'bulunamadi', message: `Uç bulunamadı: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: { code: 'cakisma', message: 'Bu kayıt zaten mevcut.' } });
  }
  if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: { code: 'gecersiz_istek', message: 'İlişkili kayıt bulunamadı (şirket / şehir / bölüm).' } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'sunucu_hatasi', message: 'Beklenmeyen bir hata oluştu.' } });
}
