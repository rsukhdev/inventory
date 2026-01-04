
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

// Serve all static files from the current directory
app.use(express.static(__dirname));

// Specifically serve index.html for the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// For SPA routing: serve index.html for any request that doesn't match a file
// This is critical for React Router/internal navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Explicitly bind to 0.0.0.0 as required by Cloud Run
app.listen(port, '0.0.0.0', () => {
  console.log(`TexFlow Server is active on port ${port}`);
  console.log(`Serving files from: ${__dirname}`);
});
