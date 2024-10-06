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
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          reqHeaders.get("Access-Control-Allow-Headers") ||
          "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With, Token, x-access-token",
      }),
    };

    try {
      // Hilangkan https:// dari URL
      let url = request.url.substring(8);
      // Decode URL permintaan asli
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

async function getHelp(env: Env, url: URL): Promise<string> {
  return `<html lang="en">
 <head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>
   Video Only
  </title>
  <script src="https://cdn.tailwindcss.com">
  </script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet"/>
 </head>
 <body class="bg-black text-white">
  <div class="relative">
   <div class="bg-gray-800 p-2">
    <div class="flex items-center space-x-2">
     <i class="fas fa-arrow-left">
     </i>
     <span>
      HalaMadrid
     </span>
    </div>
   </div>
   <div class="relative">
    <video id="videoPlayer" class="w-full" controls>
     <source src="https://m3u8player.byheru-halamadrid.workers.dev/?url=https://raw.githubusercontent.com/ByHeru04/IPTV/refs/heads/main/indosiarHD.m3u8" type="application/x-mpegURL"/>
     Your browser does not support the video tag.
    </video>
    <div class="absolute bottom-0 left-0 p-2 bg-black bg-opacity-50 w-full flex items-center justify-between">
     <div class="flex items-center space-x-2">
      <span>
       ByHeru
      </span>
     </div>
    </div>
   </div>
   <div class="bg-gray-800 p-2 flex items-center justify-around">
    <button class="bg-blue-500 text-white p-2 rounded" onclick="changeSource('https://path/to/your/video1.m3u8')">
     Server 1
    </button>
    <button class="bg-blue-500 text-white p-2 rounded" onclick="changeSource('https://path/to/your/video2.m3u8')">
     Server 2
    </button>
    <button class="bg-blue-500 text-white p-2 rounded" onclick="changeSource('https://path/to/your/video3.m3u8')">
     Server 3
    </button>
   </div>
  </div>
  <script>
   function changeSource(source) {
     const videoPlayer = document.getElementById('videoPlayer');
     videoPlayer.src = source;
     videoPlayer.play();
   }
  </script>
 </body>
</html>;
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
