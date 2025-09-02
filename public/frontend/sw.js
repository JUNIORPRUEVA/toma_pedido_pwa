const CACHE_NAME = 'toma-pedido-cache-v9';
const URLS_TO_CACHE = [
  '/frontend/',
  '/frontend/index.html',
  '/frontend/styles.css',
  '/frontend/app.js',
  '/frontend/manifest.json',
  '/frontend/icons/icon-192.png',
  '/frontend/icons/icon-512.png'
];

// Instalación: almacenar archivos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Activación: limpieza de cachés antiguos si existen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {    const express = require('express');
    const app = express();
    const path = require('path');
    
    // Cambia 'public' por 'public/frontend' si tu index.html está ahí
    app.use(express.static(path.join(__dirname, 'public', 'frontend')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'frontend', 'index.html'));
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepción de peticiones: servir desde caché si existe
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
