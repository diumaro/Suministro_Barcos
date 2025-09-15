// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// 1) Servir los ficheros estáticos (index.html, css/, js/, img/)
app.use(express.static(path.join(__dirname, '.')));

// 2) Proxy hacia el ERP - Token
app.use('/api/token', createProxyMiddleware({
  target: 'https://app_lisa.enriel.com',
  changeOrigin: true,
  pathRewrite: { '^/api/token': '/galileo/lisa/token' }
}));

// 3) Proxy hacia el ERP - Clientes
app.use('/api/clientes', createProxyMiddleware({
  target: 'https://app_lisa.enriel.com',
  changeOrigin: true,
  pathRewrite: { '^/api/clientes': '/galileo/lisa/rest/dinamico/OBTENER_BARCLI' }
}));

// 4) Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor en http://localhost:${PORT}`);
 // console.log(`👉 Abre en tu navegador: http://<IP_NAS>:${PORT}/index.html`);
});