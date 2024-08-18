export interface Env {
  ANALYTICS: KVNamespace;
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  // MY_BUCKET: R2Bucket;
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
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "default-src 'self'; script-src 'none'; object-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
      }),
    };

    try {
      // Hilangkan https:// dari URL
      let url = request.url.substring(8);
      // Decode URL permintaan asli
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
        // Hapus headers tertentu sebelum meneruskan permintaan
        const fetchRequest = deleteHeaders(reqHeaders);

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

        let fetchResponse = await fetch(url, fetchRequest);
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

// Fungsi untuk menghapus headers tertentu dari permintaan
function deleteHeaders(reqHeaders: Headers): { headers: Headers; method: string; body?: BodyInit } {
  const fetchRequest: { headers: Headers; method: string; body?: BodyInit } = {
    method: "GET", // Default method
    headers: new Headers(),
  };

  const headersToDelete = ["x-powered-by", "server", "content-security-policy", "content-security-policy-report-only", "clear-site-data"];
  for (let [key, value] of reqHeaders.entries()) {
    if (!headersToDelete.includes(key.toLowerCase())) {
      fetchRequest.headers.set(key, value);
    }
  }

  return fetchRequest;
}

function fixUrl(url: string): string {
  if (url.includes("://")) {
    return url;
  } else if (url.includes(":/")) {
    return url.replace(":/", "://");
  } else {
    return "http://" + url;
  }
}

async function getHelp(env: Env, url: URL): Promise<string> {
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
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #fdfbfb, #ebedee);
            color: #333;
        }
        .status-container {
            text-align: center;
            background-color: #ffffff;
            border-radius: 15px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
            padding: 50px;
            max-width: 450px;
            width: 100%;
            animation: fadeIn 1s ease-in-out;
        }
        h1 {
            font-size: 2.5em;
            margin: 0;
            color: #007BFF;
        }
        p {
            font-size: 1.3em;
            margin: 20px 0 30px;
            color: #555;
        }
        .link-container {
            margin-top: 25px;
        }
        .link-container a {
            display: inline-block;
            margin: 10px;
            padding: 16px 28px;
            text-decoration: none;
            color: #fff;
            background-color: #007BFF;
            border-radius: 8px;
            font-size: 1.2em;
            font-weight: bold;
            transition: background-color 0.3s, transform 0.2s;
        }
        .link-container a:hover {
            background-color: #0056b3;
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
            <a href="https://cors.byheru-halamadrid.workers.dev/t.me/+6283803735374" target="_blank">Telegram🗿</a>
            <a href="https://cf-worker-ws-dev.byheru-halamadrid.workers.dev/HalaMadrid" target="_blank">Trojan🗿</a>
            <a href="https://cors-proxy.byheru-halamadrid.workers.dev/" target="_blank">Cors Proxy V2</a>
            <a href="https://cors-proxy-test.byheru-halamadrid.workers.dev/" target="_blank">Cors Proxy (Disarankan)</a>
        </div>
    </div>
</body>
</html>
  `;
}

async function increment(env: Env) {
  if (!env.ANALYTICS) return;
  let count = parseInt((await env.ANALYTICS.get("total_requests")) || "0");
  await env.ANALYTICS.put("total_requests", (++count).toFixed());
}

async function totalRequests(env: Env): Promise<number> {
  if (!env.ANALYTICS) return 0;
  return parseInt((await env.ANALYTICS.get("total_requests")) || "0");
}
