export interface Env {
  ANALYTICS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("HalaMadrid");

  if (!targetUrl) {
    return new Response("https://cors.byheru-premium.workers.dev/?HalaMadrid=", { status: 400 });
  }

  const modifiedRequest = new Request(targetUrl, request);
  const response = await fetch(modifiedRequest);

  // Clone the response so we can modify the headers
  const modifiedResponse = new Response(response.body, response);

  // Set CORS headers
  modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
  modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  modifiedResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  modifiedResponse.headers.set("Access-Control-Allow-Credentials", "true");
  modifiedResponse.headers.set("Access-Control-Expose-Headers", "Content-Length, X-JSON");

  return modifiedResponse;
  }
  
    if (url.pathname === '/success') {
      return new Response(successPage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (request.method === 'POST' && url.pathname === '/login') {
      const formData = await request.formData();
      const username = formData.get('username');
      const password = formData.get('password');

      if (username === 'ByHeruVIPS' && password === 'HalaMadrid') {
        return Response.redirect(url.origin + '/success', 302);
      } else {
        return new Response(loginPage('Username atau Password salah!'), {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    }

    if (url.pathname === '/' || request.method === 'GET') {
      return new Response(loginPage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const reqHeaders = new Headers(request.headers);
    const response: {
      body: BodyInit | null;
      contentType: string | null;
      status: number;
      text: string;
      headers: Headers;
    } = {
      body: null,
      contentType: null,
      status: 200,
      text: "OK",
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          reqHeaders.get("Access-Control-Allow-Headers") ||
          "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With, Token, x-access-token",
        "Access-Control-Allow-Credentials": "true",
      }),
    };

    try {
      // Menghapus https:// jika diperlukan
      let proxyUrl = decodeURIComponent(url.pathname.slice(1));
      proxyUrl = fixUrl(proxyUrl);

      // Validasi URL
      if (!urlValidation(proxyUrl)) {
        throw new Error('Invalid URL');
      }

      const fetchRequest: {
        headers: Headers;
        method: string;
        body?: BodyInit;
      } = {
        method: request.method,
        headers: new Headers(),
      };

      const dropHeaders = ["content-length", "content-type", "host"];
      for (let [key, value] of reqHeaders.entries()) {
        if (!dropHeaders.includes(key)) {
          fetchRequest.headers.set(key, value);
        }
      }

      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const ct = (reqHeaders.get("content-type") || "").toLowerCase();
        if (ct.includes("application/json")) {
          fetchRequest.body = JSON.stringify(await request.json());
        } else if (ct.includes("application/text") || ct.includes("text/html")) {
          fetchRequest.body = await request.text();
        } else if (ct.includes("form")) {
          fetchRequest.body = await request.formData();
        } else {
          fetchRequest.body = await request.blob();
        }
      }

      const fetchResponse = await fetch(proxyUrl, fetchRequest);
      response.contentType = fetchResponse.headers.get("content-type");
      response.status = fetchResponse.status;
      response.text = fetchResponse.statusText;
      response.body = await fetchResponse.text();

      await increment(env);
    } catch (err) {
      if (err instanceof Error) {
        response.contentType = "application/json";
        response.body = JSON.stringify({
          code: -1,
          msg: err.stack || err.message || err,
        });
        response.status = 500;
      }
    }

    if (response.contentType && response.contentType !== "") {
      response.headers.set("content-type", response.contentType);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.text,
      headers: response.headers,
    });
  },
};

function fixUrl(url: string) {
  if (url.includes("://")) {
    return url;
  } else if (url.includes(":/")) {
    return url.replace(":/", "://");
  } else {
    return "http://" + url;
  }
}

function urlValidation(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

async function getHelp(env: Env, url: URL) {
  const totalRequestsCount = await totalRequests(env);
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CORS Proxy ByHeru🗿</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: 'Arial', sans-serif;
            background: radial-gradient(circle, #f0f0f0, #dcdcdc);
            color: #333;
        }
        .status-container {
            text-align: center;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
            padding: 40px;
            max-width: 420px;
            width: 100%;
            animation: fadeIn 1s ease-in-out;
        }
        h1 {
            font-size: 2.2em;
            margin: 0;
            color: #0088cc;
        }
        p {
            font-size: 1.2em;
            margin: 15px 0 25px;
            color: #666;
        }
        .link-container {
            margin-top: 20px;
        }
        .link-container a {
            display: inline-block;
            margin: 8px;
            padding: 14px 24px;
            text-decoration: none;
            color: #ffffff;
            background-color: #0088cc;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: bold;
            transition: background-color 0.3s, transform 0.2s;
        }
        .link-container a:hover {
            background-color: #007ab8;
            transform: scale(1.05);
        }
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>
<body>
    <div class="status-container">
        <h1>CORS Proxy ByHeru🗿</h1>
        <p>Total Requests Served: ${totalRequestsCount}</p>
        <div class="link-container">
            <a href="https://cors.byheru-premium.workers.dev/t.me/+6283803735374" target="_blank">Telegram🗿</a>
            <a href="https://cf-worker-ws-dev.byheru-premium.workers.dev/HalaMadrid" target="_blank">Trojan🗿</a>
            <a href="https://cors-proxy.byheru-premium.workers.dev/" target="_blank">Cors Proxy V2</a>
        </div>
    </div>
</body>
</html>`;
}

async function increment(env: Env) {
  if (!env.ANALYTICS) return;
  let count = parseInt((await env.ANALYTICS.get("total_requests")) || "0");
  await env.ANALYTICS.put("total_requests", (++count).toFixed());
}

async function totalRequests(env: Env) {
  if (!env.ANALYTICS) return 0;
  return parseInt(await env.ANALYTICS.get("total_requests") || "0");
}

function loginPage(errorMessage = '') {
  return `
<!DOCTYPE html>
<html lang="ID">
<head>
    <title>Cors Proxy Login🗿</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
        .container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f0f0;
        }
        .child {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
            padding: 40px;
            text-align: center;
        }
        .card-title {
            color: #333;
        }
        .input-group {
            margin-bottom: 15px;
        }
        .btn-login {
            width: 100%;
            padding: 10px;
            background-color: #0088cc;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
        .error-message {
            color: red;
            margin-bottom: 15px;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="child">
            <form class="form-group" action="/login" method="POST">
                <h2 class="card-title">Cors Proxy ByHeru🗿</h2>
                ${errorMessage ? `<div class="error-message">${errorMessage}</div>` : ''}
                <div class="input-group">
                    <input class="card-input" type="text" placeholder="Nama pengguna" name="username" required/>
                    <input class="card-input" type="password" placeholder="Kata sandi" name="password" required/>
                </div>
                <button type="submit" class="btn-login">Masuk</button>
            </form>
        </div>
    </div>
</body>
</html>
  `;
}

function successPage() {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CORS Proxy ByHeru🗿</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: 'Arial', sans-serif;
            background: radial-gradient(circle, #f0f0f0, #dcdcdc);
            color: #333;
        }
        .status-container {
            text-align: center;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
            padding: 40px;
            max-width: 420px;
            width: 100%;
            animation: fadeIn 1s ease-in-out;
        }
        h1 {
            font-size: 2.2em;
            margin: 0;
            color: #0088cc;
        }
        p {
            font-size: 1.2em;
            margin: 15px 0 25px;
            color: #666;
        }
        .link-container {
            margin-top: 20px;
        }
        .link-container a {
            display: inline-block;
            margin: 8px;
            padding: 14px 24px;
            text-decoration: none;
            color: #ffffff;
            background-color: #0088cc;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: bold;
            transition: background-color 0.3s, transform 0.2s;
        }
        .link-container a:hover {
            background-color: #007ab8;
            transform: scale(1.05);
        }
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>
<body>
    <div class="status-container">
        <h1>CORS Proxy ByHeru🗿</h1>
        <p>Mau Ngapain Bang?</p>
        <div class="link-container">
            <a href="https://cors.byheru-premium.workers.dev/t.me/+6283803735374" target="_blank">Telegram🗿</a>
            <a href="https://cf-worker-ws-dev.byheru-premium.workers.dev/HalaMadrid" target="_blank">Trojan🗿</a>
            <a href="https://cors-proxy.byheru-premium.workers.dev/" target="_blank">Cors Proxy V2</a>
        </div>
    </div>
</body>
</html>
  `;
}
