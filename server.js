
const express = require('express');
const path = require('path');
const app = express();

// Cloud Run provides the port via the PORT environment variable.
const port = process.env.PORT || 8080;

// Log incoming requests to help with debugging in Cloud Run logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint for Cloud Run/Google Cloud Load Balancer
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve all static files from the current directory
app.use(express.static(__dirname));

// Specifically serve index.html for the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// For SPA routing: serve index.html for any request that doesn't match a file
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Internal Server Error: index.html missing');
    }
  });
});

// Explicitly bind to 0.0.0.0 as required by Cloud Run
app.listen(port, '0.0.0.0', () => {
  console.log(`TexFlow Server is active on port ${port}`);
  console.log(`Serving files from: ${__dirname}`);
  console.log(`Process ID: ${process.pid}`);
});
