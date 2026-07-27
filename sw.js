// 小语老师拼音乐园 - Service Worker
const CACHE_NAME = 'pinyin-app-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// 安装：预缓存所有静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 请求：缓存优先，网络回退
self.addEventListener('fetch', (event) => {
  // 跳过 chrome-extension 和非 GET 请求
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // 缓存命中，直接返回
      if (cached) return cached;

      // 缓存未命中，走网络
      return fetch(event.request).then((response) => {
        // 只缓存成功的响应
        if (!response || response.status !== 200) return response;

        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(() => {
        // 网络也挂了，返回离线页面（单页应用返回主页面）
        return caches.match('./index.html');
      });
    })
  );
});
