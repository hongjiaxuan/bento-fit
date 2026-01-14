// Bento Fit Service Worker v1.0
const CACHE_NAME = 'bento-fit-v1.6';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png', // 請確保您有一張 icon.png 圖片
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 安裝時強制跳過等待 (Skip Waiting)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 🔥 這行很重要，讓新版立刻就緒
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// 啟用時刪除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // 🔥 這行很重要，讓新版立刻接管頁面
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // 只快取 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // 有快取就直接用
      }
      return fetch(event.request).then((response) => {
        // 檢查回應是否有效
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        // 將新請求到的資源存入快取
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});