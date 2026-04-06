const express = require("express");
const { LISTEN_PORT } = require("./src/config/env");
const router = require("./src/router");
const cors = require("cors");
const path = require("path");
const { logger } = require("./src/utils");

// initial function
const app = express();

// run jobs
require('./src/utils/jobs/kpiLogs/index');

// global middleware --- body parser, rate limit , etc
app.use('/pmapi/attachments', express.static(path.join("src", "storage", "public", "attachments")));
// app.use(express.static(path.join(__dirname, "./public/WebApp")));

app.use(cors({ origin: "*" }));
app.set("trust proxy", true);
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const currentIp =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip; // IP dari Express (fallback)


  if (currentIp.includes("::ffff:")) {
    currentIp = currentIp.split("::ffff:")[1];
  }

  console.log("User IP:", currentIp);
  req.clientIp = currentIp;
  next();
});


// GET handler
app.get('/pmapi/proxy/curr_project', async (req, res) => {
  await handleProxyRequest(req, res);
});

// POST handler
app.post('/pmapi/proxy/curr_project', async (req, res) => {
  await handleProxyRequest(req, res);
});

// OPTIONS handler untuk CORS preflight
app.options('/pmapi/proxy/curr_project', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Disposition, Accept, Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length, Accept-Ranges");
  res.status(200).end();
});

async function handleProxyRequest(req, res) {
  try {
    const targetUrl = req.query.link;
    const bearerToken = req.headers["authorization"];
    const tokenFromQuery = req.query.token;

    // Set CORS headers di awal
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Disposition, Accept, Range");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length, Accept-Ranges");

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (!targetUrl) {
      return res.status(400).send("Missing 'link' parameter");
    }

    let token = null;
    if (bearerToken) {
      let [bearer, headerToken] = bearerToken.split(" ");
      token = headerToken;
    } else if (tokenFromQuery) {
      token = tokenFromQuery;
    }

    if (!token) {
      return res.status(401).send("Missing authorization token");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased timeout untuk download besar

    const fetchOptions = {
      signal: controller.signal,
      redirect: 'follow',
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        Authorization: `Bearer ${token}`
      }
    };

    // Handle Range header untuk download resume
    if (req.headers.range) {
      fetchOptions.headers['Range'] = req.headers.range;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        const formBody = new URLSearchParams(req.body).toString();
        fetchOptions.body = formBody;
        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (req.headers['content-type']?.includes('application/json')) {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers['Content-Type'] = 'application/json';
      } else if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Untuk upload file
        fetchOptions.body = req.body;
        fetchOptions.headers['Content-Type'] = req.headers['content-type'];
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).send(`Error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');

    // Set response headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length, Accept-Ranges");

    if (contentDisposition) {
      res.setHeader("Content-Disposition", contentDisposition);
    }

    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (acceptRanges) {
      res.setHeader("Accept-Ranges", acceptRanges);
    }

    // Handle JSON response
    if (contentType.includes('application/json')) {
      const jsonText = await response.text();
      return res.send(jsonText);
    }

    // Handle file downloads (binary content)
    if (
      contentDisposition ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('application/pdf') ||
      contentType.includes('application/zip') ||
      contentType.includes('application/vnd') ||
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('audio/')
    ) {
      // Stream the response directly untuk files besar
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }

    // Handle HTML content
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const finalUrl = response.url;
      const baseUrl = new URL(finalUrl);
      const origin = baseUrl.origin;

      res.removeHeader("X-Frame-Options");
      res.setHeader("Content-Security-Policy", "frame-ancestors *");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const proxyPath = '/pmapi/proxy/curr_project';

      const injectedScript = `
  <script>
    (function() {
      const proxyPath = '${proxyPath}';
      const token = '${tokenFromQuery}';
      const baseOrigin = '${origin}';
      
      function proxyUrl(url) {
        if (!url || url.startsWith('javascript:') || url.startsWith('#') || url.startsWith('data:') || url.startsWith('blob:')) {
          return url;
        }
        
        try {
          const targetBase = '${finalUrl}';
          const absoluteUrl = new URL(url, targetBase).href;
          const urlObj = new URL(absoluteUrl);
          
          if (urlObj.origin === baseOrigin) {
            return window.location.origin + proxyPath + '?link=' + encodeURIComponent(absoluteUrl) + '&token=' + encodeURIComponent(token);
          }
          
          return absoluteUrl;
        } catch (e) {
          console.error('Error proxying URL:', e);
          return url;
        }
      }
      
      // Override fetch dengan support untuk download
      const originalFetch = window.fetch;
      window.fetch = function(url, options = {}) {
        try {
          const proxiedUrl = proxyUrl(url);
          
          if (!options.headers) {
            options.headers = {};
          }
          
          if (typeof options.headers === 'object' && !Array.isArray(options.headers)) {
            if (!options.headers['Authorization'] && !options.headers['authorization']) {
              options.headers['Authorization'] = 'Bearer ' + token;
            }
          }
          
          console.log('Fetching:', proxiedUrl, options);
          return originalFetch(proxiedUrl, options);
        } catch (e) {
          console.error('Fetch error:', e);
          return originalFetch(url, options);
        }
      };
      
      // Override XMLHttpRequest dengan support untuk upload/download
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
      
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;
        this._method = method;
        this._requestHeaders = {};
        const proxiedUrl = proxyUrl(url);
        console.log('XHR Open:', method, proxiedUrl);
        return originalXHROpen.call(this, method, proxiedUrl, ...rest);
      };
      
      XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        this._requestHeaders[header] = value;
        return originalXHRSetRequestHeader.call(this, header, value);
      };
      
      XMLHttpRequest.prototype.send = function(body) {
        if (!this._requestHeaders['Authorization'] && !this._requestHeaders['authorization']) {
          this.setRequestHeader('Authorization', 'Bearer ' + token);
        }
        console.log('XHR Send:', this._method, this._url, body);
        return originalXHRSend.call(this, body);
      };
      
      // Intercept clicks untuk download links
      document.addEventListener('click', function(e) {
        let target = e.target;
        
        while (target && target.tagName !== 'A' && target.tagName !== 'BUTTON') {
          target = target.parentElement;
        }
        
        if (target) {
          if (target.tagName === 'A' && target.href) {
            const href = target.getAttribute('href');
            
            // Check if it's a download link
            if (target.hasAttribute('download') || href?.includes('download')) {
              e.preventDefault();
              const proxiedUrl = proxyUrl(target.href);
              
              // Use fetch to download dengan proper headers
              fetch(proxiedUrl, {
                headers: {
                  'Authorization': 'Bearer ' + token
                }
              })
              .then(response => response.blob())
              .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = target.getAttribute('download') || 'download';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              })
              .catch(err => console.error('Download error:', err));
              return;
            }
            
            // Regular navigation
            if (!target.target && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
              e.preventDefault();
              window.location.href = proxyUrl(target.href);
              return;
            }
          }
          
          if (target.hasAttribute('data-url')) {
            const dataUrl = target.getAttribute('data-url');
            if (dataUrl && !dataUrl.startsWith('#') && !dataUrl.startsWith('javascript:')) {
              e.preventDefault();
              window.location.href = proxyUrl(dataUrl);
              return;
            }
          }
        }
      }, true);
      
      // Form submission handling
      const currentParams = new URLSearchParams(window.location.search);
      const originalTargetUrl = currentParams.get('link') || '${finalUrl}';
      let isProxyFormSubmitting = false;
      
      document.addEventListener('submit', function(e) {
        if (isProxyFormSubmitting || e.target.classList.contains('__proxy_form__')) {
          return true;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        handleFormSubmit(e.target);
        return false;
      }, true);
      
      const originalFormSubmit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = function() {
        if (this.classList.contains('__proxy_form__')) {
          return originalFormSubmit.call(this);
        }
        handleFormSubmit(this);
      };
      
      function handleFormSubmit(form) {
        console.log('Form submission detected:', form);
        
        let formAction = form.getAttribute('action') || form.action;
        
        if (!formAction || formAction === '' || formAction === window.location.href) {
          formAction = originalTargetUrl;
        }
        
        try {
          const actionUrl = new URL(formAction, originalTargetUrl);
          const formData = new FormData(form);
          const method = (form.method || 'GET').toUpperCase();
          
          if (method === 'POST') {
            const proxyForm = document.createElement('form');
            proxyForm.method = 'POST';
            proxyForm.action = window.location.origin + proxyPath + '?link=' + encodeURIComponent(actionUrl.href) + '&token=' + encodeURIComponent(token);
            proxyForm.style.display = 'none';
            proxyForm.classList.add('__proxy_form__');
            
            // Support file upload
            proxyForm.enctype = form.enctype || 'application/x-www-form-urlencoded';
            
            for (let [key, value] of formData.entries()) {
              if (key !== '_proxy_token') {
                const input = document.createElement('input');
                input.type = value instanceof File ? 'file' : 'hidden';
                input.name = key;
                if (!(value instanceof File)) {
                  input.value = value;
                }
                proxyForm.appendChild(input);
              }
            }
            
            document.body.appendChild(proxyForm);
            isProxyFormSubmitting = true;
            proxyForm.submit();
            
          } else {
            const params = new URLSearchParams();
            
            for (let [key, value] of formData.entries()) {
              if (key !== '_proxy_token' && value && !(value instanceof File)) {
                params.append(key, value);
              }
            }
            
            const existingParams = new URLSearchParams(actionUrl.search);
            for (let [key, value] of existingParams.entries()) {
              if (!params.has(key)) {
                params.append(key, value);
              }
            }
            
            const finalTargetUrl = actionUrl.origin + actionUrl.pathname + (params.toString() ? '?' + params.toString() : '');
            const proxiedUrl = window.location.origin + proxyPath + '?link=' + encodeURIComponent(finalTargetUrl) + '&token=' + encodeURIComponent(token);
            
            window.location.href = proxiedUrl;
          }
          
        } catch (err) {
          console.error('Error processing form:', err);
        }
      }
      
      console.log('Proxy script with download/upload support injected');
    })();
  </script>
`;

      if (html.includes('</head>')) {
        html = html.replace('</head>', injectedScript + '</head>');
      } else if (html.includes('<body')) {
        html = html.replace('<body', injectedScript + '<body');
      } else {
        html = injectedScript + html;
      }

      const baseTag = `<base href="${finalUrl}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', '<head>' + baseTag);
      }

      return res.send(html);
    }

    // Fallback untuk content type lainnya
    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", contentType);
    return res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Proxy error:', error);

    if (error.name === 'AbortError') {
      return res.status(408).send("Request timeout");
    }

    if (error.code === 'ENOTFOUND') {
      return res.status(404).send("Target URL not found");
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).send("Connection refused by target server");
    }

    res.status(500).send(`Error loading content: ${error.message}`);
  }
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// global router
router(app);

const http = require("http"); // Switch to the http module
const server = http.createServer(app);

const appPort = LISTEN_PORT ?? 5006;

function serveStart() {
  logger.info(`Server started running on port: ${appPort} (${process.env.MODE})`);
}

server.listen(appPort, serveStart);
