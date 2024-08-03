export interface Env {
  ANALYTICS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
        "X-Content-Type-Options": "nosniff", // Mencegah browser dari "sniffing" jenis MIME
        "X-Frame-Options": "DENY", // Mencegah penyematan konten dalam frame
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains", // Mengaktifkan HSTS untuk keamanan HTTPS
        "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self';", // Kebijakan keamanan konten
        "X-XSS-Protection": "1; mode=block", // Melindungi dari serangan XSS
        "Referrer-Policy": "no-referrer-when-downgrade", // Menentukan bagaimana informasi referer dikirim
        "Feature-Policy": "geolocation 'self'; microphone 'none'", // Kebijakan fitur untuk mengontrol akses ke fitur browser
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", // Mengontrol caching oleh browser
        "Pragma": "no-cache", // Mengontrol caching oleh server
        "Expires": "0", // Mengatur waktu kadaluarsa konten
        "Content-Type": "application/json", // Jenis konten default
        "Access-Control-Max-Age": "86400" // Durasi maksimal cache preflight CORS request dalam detik
      }),
    };

    try {
      // Menghapus https://
      let url = request.url.substring(8);
      // Decode URL request asli
      url = decodeURIComponent(url.substring(url.indexOf("/") + 1));

      if (
        request.method === "OPTIONS" ||
        url.length < 3 ||
        url.indexOf(".") === -1 ||
        url === "favicon.ico" ||
        url === "robots.txt"
      ) {
        const invalid = !(request.method === "OPTIONS" || url.length === 0);
        response.body = await getHelp(env, new URL(request.url));
        response.contentType = "text/html";
        response.status = invalid ? 400 : 200;
      } else {
        url = fixUrl(url);

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

        const fetchResponse = await fetch(url, fetchRequest);
        response.contentType = fetchResponse.headers.get("content-type");
        response.status = fetchResponse.status;
        response.text = fetchResponse.statusText;
        response.body = fetchResponse.body;

        await increment(env);
      }
    } catch (err) {
      if (err instanceof Error) {
        response.contentType = "application/json";
        response.body = JSON.stringify({
          code: -1,
          msg: JSON.stringify(err.stack) || err,
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

async function getHelp(env: Env, url: URL) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proxy CORS ByHeru🗿</title>
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
        <h1>Proxy CORS ByHeru🗿</h1>
        <p>Gunakan VPN atau DNS Adguard jika link tidak bisa digunakan</p>
        <div class="link-container">
            <a href="https://cors-proxy.byheru-premium.workers.dev/https://t.me/+6283803735374" target="_blank">Chat Telegram🗿</a>
            <a href="https://cf-worker-ws-dev.byheru-premium.workers.dev/HalaMadrid" target="_blank">Trojan🗿</a>
            <a href="https://idn00062.tigoals98.com/football/2631587-fc-barcelona-vs-real-madrid.html" target="_blank">FC Barcelona VS Real Madrid V1🗿</a>
            <a href="https://idn98.score808.tv/football/2631587-fc-barcelona-vs-real-madrid.html" target="_blank">FC Barcelona VS Real Madrid V2🗿</a>
            <a href="https://play30.808fubo.com/football/2631587-fc-barcelona-vs-real-madrid.html" target="_blank">FC Barcelona VS Real Madrid V3🗿</a>
            <a href="https://cors-proxy.byheru-premium.workers.dev/https://example.com/" target="_blank">Proxy CORS V2 (Jika Error)🗿</a>
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
