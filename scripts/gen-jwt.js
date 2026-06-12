const s = require('fs').readFileSync('/tmp/jwt_secret.txt', 'utf8').trim();
const c = require('crypto');
function b64(o) { return Buffer.from(JSON.stringify(o)).toString('base64url'); }
const h = b64({ alg: 'HS256', typ: 'JWT' });
const now = Math.floor(Date.now() / 1000);
const exp = now + 315360000;
function sign(p) { return h + '.' + p + '.' + c.createHmac('sha256', s).update(h + '.' + p).digest('base64url'); }
const anon = sign(b64({ role: 'anon', iss: 'supabase', iat: now, exp: exp }));
const svc = sign(b64({ role: 'service_role', iss: 'supabase', iat: now, exp: exp }));
require('fs').writeFileSync('/tmp/jwt_keys.txt', 'ANON=' + anon + '\nSVC=' + svc);
console.log('JWT keys written to /tmp/jwt_keys.txt');
