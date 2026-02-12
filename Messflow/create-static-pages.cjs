const fs = require('fs');
const path = require('path');

// Create directories
const distDir = path.join(__dirname, 'dist');
const privacyDir = path.join(distDir, 'privacy-policy');
const termsDir = path.join(distDir, 'terms');

if (!fs.existsSync(privacyDir)) {
  fs.mkdirSync(privacyDir, { recursive: true });
}

if (!fs.existsSync(termsDir)) {
  fs.mkdirSync(termsDir, { recursive: true });
}

// Privacy Policy HTML
const privacyHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MessFlow - Privacy Policy</title>
    <meta name="description" content="Privacy Policy for MessFlow mess management application" />
    <meta name="robots" content="index, follow" />
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        min-height: 100vh;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 1rem;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .nav-links {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      .nav-links a {
        color: #334155;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        transition: background-color 0.2s;
      }
      .nav-links a:hover {
        background-color: #f8fafc;
      }
      .content {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        margin-top: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      h1 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #1e293b;
      }
      .subtitle {
        color: #64748b;
        margin-bottom: 2rem;
      }
      .section {
        margin-bottom: 2rem;
      }
      .section h2 {
        font-size: 1.25rem;
        margin-bottom: 1rem;
        color: #334155;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
      }
      @media (max-width: 768px) {
        .container {
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="container">
        <div class="nav-links">
          <a href="/">&#8592; Back to Dashboard</a>
          <a href="/terms">Terms of Service</a>
          <a href="/login">Sign In</a>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="content">
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1>Privacy Policy</h1>
          <p class="subtitle">Last updated: December 2025</p>
        </div>

        <div class="section">
          <h2>Overview</h2>
          <p>At MessFlow, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mess management application.</p>
        </div>

        <div class="section">
          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <p><strong>Email:</strong> privacy@imexglobals.com</p>
          <p><strong>WhatsApp:</strong> +971 50 123 4567</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

// Terms HTML
const termsHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MessFlow - Terms of Service</title>
    <meta name="description" content="Terms of Service for MessFlow mess management application" />
    <meta name="robots" content="index, follow" />
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        min-height: 100vh;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 1rem;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .nav-links {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      .nav-links a {
        color: #334155;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        transition: background-color 0.2s;
      }
      .nav-links a:hover {
        background-color: #f8fafc;
      }
      .content {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        margin-top: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      h1 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #1e293b;
      }
      .subtitle {
        color: #64748b;
        margin-bottom: 2rem;
      }
      .section {
        margin-bottom: 2rem;
      }
      .section h2 {
        font-size: 1.25rem;
        margin-bottom: 1rem;
        color: #334155;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
      }
      @media (max-width: 768px) {
        .container {
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="container">
        <div class="nav-links">
          <a href="/">&#8592; Back to Dashboard</a>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/login">Sign In</a>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="content">
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1>Terms of Service</h1>
          <p class="subtitle">Last updated: December 2025</p>
        </div>

        <div class="section">
          <h2>Acceptance of Terms</h2>
          <p>By accessing or using MessFlow ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</p>
        </div>

        <div class="section">
          <h2>Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <p><strong>Email:</strong> support@imexglobals.com</p>
          <p><strong>WhatsApp:</strong> +971 50 123 4567</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

// Write files
fs.writeFileSync(path.join(privacyDir, 'index.html'), privacyHTML);
fs.writeFileSync(path.join(termsDir, 'index.html'), termsHTML);

console.log('✅ Static pages created successfully!');