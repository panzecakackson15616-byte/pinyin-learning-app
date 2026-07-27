// 小语老师拼音乐园 - Service Worker v4
const CACHE_NAME = 'pinyin-app-v4';
const ASSETS = [
  './',
  './index.html',
  './chars.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// 安装：预缓存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW v3] Caching assets');
      return cache.addAll(ASSETS).catch(e => console.log('[SW] Cache addAll failed (some may be offline):', e));
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

// 请求：network-first（先网络，网络失败才用缓存）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    fetch(event.request).then((response) => {
      // 网络成功 → 更新缓存，返回最新内容
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(() => {
      // 网络失败 → 使用缓存作为后备
      return caches.match(event.request).then(cached => {
        return cached || caches.match('./index.html');
      });
    })
  );
});
