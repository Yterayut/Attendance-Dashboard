const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzGm7qmVm1f3rxxTENcvLSFcEjoPBji-omq3qXH6eRoVRERkPhQPpdX2zhzHLQS18LG/exec';

export const onRequestPost = async ({ request, waitUntil }: any) => {
  const body = await request.text();
  const contentType = request.headers.get('content-type') || 'application/json';

  const forward = forwardToGoogleAppsScript(body, contentType);

  if (typeof waitUntil === 'function') {
    waitUntil(forward);
  }

  return new Response(JSON.stringify({ ok: true, accepted: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

async function forwardToGoogleAppsScript(body: string, contentType: string) {
  const first = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
    redirect: 'manual',
  });

  const location = first.headers.get('location');
  if (location && first.status >= 300 && first.status < 400) {
    return fetch(location, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body,
    });
  }

  return first;
}

export const onRequestGet = async () => {
  return new Response(JSON.stringify({ ok: true, service: 'line-webhook-proxy' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
