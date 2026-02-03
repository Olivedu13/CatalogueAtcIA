import { RawProductItem, ProductModel, StoneShape, StoneType, User, ProductVariation } from '../types';

// --- ENV CONFIG ---
const API_BASE = import.meta.env.VITE_API_BASE as string | undefined;
const IMG_BASE = import.meta.env.VITE_IMG_BASE as string | undefined;
const THUMB_URL = import.meta.env.VITE_THUMB_URL as string | undefined;

// --- MINIMAL LOOKUP TABLES (fallbacks) ---
// Utilisés si le backend ne renvoie pas les libellés
const SHAPE_LOOKUP: Record<number, string> = {
  999: 'AUTRE',
  1005: 'ROND',
  1006: 'OVALE',
  1007: 'CARRE',
  1008: 'PRINCESSE',
  1016: 'POIRE',
  1024: 'TROIDA',
  1035: 'COUSSIN',
};
const TYPE_LOOKUP: Record<number, string> = {
  1003: 'DIAMANT',
  1004: 'RUBIS',
  1006: 'OXYDE',
  1009: 'EMERAUDE',
  1012: 'SAPHIR',
};

// --- HELPERS ---
const parseCsvIds = (csv?: string): number[] => {
  if (!csv) return [];
  return csv
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
    .map(v => Number(v))
    .filter(n => !Number.isNaN(n));
};

const tokenKey = 'catalogue_token';
const userKey = 'catalogue_user';

export const getToken = (): string | null => {
  try { return localStorage.getItem(tokenKey); } catch { return null; }
};
const setToken = (t: string) => { try { localStorage.setItem(tokenKey, t); } catch {} };
export const clearSession = () => { try { localStorage.removeItem(tokenKey); localStorage.removeItem(userKey);} catch {} };
export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(userKey);
    return raw ? JSON.parse(raw) as User : null;
  } catch {
    return null;
  }
};

const buildThumb = (filename: string, size = 500): string => {
  const clean = filename?.trim();
  if (!clean) return '';
  if (THUMB_URL) return `${THUMB_URL}?image=${encodeURIComponent(clean)}&size=${size}`;
  if (IMG_BASE) return `${IMG_BASE}/${encodeURIComponent(clean)}`;
  return clean; // fallback: raw name
};

// --- CRYPTO HELPERS ---
// Pure JavaScript MD5 implementation (RFC 1321)
const md5 = (text: string): string => {
  const rotateLeft = (n: number, s: number) => (n << s) | (n >>> (32 - s));
  
  const addUnsigned = (x: number, y: number) => {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  };
  
  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);
  
  const FF = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };
  
  const GG = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };
  
  const HH = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };
  
  const II = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };
  
  const convertToWordArray = (str: string) => {
    const lWordCount = ((str.length + 8) >> 6) + 1;
    const lWordArray = new Array(lWordCount * 16);
    for (let i = 0; i < lWordArray.length; i++) lWordArray[i] = 0;
    
    for (let i = 0; i < str.length; i++) {
      lWordArray[i >> 2] |= (str.charCodeAt(i) & 0xFF) << ((i % 4) * 8);
    }
    
    lWordArray[str.length >> 2] |= 0x80 << ((str.length % 4) * 8);
    lWordArray[lWordCount * 16 - 2] = str.length * 8;
    
    return lWordArray;
  };
  
  const wordToHex = (n: number) => {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      hex += ((n >> (i * 8 + 4)) & 0xF).toString(16) + ((n >> (i * 8)) & 0xF).toString(16);
    }
    return hex;
  };
  
  const x = convertToWordArray(text);
  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;
  
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    
    a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821);
    
    a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A);
    
    a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881D05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665);
    
    a = II(a, b, c, d, x[k + 0], 6, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], 15, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], 6, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], 10, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], 21, 0xEB86D391);
    
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
};

// --- API CALLS ---
export const loginUser = async (username: string, password: string): Promise<User> => {
  if (!API_BASE) {
    // Fallback mock si aucune API configurée
    const mock: User = {
      id: 'u123',
      username,
      companyName: 'Joaillerie ' + username.charAt(0).toUpperCase() + username.slice(1),
      logoUrl: `https://ui-avatars.com/api/?name=${username}&background=c18b52&color=fff&size=128&font-size=0.4`
    };
    setToken('mock-token');
    try { localStorage.setItem(userKey, JSON.stringify(mock)); } catch {}
    return mock;
  }

  // Hash password with MD5 before sending
  const hashedPassword = md5(password);

  const res = await fetch(`${API_BASE}/login.php?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: username, password: hashedPassword })
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  // D’après ton code, la réponse renvoie un tableau avec l’utilisateur
  const u = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!u) throw new Error('Utilisateur non trouvé');

  const logoFromApi = typeof u.logo === 'string' ? u.logo : undefined;
  const user: User = {
    id: String(u.id ?? u.userId ?? u.userLogin ?? username),
    username,
    companyName: u.companyName ?? u.Nom_agence ?? 'Joaillerie',
    logoUrl: logoFromApi || `https://ui-avatars.com/api/?name=${username}&background=c18b52&color=fff&size=128&font-size=0.4`,
    admin: u.admin !== undefined ? Number(u.admin) : 0,
    coef: u.coef !== undefined ? Number(u.coef) : 1,
    agenceId: u.agenceId ? String(u.agenceId) : undefined,
  };

  // Optionnel: créer un log et utiliser l’ID inséré comme token simple
  try {
    const logRes = await fetch(`${API_BASE}/login.php?action=saveLog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_user: user.id })
    });
    if (logRes.ok) {
      const logId = await logRes.json();
      setToken(String(logId));
    } else {
      setToken(`${user.id}-${Date.now()}`);
    }
  } catch {
    setToken(`${user.id}-${Date.now()}`);
  }
  try { localStorage.setItem(userKey, JSON.stringify(user)); } catch {}
  return user;
};

export const fetchCatalog = async (): Promise<{ products: ProductModel[]; shapes: StoneShape[]; types: StoneType[]; }> => {
  if (!API_BASE) {
    // Sans API: retourner vide pour éviter la confusion
    return { products: [], shapes: [], types: [] };
  }

  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) authHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/imageCatalogue.php`, { headers: authHeaders });
  if (!res.ok) throw new Error('Catalogue fetch failed');
  const responseData = await res.json();
  
  // Le backend retourne {products: [...], shapes: [...], types: [...]}
  const raw: RawProductItem[] = responseData.products || [];
  const backendShapes = responseData.shapes || [];
  const backendTypes = responseData.types || [];

  // Normalisation des images: utiliser thumbs quand possible
  const variations: ProductVariation[] = raw.map(item => {
    const thumb = buildThumb(item.img || item.img_cv || '', 700);
    const cover = buildThumb(item.img_cv || item.img || '', 700);
    // Backend retourne déjà des tableaux, pas des CSV
    const shapeIds = Array.isArray(item.formes) 
      ? item.formes.map(f => Number(f)).filter(n => !isNaN(n))
      : parseCsvIds(typeof item.formes === 'string' ? item.formes : String(item.formes));
    const typeIds = Array.isArray(item.types)
      ? item.types.map(t => Number(t)).filter(n => !isNaN(n))
      : (item.types ? parseCsvIds(String(item.types)) : (item.id_typ_pier ? [item.id_typ_pier] : []));
    return {
      ...item,
      img: thumb || item.img,
      img_cv: cover || item.img_cv,
      gallery: Array.isArray(item.gallery) ? item.gallery.map(g => buildThumb(g, 700) || g) : [],
      resolvedShape: shapeIds.length > 0 ? (SHAPE_LOOKUP[shapeIds[0]] ?? String(shapeIds[0])) : undefined,
      resolvedType: typeIds.length > 0 ? (TYPE_LOOKUP[typeIds[0]] ?? String(typeIds[0])) : undefined,
    };
  });

  // Agrégation par ref
  const grouped = new Map<string, ProductModel>();
  for (const v of variations) {
    if (!grouped.has(v.ref)) {
      grouped.set(v.ref, {
        ref: v.ref,
        category: v.description,
        line: v.prenom_ligne,
        thumbnail: v.img || v.img_cv,
        minPrice: v.prix,
        maxPrice: v.prix,
        variations: [],
        availableShapeIds: [],
        availableTypeIds: []
      });
    }
    const g = grouped.get(v.ref)!;
    g.variations.push(v);
    if (v.prix < g.minPrice) g.minPrice = v.prix;
    if (v.prix > g.maxPrice) g.maxPrice = v.prix;

    // formes: "1016,1005,..." OU simple id en string
    const shapeIds = Array.isArray(v.formes)
      ? v.formes.map(f => Number(f)).filter(n => !isNaN(n))
      : parseCsvIds(typeof v.formes === 'string' ? v.formes : String(v.formes));
    for (const sid of shapeIds) if (!g.availableShapeIds.includes(sid)) g.availableShapeIds.push(sid);

    // types: peut venir comme CSV (ex: "1003,1009") OU comme id_typ_pier sur chaque ligne
    const itemTypeIds = Array.isArray(v.types)
      ? v.types.map(t => Number(t)).filter(n => !isNaN(n))
      : (v.types ? parseCsvIds(String(v.types)) : (v.id_typ_pier ? [v.id_typ_pier] : []));
    for (const tid of itemTypeIds) if (!g.availableTypeIds.includes(tid)) g.availableTypeIds.push(tid);
  }

  // Utilise les formes et types du backend au lieu des lookups statiques
  const shapes: StoneShape[] = backendShapes.map((s: any) => ({
    id: Number(s.id),
    description: s.name || s.description || String(s.id),
    typ_dim: 0
  }));
  
  const types: StoneType[] = backendTypes.map((t: any) => ({
    id: Number(t.id),
    description: t.name || t.description || String(t.id)
  }));

  return { products: Array.from(grouped.values()), shapes, types };
};

// Log product detail view
export const logProductView = async (ref: string, userId: string | number | null) => {
  if (!API_BASE || !ref || !userId) return;
  try {
    await fetch(`${API_BASE}/login.php?action=logProduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, id_user: Number(userId) })
    });
  } catch (e) {
    console.warn('logProductView failed', e);
  }
};