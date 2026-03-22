// Bento Fit Service Worker v1.0
const CACHE_NAME = 'bento-fit-v2.3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png', // 請確保您有一張 icon.png 圖片
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 安裝階段：快取核心靜態檔案
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching core assets');
            return cache.addAll(urlsToCache);
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

    // ⛔ 排除清單：絕對不要快取 Tailwind CDN 與 Google Gemini API
    if (url.includes('cdn.tailwindcss.com') || url.includes('generativelanguage.googleapis.com')) {
        return; // 直接放行，交給網路處理
    }

    // ✅ 快取優先策略 (Cache First, fallback to Network)
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse; // 命中快取，直接回傳 (秒開關鍵)
            }
            
            // 沒命中，去網路抓
            return fetch(event.request).then(networkResponse => {
                // 如果抓回來的是正常的靜態檔案，就順便存進快取
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // 網路斷線且快取沒有時的防呆 (如果想做離線恐龍頁可以放這裡)
                console.log('[SW] 網路斷線且無快取可支援');
            });
        })
    );
});