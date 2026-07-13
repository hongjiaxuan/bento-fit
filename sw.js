// Bento Fit Service Worker
const CACHE_NAME = 'bento-fit-v2.14';
// 核心本地資源：缺一不可，快取失敗則安裝失敗
const coreAssets = [
  './',
  './index.html',
  './manifest.json',
  './tailwind.css',
  './icon-192.png',
  './icon-512.png'
];
// CDN 資源：盡力快取，抓不到也不能擋住 SW 安裝
const optionalAssets = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 安裝階段：快取核心靜態檔案
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching core assets');
            const optional = optionalAssets.map(url =>
                cache.add(url).catch(err => console.warn('[SW] Optional asset skipped:', url, err))
            );
            return Promise.all([cache.addAll(coreAssets), ...optional]);
        })
    );
});

// 啟動階段：清除舊版快取，並通知頁面有更新
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            // 通知所有已開啟的頁面：有新版本可用
            return self.clients.matchAll({ type: 'window' }).then(clients => {
                clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
            });
        })
    );
    self.clients.claim();
});

// 攔截請求階段 (Fetch)
self.addEventListener('fetch', event => {
    const url = event.request.url;

    // ⛔ 排除清單：API 請求（Gemini、Apps Script 同步）不經過快取
    if (event.request.method !== 'GET' ||
        url.includes('generativelanguage.googleapis.com') ||
        url.includes('script.google.com')) {
        return; // 直接放行，交給網路處理
    }

    // 抓到回應後順便寫入快取（含字型/CDN 等跨域資源，離線才有完整樣式）
    const fetchAndCache = () => fetch(event.request).then(networkResponse => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
    });

    // 🔄 HTML 導覽請求：網路優先（部署新版即時生效），斷線時退回快取
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetchAndCache().catch(() =>
                caches.match(event.request).then(cached => cached || caches.match('./index.html'))
            )
        );
        return;
    }

    // ✅ 其餘靜態資源：快取優先 (Cache First, fallback to Network)
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse; // 命中快取，直接回傳 (秒開關鍵)
            }
            return fetchAndCache().catch(() => {
                console.log('[SW] 網路斷線且無快取可支援:', url);
            });
        })
    );
});
