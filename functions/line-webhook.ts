const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzGm7qmVm1f3rxxTENcvLSFcEjoPBji-omq3qXH6eRoVRERkPhQPpdX2zhzHLQS18LG/exec';

export const onRequestPost = async ({ request }: any) => {
  const body = await request.text();

  const upstream = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'content-type': request.headers.get('content-type') || 'application/json',
    },
    body,
    redirect: 'follow',
  });

  const text = await upstream.text();

  return new Response(text || JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json',
    },
  });
};

export const onRequestGet = async () => {
  return new Response(JSON.stringify({ ok: true, service: 'line-webhook-proxy' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
