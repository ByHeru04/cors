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
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ByHeru Live Events</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.3.5/shaka-player.compiled.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #3b82f6;
            --secondary-color: #60a5fa;
            --background-dark: #0f172a;
            --card-background: #1e293b;
            --text-light: #f8fafc;
            --accent-color: #0088cc;
        }

        /* Keep existing styles up to .live-indicator */
        body {
            margin: 0;
            padding: 20px;
            background: var(--background-dark);
            color: var(--text-light);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .player-wrapper {
            background: var(--card-background);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .title {
            font-size: 28px;
            color: var(--secondary-color);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .telegram-link {
            background-color: var(--accent-color);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .telegram-link:hover {
            background-color: #0099e6;
            transform: translateY(-2px);
        }

        .telegram-link i {
            font-size: 16px;
        }

        /* Keep rest of the existing styles */
        .video-container {
            position: relative;
            width: 100%;
            padding-top: 56.25%;
            background: #000;
            border-radius: 12px;
            overflow: hidden;
        }
        
        video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 12px;
        }
        
        .controls-wrapper {
            margin-top: 20px;
        }

        .server-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .server-button {
            background: var(--card-background);
            color: var(--text-light);
            border: 2px solid var(--primary-color);
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .server-button:hover, .server-button.active {
            background: var(--primary-color);
            transform: translateY(-2px);
        }

        .server-button i {
            font-size: 16px;
        }
        
        .info-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .info-card {
            background: #334155;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .info-card i {
            font-size: 20px;
            color: var(--secondary-color);
        }

        .info-card-content {
            flex-grow: 1;
        }

        .info-card-label {
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 4px;
        }

        .info-card-value {
            font-size: 16px;
            font-weight: 600;
        }

        .stream-status {
            padding: 15px;
            background: #334155;
            border-radius: 10px;
            margin-top: 20px;
        }

        .status-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #475569;
        }

        .status-row:last-child {
            border-bottom: none;
        }

        .status-label {
            color: #94a3b8;
        }

        .status-value {
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="player-wrapper">
            <div class="header">
                <h1 class="title">
                    <i class="fas fa-broadcast-tower"></i>
                    ByHeru Live
                </h1>
                <a href="https://cors-test.byheru.workers.dev/t.me/ByHeru" target="_blank" class="telegram-link">
                    <i class="fab fa-telegram-plane"></i>
                    Telegram
                </a>
            </div>
            
            <div class="video-container">
                <video id="video" controls></video>
            </div>
            
            <div class="controls-wrapper">
                <div class="server-buttons">
                    <button class="server-button" onclick="loadServer(1)" id="server1">
                        <i class="fas fa-server"></i>
                        Server 1
                    </button>
                    <button class="server-button" onclick="loadServer(2)" id="server2">
                        <i class="fas fa-server"></i>
                        Server 2
                    </button>
                    <button class="server-button" onclick="loadServer(3)" id="server3">
                        <i class="fas fa-server"></i>
                        Server 3
                    </button>
                    <button class="server-button" onclick="loadServer(4)" id="server4">
                        <i class="fas fa-server"></i>
                        Server 4
                    </button>
                    <button class="server-button" onclick="loadServer(5)" id="server5">
                        <i class="fas fa-server"></i>
                        Server 5
                    </button>
                    <button class="server-button" onclick="loadServer(6)" id="server6">
                        <i class="fas fa-server"></i>
                        Server 6
                    </button>
                </div>
                
                <div class="info-cards">
                    <div class="info-card">
                        <i class="fas fa-broadcast-tower"></i>
                        <div class="info-card-content">
                            <div class="info-card-label">Current Server</div>
                            <div class="info-card-value" id="currentServer">-</div>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <i class="fas fa-video"></i>
                        <div class="info-card-content">
                            <div class="info-card-label">Quality</div>
                            <div class="info-card-value" id="videoQuality">-</div>
                        </div>
                    </div>

                    <div class="info-card">
                        <i class="fas fa-clock"></i>
                        <div class="info-card-content">
                            <div class="info-card-label">Uptime</div>
                            <div class="info-card-value" id="uptime">00:00:00</div>
                        </div>
                    </div>
                </div>

                <div class="stream-status">
                    <div class="status-row">
                        <span class="status-label">Stream Health</span>
                        <span class="status-value" id="streamHealth">Excellent</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Viewers</span>
                        <span class="status-value" id="viewerCount">0</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Bitrate</span>
                        <span class="status-value" id="bitrate">0 Mbps</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize Shaka Player
        const video = document.getElementById('video');
        const player = new shaka.Player(video);

        // Server configurations with live stream URLs
        const servers = {
            1: {
                manifest: 'https://cors-test.byheru.workers.dev/av-ch-cdn.mncnow.id/live/eds/BEIN03/sa_dash_vmx/BEIN03.mpd',
                key: 'd5e35c0f39c76adf24853d7ea18c71e7',
                kid: '57d2ac9210cfbca3596cc679a01c8b29'
            },
            2: {
                manifest: 'https://cors-test.byheru.workers.dev/webtvstream.bhtelecom.ba/hls6/as_premium3.mpd',
                key: 'e41c3a6f7532b2e3a828d9580124c89d',
                kid: 'c18b6aa739be4c0b774605fcfb5d6b68'
            },
            3: {
                manifest: 'https://cors-test.byheru.workers.dev/live/stream3.m3u8',
                license: '',
                key: '',
                kid: ''
            },
            4: {
                manifest: 'https://cors-test.byheru.workers.dev/live/stream4.m3u8',
                license: '',
                key: '',
                kid: ''
            },
            5: {
                manifest: 'https://cors-test.byheru.workers.dev/live/stream5.m3u8',
                license: '',
                key: '',
                kid: ''
            },
            6: {
                manifest: 'https://cors-test.byheru.workers.dev/live/stream6.m3u8',
                license: '',
                key: '',
                kid: ''
            }
        };

        let startTime = Date.now();
        let currentServerButton = null;

        // Update uptime
        setInterval(() => {
            const seconds = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            document.getElementById('uptime').textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }, 1000);

        // Simulate viewer count and bitrate updates
        setInterval(() => {
            const viewers = Math.floor(Math.random() * 1000) + 500;
            const bitrate = (Math.random() * 5 + 3).toFixed(1);
            document.getElementById('viewerCount').textContent = viewers.toLocaleString();
            document.getElementById('bitrate').textContent = `${bitrate} Mbps`;
        }, 5000);

        // Configure DRM
        function configureDrm(serverConfig) {
            const drmInfo = {
                keySystem: 'org.w3.clearkey',
                licenseServerUrl: serverConfig.license,
                clearKeys: {
                    [serverConfig.kid]: serverConfig.key
                }
            };
            
            player.configure({
                drm: {
                    clearKeys: drmInfo.clearKeys
                }
            });
        }

        // Load video from server
        async function loadServer(serverNum) {
            try {
                // Update active server button
                if (currentServerButton) {
                    currentServerButton.classList.remove('active');
                }
                currentServerButton = document.getElementById(`server${serverNum}`);
                currentServerButton.classList.add('active');

                const serverConfig = servers[serverNum];
                document.getElementById('currentServer').textContent = `Server ${serverNum}`;
                
                // Configure DRM for the server
                configureDrm(serverConfig);
                
                // Load the manifest
                await player.load(serverConfig.manifest);
                
                // Update video quality info
                const tracks = player.getVariantTracks();
                const highestQuality = tracks.reduce((max, track) => 
                    Math.max(max, track.height), 0);
                document.getElementById('videoQuality').textContent = `${highestQuality}p`;
                
                // Start playback
                video.play();

                // Update stream health randomly
                const healthStatuses = ['Excellent', 'Good', 'Fair'];
                document.getElementById('streamHealth').textContent = 
                    healthStatuses[Math.floor(Math.random() * healthStatuses.length)];
            } catch (error) {
                console.error('Error loading video:', error);
                alert('Error loading video. Please try another server.');
            }
        }

        // Initialize player when document is ready
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                await shaka.Player.isBrowserSupported();
                // Initialize with first server
                loadServer(1);
            } catch (error) {
                console.error('Browser not supported:', error);
                alert('Your browser is not supported. Please use a modern browser.');
            }
        });

        // Error handling
        player.addEventListener('error', (event) => {
            console.error('Player error:', event.detail);
        });
    </script>
</body>
</html>
`;
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
