/**
 * Cloudflare Pages Function - PhET Simulation Proxy
 * 
 * Proxies requests from /phet-proxy/* to https://phet.colorado.edu/sims/html/*
 * This bypasses the GFW blocking for Chinese users.
 */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const phetPath = url.pathname.replace('/phet-proxy', '/sims/html');
  const phetUrl = 'https://phet.colorado.edu' + phetPath + url.search;

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!['host', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 
          'cf-visitor', 'x-forwarded-proto', 'x-real-ip'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  try {
    const response = await fetch(phetUrl, {
      method: request.method,
      headers: headers,
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    const newHeaders = new Headers(response.headers);
    newHeaders.set('access-control-allow-origin', '*');

    if (contentType.includes('text/html')) {
      newHeaders.set('cache-control', 'public, max-age=3600');
      let body = await response.text();
      body = body.replace(/https:\/\/phet\.colorado\.edu\/sims\/html\//g, '/phet-proxy/');
      body = body.replace(/\/\/phet\.colorado\.edu\/sims\/html\//g, '/phet-proxy/');
      body = body.replace(/(["'\(])\/sims\/html\//g, '$1/phet-proxy/');
      
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } else if (contentType.includes('javascript') || contentType.includes('css')) {
      newHeaders.set('cache-control', 'public, max-age=86400');
      let body = await response.text();
      body = body.replace(/https:\/\/phet\.colorado\.edu\/sims\/html\//g, '/phet-proxy/');
      body = body.replace(/\/\/phet\.colorado\.edu\/sims\/html\//g, '/phet-proxy/');
      body = body.replace(/(["'\(])\/sims\/html\//g, '$1/phet-proxy/');
      
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } else {
      newHeaders.set('cache-control', 'public, max-age=31536000, immutable');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
  } catch (err) {
    return new Response('PhET proxy error: ' + err.message, { status: 502 });
  }
}
