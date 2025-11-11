/**
 * Development Proxy Server for CORS
 * 
 * This script creates a simple proxy server to bypass CORS issues during development.
 * Run this alongside your Expo web server.
 * 
 * Usage:
 *   node scripts/dev-proxy.js
 * 
 * Then update your .env file to use:
 *   EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/api
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PROXY_PORT = 3001;
// Get the actual API URL (without /api suffix, proxy will add it)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 
                     process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 
                     'https://lk-7ly1.onrender.com';

console.log('🚀 Starting CORS Proxy Server...');
console.log(`📡 Proxying to: ${API_BASE_URL}`);
console.log(`🌐 Proxy listening on: http://localhost:${PROXY_PORT}`);

const server = http.createServer((req, res) => {
  // Enable CORS - MUST be set before any response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Health check endpoint
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ 
      status: 'ok', 
      message: 'CORS Proxy is running',
      proxyPort: PROXY_PORT,
      targetApi: API_BASE_URL,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Content-Length': '0',
    });
    res.end();
    return;
  }

  // Parse the target URL
  const targetPath = req.url.startsWith('/api') ? req.url : `/api${req.url}`;
  let targetUrl;
  try {
    targetUrl = new URL(API_BASE_URL + targetPath);
  } catch (error) {
    console.error('❌ Invalid target URL:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Invalid proxy configuration' }));
    return;
  }
  
  const targetProtocol = targetUrl.protocol === 'https:' ? https : http;

  console.log(`📤 ${req.method} ${req.url} -> ${targetUrl.href}`);

  // Forward the request
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Accept': req.headers['accept'] || 'application/json',
      'User-Agent': req.headers['user-agent'] || 'Proxy/1.0',
    },
  };

  // Forward Authorization header if present
  if (req.headers['authorization']) {
    options.headers['Authorization'] = req.headers['authorization'];
  }

  const proxyReq = targetProtocol.request(options, (proxyRes) => {
    // Ensure CORS headers are set FIRST
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Copy response headers (but don't override CORS headers)
    Object.keys(proxyRes.headers).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'access-control-allow-origin' && 
          lowerKey !== 'access-control-allow-methods' &&
          lowerKey !== 'access-control-allow-headers') {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });

    res.writeHead(proxyRes.statusCode);

    proxyRes.on('data', (chunk) => {
      res.write(chunk);
    });

    proxyRes.on('end', () => {
      res.end();
      console.log(`✅ ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
    });
  });

  proxyReq.on('error', (error) => {
    console.error(`❌ Proxy error for ${req.url}:`, error.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(502, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ 
      error: 'Proxy error', 
      message: error.message,
      details: 'The proxy server could not connect to the API server. Check if the API server is running.'
    }));
  });

  // Set timeout for proxy request
  proxyReq.setTimeout(30000, () => {
    proxyReq.destroy();
    console.error(`❌ Proxy timeout for ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(504, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ error: 'Proxy timeout', message: 'Request took too long' }));
  });

  // Forward request body
  let bodyData = [];

  req.on('data', (chunk) => {
    bodyData.push(chunk);
  });

  req.on('end', () => {
    if (bodyData.length > 0) {
      const body = Buffer.concat(bodyData);
      proxyReq.write(body);
    }
    proxyReq.end();
  });

  req.on('error', (error) => {
    console.error(`❌ Request error:`, error);
    proxyReq.destroy();
  });
});

server.listen(PROXY_PORT, () => {
  console.log(`✅ CORS Proxy Server running on http://localhost:${PROXY_PORT}`);
  console.log(`📡 Proxying requests to: ${API_BASE_URL}`);
  console.log(`💡 The web app will automatically use this proxy (no .env changes needed)`);
  console.log(`🌐 Example: http://localhost:${PROXY_PORT}/api/auth/signIn -> ${API_BASE_URL}/api/auth/signIn`);
});

