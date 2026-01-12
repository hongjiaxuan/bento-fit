// Bento Fit Service Worker v1.0
const CACHE_NAME = 'bento-fit-v1.1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png', // 請確保您有一張 icon.png 圖片
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 刪除舊版本的快取，確保使用者更新到最新版
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
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