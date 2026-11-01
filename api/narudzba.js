/*
 * Narudžba iz webshopa: provjerava podatke i šalje SMS vlasniku preko Android telefona (TextBee).
 * Postavke na Vercelu: TEXTBEE_API_KEY je obavezan, a ORDER_SMS_TO i TEXTBEE_DEVICE_ID su po želji.
 * Bez ključa GET javlja da SMS nije spreman, pa webshop koristi WhatsApp.
 */
globalThis.window = globalThis.window || {};
require('../js/config.js');

const { products, whatsapp, deliveryHours } = globalThis.window.FARMA;

const SEND_URL = 'https://api.textbee.dev/api/v1/gateway/send-sms';
const SEND_TIMEOUT = 8000;
const LIMIT_COUNT = 5;
const LIMIT_WINDOW = 10 * 60 * 1000;

const WEEKDAYS = ['ned', 'pon', 'uto', 'sri', 'cet', 'pet', 'sub'];
const LETTERS = { č: 'c', ć: 'c', š: 's', đ: 'dj', ž: 'z', Č: 'C', Ć: 'C', Š: 'S', Đ: 'Dj', Ž: 'Z' };

const pad2 = (n) => String(n).padStart(2, '0');
const field = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// Naša slova prebacuju SMS u format sa samo 70 znakova po poruci, pa bi narudžba koštala više poruka.
const plain = (text) => text.replace(/[čćšđžČĆŠĐŽ]/g, (c) => LETTERS[c]).replace(/[^\n -~]/g, '');

const isHour = (n) => Number.isInteger(n) && n >= deliveryHours.from && n <= deliveryHours.to;

function isDeliveryDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return false;
  return iso >= new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Sarajevo' });
}

// Tekst se slaže ovdje, a ne u pregledniku, da niko ne može poslati proizvoljan SMS preko stranice.
function buildSms(body) {
  const items = body.items && typeof body.items === 'object' ? body.items : {};
  const lines = products.filter((p) => Number.isInteger(items[p.id]) && items[p.id] >= 1 && items[p.id] <= p.max);

  const ime = field(body.ime, 100);
  const telefon = field(body.telefon, 30);
  const adresa = field(body.adresa, 200);
  const naselje = field(body.naselje, 80);
  const napomena = field(body.napomena, 200);
  const datum = field(body.datum, 10);
  const { vrijemeOd: from, vrijemeDo: to } = body;

  const valid = lines.length > 0
    && ime.length >= 2
    && /^[+0-9 ()\-/]+$/.test(telefon) && telefon.replace(/\D/g, '').length >= 6
    && adresa.length >= 5
    && isDeliveryDate(datum)
    && isHour(from) && isHour(to) && to > from;
  if (!valid) return null;

  const total = lines.reduce((sum, p) => sum + p.price * items[p.id], 0);
  const eggs = lines.reduce((sum, p) => sum + p.eggs * items[p.id], 0);
  const [y, m, d] = datum.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];

  const out = ['NARUDZBA'];
  lines.forEach((p) => out.push(`${p.name} x${items[p.id]} = ${p.price * items[p.id]} KM`));
  out.push(`Ukupno: ${total} KM (${eggs} jaja)`);
  out.push(ime, telefon, [adresa, naselje, 'Travnik'].filter(Boolean).join(', '));
  out.push(`Dostava: ${weekday} ${pad2(d)}.${pad2(m)}. ${pad2(from)}-${pad2(to)}h`);
  if (napomena) out.push(`Napomena: ${napomena}`);
  return plain(out.join('\n'));
}

// Ograničenje važi po instanci funkcije, pa je osnovna zaštita, a ne tačan brojač.
const recent = new Map();

function tooMany(ip) {
  const now = Date.now();
  const times = (recent.get(ip) || []).filter((t) => now - t < LIMIT_WINDOW);
  if (times.length >= LIMIT_COUNT) return true;
  times.push(now);
  recent.set(ip, times);
  if (recent.size > 500) recent.delete(recent.keys().next().value);
  return false;
}

async function sendSms(message) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT);
  const deviceId = process.env.TEXTBEE_DEVICE_ID;
  try {
    const response = await fetch(SEND_URL, {
      method: 'POST',
      headers: { 'x-api-key': process.env.TEXTBEE_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: [process.env.ORDER_SMS_TO || `+${whatsapp}`],
        message,
        ...(deviceId ? { deviceId } : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) console.error('TextBee odgovor', response.status);
    return response.ok;
  } catch (error) {
    console.error('TextBee nedostupan', error.name);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return null; }
}

function isSameSite(req) {
  const { origin, host } = req.headers;
  if (!origin) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

module.exports = async (req, res) => {
  const reply = (status, data) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(data));
  };

  const ready = Boolean(process.env.TEXTBEE_API_KEY);
  if (req.method === 'GET') return reply(200, { sms: ready });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return reply(405, { error: 'method' });
  }
  if (!ready) return reply(503, { error: 'not_configured' });
  if (!isSameSite(req)) return reply(403, { error: 'origin' });

  const body = readBody(req);
  // Polje "provjera" je skriveno od kupaca, pa ga popune samo botovi.
  if (!body || field(body.provjera, 20)) return reply(400, { error: 'invalid' });

  const message = buildSms(body);
  if (!message) return reply(400, { error: 'invalid' });

  const ip = field(req.headers['x-forwarded-for'], 200).split(',')[0] || 'nepoznato';
  if (tooMany(ip)) return reply(429, { error: 'too_many' });

  return (await sendSms(message)) ? reply(200, { ok: true }) : reply(502, { error: 'send_failed' });
};
