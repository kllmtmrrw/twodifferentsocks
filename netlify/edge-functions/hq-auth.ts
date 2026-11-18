// Schützt /hq mit einem Passwort. Läuft serverseitig bei Netlify (Edge Function),
// das Passwort steht NUR in den Netlify-Umgebungsvariablen, nie im Repository.
//   HQ_PASSWORD  – das Passwort für den Login
//   HQ_SECRET    – langer Zufallswert zum Signieren des Login-Cookies
// Fehlt eins davon, bleibt das HQ zu (503).

declare const Netlify: { env: { get(name: string): string | undefined } };

const COOKIE = 'hq_session';
const DAYS = 30;
const enc = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function same(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

function readCookie(req: Request): string | null {
  const raw = req.headers.get('cookie') ?? '';
  const hit = raw.split(';').map((c) => c.trim()).find((c) => c.startsWith(COOKIE + '='));
  return hit ? decodeURIComponent(hit.slice(COOKIE.length + 1)) : null;
}

async function valid(token: string | null, secret: string): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return same(sig, await hmac(secret, 'hq:' + exp));
}

const head = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow',
};

function loginPage(error = false): Response {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>HQ · Login</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f6f2;color:#0a0a0a;font:500 16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:16px}
form{width:100%;max-width:360px;background:#fff;border:1px solid #e5e2da;border-radius:20px;padding:28px;display:grid;gap:14px}
img{width:150px;height:auto}h1{margin:4px 0 0;font-size:28px;letter-spacing:-.02em}p{margin:0;color:#555}
input{width:100%;font:inherit;padding:12px 14px;border:1.5px solid #cfcac0;border-radius:12px}input:focus{outline:2px solid #0a0a0a;outline-offset:1px}
button{font:inherit;font-weight:700;padding:12px;border:0;border-radius:12px;background:#0a0a0a;color:#fff;cursor:pointer}
.err{color:#b3261e;font-weight:600}
</style></head><body>
<form method="post" action="/hq/login">
<img src="/assets/img/logo_ink.png" alt="Two Different Socks">
<h1>HQ</h1><p>Nur für den Chef.</p>
${error ? '<p class="err">Passwort stimmt nicht.</p>' : ''}
<input type="password" name="password" placeholder="Passwort" autocomplete="current-password" required autofocus>
<button type="submit">Anmelden</button>
</form></body></html>`;
  return new Response(html, { status: 401, headers: head });
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const password = Netlify.env.get('HQ_PASSWORD');
  const secret = Netlify.env.get('HQ_SECRET');
  if (!password || !secret) {
    return new Response('HQ ist noch nicht eingerichtet (HQ_PASSWORD / HQ_SECRET fehlen).', { status: 503, headers: head });
  }

  if (url.pathname === '/hq/logout') {
    return new Response(null, {
      status: 303,
      headers: { location: '/hq/', 'set-cookie': `${COOKIE}=; Path=/hq; Max-Age=0; HttpOnly; Secure; SameSite=Strict` },
    });
  }

  if (url.pathname === '/hq/login' && req.method === 'POST') {
    const form = await req.formData();
    const given = String(form.get('password') ?? '');
    if (!same(given, password)) {
      await new Promise((r) => setTimeout(r, 800)); // bremst Rateversuche
      return loginPage(true);
    }
    const exp = String(Date.now() + DAYS * 86400000);
    const token = `${exp}.${await hmac(secret, 'hq:' + exp)}`;
    return new Response(null, {
      status: 303,
      headers: {
        location: '/hq/',
        'set-cookie': `${COOKIE}=${encodeURIComponent(token)}; Path=/hq; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Strict`,
      },
    });
  }

  if (await valid(readCookie(req), secret)) return; // angemeldet: Seite normal ausliefern
  return loginPage();
};

export const config = { path: ['/hq', '/hq/*'] };
