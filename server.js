const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;



// --- Proxy para TOKEN ---
app.use('/api/token', createProxyMiddleware({
  target: 'https://app_lisa.enriel.com',
  changeOrigin: true,
  logLevel: 'debug',   // 👈 más detalle en consola
  pathRewrite: { '^/api/token': '/galileo/lisa/token' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`➡️  [TOKEN] ${req.method} ${req.originalUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`⬅️  [TOKEN] Respuesta ${proxyRes.statusCode}`);
  }
}));

// --- Proxy para CLIENTES ---
app.use('/api/clientes', createProxyMiddleware({
  target: 'https://app_lisa.enriel.com',
  changeOrigin: true,
  logLevel: 'debug',
  pathRewrite: { '^/api/clientes': '/galileo/lisa/rest/dinamico/OBTENER_BARCLI' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`➡️  [CLIENTES] ${req.method} ${req.originalUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`⬅️  [CLIENTES] Respuesta ${proxyRes.statusCode}`);
  }
}));

// Servir archivos estáticos (HTML, JS, CSS, imágenes)
app.use(express.static(path.join(__dirname, '.')));

// --- Arrancar servidor ---
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`👉 Abre en tu navegador: http://<IP_NAS>:${PORT}/index.html`);
});