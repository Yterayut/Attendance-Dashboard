const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzGm7qmVm1f3rxxTENcvLSFcEjoPBji-omq3qXH6eRoVRERkPhQPpdX2zhzHLQS18LG/exec';

export const onRequestPost = async ({ request, waitUntil }: any) => {
  const body = await request.text();

  const forward = fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'content-type': request.headers.get('content-type') || 'application/json' },
    body,
    redirect: 'follow',
  }).catch(() => undefined);

  if (typeof waitUntil === 'function') {
    waitUntil(forward);
  }

  return new Response(JSON.stringify({ ok: true, accepted: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

export const onRequestGet = async () => {
  return new Response(JSON.stringify({ ok: true, service: 'line-webhook-proxy' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
