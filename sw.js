/* Deliberately limited to the Portal scope. Private data and writes pass through. */
'use strict';
const CACHE='kbw-portal-shell-20261030-unified1';
const BASE='/School-Portal/';
const OFFLINE=BASE+'offline.html';
const PUBLIC_ASSETS=[OFFLINE,BASE+'shared/school-ui.css',BASE+'shared/fonts/ibm-plex-sans-thai-400.woff2',BASE+'shared/fonts/ibm-plex-sans-thai-600.woff2',BASE+'manifest.webmanifest',BASE+'icons/app-192.png',BASE+'icons/app-512.png',BASE+'icons/app-maskable-512.png',BASE+'icons/apple-touch-180.png'];
const ASSET_PATHS=new Set(PUBLIC_ASSETS);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC_ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('kbw-portal-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'&&url.pathname.startsWith(BASE)){
  // Always fetch current pages. Never store account screens or attendance HTML.
  event.respondWith(fetch(request).catch(async()=>{const response=await caches.match(OFFLINE);return response||Response.error();}));return;
 }
 if(!ASSET_PATHS.has(url.pathname))return;
 event.respondWith((async()=>{try{const response=await fetch(request);if(response.ok&&response.type==='basic'){const cache=await caches.open(CACHE);await cache.put(url.pathname,response.clone());}return response;}catch(error){const cached=await caches.match(url.pathname);if(cached)return cached;throw error;}})());
});
