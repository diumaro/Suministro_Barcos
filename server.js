const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON y URL encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🚀 Iniciando servidor proxy...');

// CORS headers para todas las respuestas
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    console.log(`🔧 [CORS] Preflight para ${req.path}`);
    res.sendStatus(200);
  } else {
    next();
  }
});

// --- PROXY PARA TOKEN ---
app.use('/api/token', (req, res, next) => {
  console.log('🔄 [TOKEN-PROXY] Interceptando petición token');
  next();
}, createProxyMiddleware({
  target: 'https://app_lisa.enriel.com',
  changeOrigin: true,
  secure: true,
  timeout: 15000,
  proxyTimeout: 15000,
  logLevel: 'debug',
  pathRewrite: { '^/api/token': '/galileo/lisa/token' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`➡️  [TOKEN] ${new Date().toISOString()} - Reenviando a: https://app_lisa.enriel.com/galileo/lisa/token`);
    console.log(`➡️  [TOKEN] Headers:`, proxyReq.getHeaders());
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`⬅️  [TOKEN] Respuesta: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
    
    // Headers CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  },
  onError: (err, req, res) => {
    console.error(`❌ [TOKEN] Error: ${err.message}`);
    console.error(`❌ [TOKEN] Stack: ${err.stack}`);
    res.status(500).json({ 
      error: 'Error en proxy TOKEN', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// --- PROXY PARA CLIENTES ---
app.use('/api/clientes', (req, res, next) => {
  console.log('🔄 [CLIENTES-PROXY] Interceptando petición clientes');
  console.log('🔄 [CLIENTES-PROXY] Query:', req.query);
  console.log('🔄 [CLIENTES-PROXY] Headers:', req.headers);
  next();
}, createProxyMiddleware({
  target: 'https://app_lisa.enriel.com',
  changeOrigin: true,
  secure: true,
  timeout: 15000,
  proxyTimeout: 15000,
  logLevel: 'debug',
  pathRewrite: { '^/api/clientes': '/galileo/lisa/rest/dinamico/OBTENER_BARCLI' },
  onProxyReq: (proxyReq, req, res) => {
    const targetUrl = `https://app_lisa.enriel.com/galileo/lisa/rest/dinamico/OBTENER_BARCLI?${new URLSearchParams(req.query).toString()}`;
    console.log(`➡️  [CLIENTES] ${new Date().toISOString()} - Reenviando a: ${targetUrl}`);
    console.log(`➡️  [CLIENTES] Headers:`, proxyReq.getHeaders());
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`⬅️  [CLIENTES] Respuesta: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
    
    // Headers CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  },
  onError: (err, req, res) => {
    console.error(`❌ [CLIENTES] Error: ${err.message}`);
    res.status(500).json({ 
      error: 'Error en proxy CLIENTES', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// Ruta de prueba
app.get('/api/test', (req, res) => {
  console.log('🔧 [TEST] Endpoint de prueba llamado');
  res.json({ 
    message: 'Servidor proxy funcionando correctamente',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    nodeVersion: process.version,
    proxies: {
      token: '/api/token -> https://app_lisa.enriel.com/galileo/lisa/token',
      clientes: '/api/clientes -> https://app_lisa.enriel.com/galileo/lisa/rest/dinamico/OBTENER_BARCLI'
    }
  });
});

// Test de conectividad externa
app.get('/api/test-connectivity', async (req, res) => {
  console.log('🔧 [TEST] Probando conectividad externa');
  try {
    const https = require('https');
    
    const testRequest = new Promise((resolve, reject) => {
      const options = {
        hostname: 'app_lisa.enriel.com',
        port: 443,
        path: '/galileo/lisa/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': 75
        },
        timeout: 5000
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          resolve({
            success: true,
            statusCode: response.statusCode,
            headers: response.headers,
            data: data
          });
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Timeout'));
      });

      request.write('grant_type=client_credentials&client_id=BARCOS&client_secret=PJp4sliC0DIvle');
      request.end();
    });

    const result = await testRequest;
    res.json(result);

  } catch (error) {
    console.error('❌ [TEST] Error conectividad:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, '.'), {
  // Configurar headers CORS para archivos estáticos también
  setHeaders: (res, path) => {
    res.header('Access-Control-Allow-Origin', '*');
  }
}));

// Ruta por defecto que sirve index.html
app.get('/', (req, res) => {
  console.log('📄 [STATIC] Sirviendo index.html');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('💥 [ERROR] Error del servidor:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

// --- Arrancar servidor ---
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor proxy corriendo en http://0.0.0.0:${PORT}`);
  console.log(`👉 Accede desde: http://192.168.1.35:${PORT}`);
  console.log(`🔧 Proxies configurados:`);
  console.log(`   • /api/token -> https://app_lisa.enriel.com/galileo/lisa/token`);
  console.log(`   • /api/clientes -> https://app_lisa.enriel.com/galileo/lisa/rest/dinamico/OBTENER_BARCLI`);
  console.log(`🐛 Logs detallados activados`);
});

// Manejo graceful de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Manejo de errores no capturadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;