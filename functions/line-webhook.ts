const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzGm7qmVm1f3rxxTENcvLSFcEjoPBji-omq3qXH6eRoVRERkPhQPpdX2zhzHLQS18LG/exec';

export const onRequestPost = async ({ request, waitUntil }: any) => {
  const body = await request.text();

  const forward = forwardToGoogleAppsScript(body);

  if (typeof waitUntil === 'function') {
    waitUntil(forward);
  }

  return new Response(JSON.stringify({ ok: true, accepted: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

async function forwardToGoogleAppsScript(body: string) {
  const payload = base64UrlEncode(body);
  return fetch(`${GOOGLE_APPS_SCRIPT_URL}?route=line_webhook&payload=${payload}`, {
    method: 'GET',
    redirect: 'follow',
  }).catch(() => undefined);
}

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export const onRequestGet = async () => {
  return new Response(JSON.stringify({ ok: true, service: 'line-webhook-proxy' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
