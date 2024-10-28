export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  ANALYTICS: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
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
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          reqHeaders.get("Access-Control-Allow-Headers") ||
          "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With, Token, x-access-token",
      }),
    };

    try {
      // get rid of https://
      let url = request.url.substring(8);
      // decode the original request url
      url = decodeURIComponent(url.substring(url.indexOf("/") + 1));

      if (
        request.method == "OPTIONS" ||
        url.length < 3 ||
        url.indexOf(".") == -1 ||
        url == "favicon.ico" ||
        url == "robots.txt"
      ) {
        const invalid = !(request.method == "OPTIONS" || url.length === 0);
        response.body = await getHelp(env, new URL(request.url));
        response.contentType = "text/html";
        response.status = invalid ? 400 : 200;
      } else {
        url = fixUrl(url);

        let fetchRequest: {
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

        if (["POST", "PUT", "PATCH", "DELETE"].indexOf(request.method) >= 0) {
          const ct = (reqHeaders.get("content-type") || "").toLowerCase();
          if (ct.includes("application/json")) {
            fetchRequest.body = JSON.stringify(await request.json());
          } else if (
            ct.includes("application/text") ||
            ct.includes("text/html")
          ) {
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

    if (response.contentType && response.contentType != "") {
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #1a1a1a;
            font-family: 'Arial', sans-serif;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            overflow: hidden;
        }

        .container {
            text-align: center;
            position: relative;
        }

        .error-code {
            font-size: 150px;
            font-weight: bold;
            position: relative;
            animation: glitch 1s linear infinite;
            text-shadow: 2px 2px #ff0080;
        }

        .message {
            font-size: 24px;
            margin: 20px 0;
            color: #ccc;
        }

        .home-link {
            display: inline-block;
            padding: 12px 24px;
            background: #ff0080;
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: transform 0.3s ease;
        }

        .home-link:hover {
            transform: scale(1.1);
        }

        .astronaut {
            position: absolute;
            width: 100px;
            height: 100px;
            animation: float 6s ease-in-out infinite;
            top: -120px;
            left: 50%;
            transform: translateX(-50%);
        }

        @keyframes glitch {
            2%, 64% {
                transform: translate(2px, 0) skew(0deg);
            }
            4%, 60% {
                transform: translate(-2px, 0) skew(0deg);
            }
            62% {
                transform: translate(0, 0) skew(5deg);
            }
        }

        @keyframes float {
            0% {
                transform: translateY(0) rotate(0deg);
            }
            50% {
                transform: translateY(-20px) rotate(10deg);
            }
            100% {
                transform: translateY(0) rotate(0deg);
            }
        }

        .stars {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            animation: twinkle 1s infinite;
        }

        @keyframes twinkle {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.3;
            }
        }
    </style>
</head>
<body>
    <div class="stars">
        <script>
            for (let i = 0; i < 100; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 1 + 's';
                document.querySelector('.stars').appendChild(star);
            }
        </script>
    </div>

    <div class="container">
        <div class="astronaut">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="35" fill="#ffffff"/>
                <circle cx="50" cy="50" r="30" fill="#1a1a1a"/>
                <circle cx="45" cy="45" r="5" fill="#ffffff"/>
                <rect x="40" y="60" width="20" height="10" rx="5" fill="#ffffff"/>
            </svg>
        </div>
        <div class="error-code">404</div>
        <div class="message">Halaman Tidak Ditemukan</div>
        <a href="t.me/ByHeru" class="home-link"> Chat Telegram</a>
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
  return await env.ANALYTICS.get("total_requests");
  }
