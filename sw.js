const CACHE="vuottroi-v12"; // MỖI LẦN UPDATE LỚN: đổi số v2->v3->... để ép xóa cache cũ
const ASSETS=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  const req = e.request;
  // TRANG HTML (điều hướng): luôn ưu tiên MẠNG trước để lấy bản mới nhất; mất mạng mới dùng cache
  if (req.mode === "navigate" || (req.method==="GET" && req.headers.get("accept")?.includes("text/html"))) {
    e.respondWith(
      fetch(req).then(res=>{
        const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp));
        return res;
      }).catch(()=> caches.match(req).then(r=> r || caches.match("./index.html")))
    );
    return;
  }
  // FILE TĨNH khác (icon, manifest...): cache trước cho nhanh, có mạng thì âm thầm cập nhật lại
  e.respondWith(
    caches.match(req).then(cached=>{
      const fetchPromise = fetch(req).then(res=>{
        const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp));
        return res;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })
  );
});
