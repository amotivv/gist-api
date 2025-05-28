#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

function showHelp() {
  console.log(`
GitHub Gist API - JWT Token Generator

Usage: node create-token.js [options]

Options:
  --github-token <token>   GitHub Personal Access Token (required)
  --gist-id <id>          Gist ID (optional, can be provided per request)
  --secret <secret>       JWT secret (optional, generates random if not provided)
  --expires <time>        Token expiration (default: 24h)
  --output <file>         Save token to file (optional)
  --help                  Show this help message

Examples:
  # Generate token with random secret
  node create-token.js --github-token ghp_xxxxx --gist-id 4528f20f

  # Generate token with custom secret and expiration
  node create-token.js --github-token ghp_xxxxx --secret mysecret --expires 7d

  # Save token to file
  node create-token.js --github-token ghp_xxxxx --output token.txt
`);
}

// Parse arguments
const options = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  options[key] = value;
}

if (args.includes('--help') || args.length === 0) {
  showHelp();
  process.exit(0);
}

if (!options['github-token']) {
  console.error('Error: --github-token is required');
  showHelp();
  process.exit(1);
}

// Generate random secret if not provided
const secret = options.secret || crypto.randomBytes(32).toString('hex');
const expiresIn = options.expires || '24h';

// Create JWT payload
const payload = {
  githubToken: options['github-token'],
  gistId: options['gist-id'] || undefined,
  iat: Math.floor(Date.now() / 1000)
};

// Sign the token
const token = jwt.sign(payload, secret, { expiresIn });

// Output results
console.log('\n=== JWT Token Generated ===\n');
console.log('Token:', token);
console.log('\nJWT Secret:', secret);
console.log('Expires In:', expiresIn);

if (options['gist-id']) {
  console.log('Gist ID:', options['gist-id']);
}

// Save to file if requested
if (options.output) {
  const output = {
    token,
    secret,
    expiresIn,
    gistId: options['gist-id'],
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
  console.log(`\nToken saved to: ${options.output}`);
}

console.log('\n=== Usage Instructions ===\n');
console.log('1. Set JWT_SECRET environment variable in your Cloudflare Worker:');
console.log(`   wrangler secret put JWT_SECRET`);
console.log(`   (Enter the secret: ${secret})`);

console.log('\n2. Use the token in API requests:');
console.log(`   curl -H "Authorization: Bearer ${token}" \\`);
console.log('        https://your-worker.workers.dev/api/gist/file/example.txt');

if (!options['gist-id']) {
  console.log('\n3. Since no Gist ID was provided, include it in the URL:');
  console.log('   https://your-worker.workers.dev/api/gist/{gistId}/file/example.txt');
}

console.log('\n=== Security Notes ===\n');
console.log('- Keep your JWT secret secure and never commit it to version control');
console.log('- The token contains your GitHub token, so treat it with the same security');
console.log('- Rotate tokens regularly for better security');
