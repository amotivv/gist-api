# Deployment Guide

## Prerequisites

### Required Accounts
1. **GitHub Account**
   - Create a Personal Access Token
   - Create a private Gist to use as storage

2. **Cloudflare Account**
   - Free tier is sufficient
   - Email verification required

### Required Tools
```bash
# Install Node.js 18+ and npm
# Then install Wrangler globally
npm install -g wrangler

# Verify installation
wrangler --version
```

## Step 1: GitHub Setup

### Create Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "Gist API Access"
4. Select scope: `gist` (full control of gists)
5. Click "Generate token"
6. **Copy and save the token immediately** (you won't see it again)

### Create a Private Gist
1. Go to https://gist.github.com
2. Create a new gist with at least one file (e.g., `README.md`)
3. Set visibility to "Secret"
4. Copy the Gist ID from the URL: `https://gist.github.com/YOUR_USERNAME/GIST_ID`

## Step 2: Local Development Setup

### Clone the Project
```bash
# Clone or create the project directory
mkdir github-gist-rag
cd github-gist-rag

# Initialize npm project
npm init -y

# Install dependencies
npm install hono
npm install -D @cloudflare/workers-types typescript wrangler

# Initialize TypeScript
npx tsc --init
```

### Configure TypeScript
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "lib": ["ES2021"],
    "types": ["@cloudflare/workers-types"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Configure Wrangler
Create `wrangler.toml`:
```toml
name = "github-gist-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { }

# Add your secrets via CLI:
# wrangler secret put BEARER_TOKEN
# wrangler secret put GITHUB_TOKEN
# wrangler secret put GIST_ID
```

## Step 3: Environment Configuration

### Set Development Secrets
Create `.dev.vars` (for local development):
```
BEARER_TOKEN=your-chosen-bearer-token
GITHUB_TOKEN=ghp_your_github_token_here
GIST_ID=your_gist_id_here
```

**Important**: Add `.dev.vars` to `.gitignore` to prevent committing secrets!

### Set Production Secrets
```bash
# Authenticate with Cloudflare
wrangler login

# Set production secrets
wrangler secret put BEARER_TOKEN
# Enter your chosen Bearer token when prompted

wrangler secret put GITHUB_TOKEN
# Enter your GitHub Personal Access Token when prompted

wrangler secret put GIST_ID
# Enter your Gist ID when prompted
```

## Step 4: Local Testing

### Start Development Server
```bash
# Run the development server
npm run dev
# or
wrangler dev

# The API will be available at http://localhost:8787
```

### Test Endpoints
```bash
# Test GET file
curl -H "Authorization: Bearer your-chosen-bearer-token" \
     http://localhost:8787/api/gist/file/README.md

# Test PUT file
curl -X PUT \
     -H "Authorization: Bearer your-chosen-bearer-token" \
     -d "Updated content" \
     http://localhost:8787/api/gist/file/test.txt

# Test POST new file
curl -X POST \
     -H "Authorization: Bearer your-chosen-bearer-token" \
     -d "New file content" \
     http://localhost:8787/api/gist/file/newfile.txt
```

## Step 5: Deploy to Production

### First Deployment
```bash
# Deploy to Cloudflare Workers
npm run deploy
# or
wrangler deploy

# You'll see output like:
# Published github-gist-api (1.23 sec)
# https://github-gist-api.YOUR-SUBDOMAIN.workers.dev
```

### Verify Deployment
```bash
# Test production endpoint
curl -H "Authorization: Bearer your-bearer-token" \
     https://github-gist-api.YOUR-SUBDOMAIN.workers.dev/api/gist/file/README.md
```

## Step 6: Custom Domain (Optional)

### Add Custom Domain
1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to "Triggers" tab
4. Click "Add Custom Domain"
5. Enter your domain (must be on Cloudflare)
6. Click "Add Custom Domain"

### Update DNS
Cloudflare will automatically configure the DNS records.

## Troubleshooting

### Common Issues

#### 1. Authentication Errors
- Verify Bearer token matches exactly
- Check authorization header format: `Authorization: Bearer TOKEN`
- Ensure secrets are set correctly

#### 2. GitHub API Errors
- Verify GitHub token has `gist` scope
- Check Gist ID is correct
- Ensure Gist exists and is accessible

#### 3. Deployment Failures
- Check wrangler is authenticated: `wrangler whoami`
- Verify all secrets are set: `wrangler secret list`
- Check build errors in console output

#### 4. CORS Issues
- API includes CORS headers by default
- For specific origins, modify CORS headers in code

### Debug Commands
```bash
# Check worker logs
wrangler tail

# List secrets (names only)
wrangler secret list

# Delete and re-add a secret
wrangler secret delete SECRET_NAME
wrangler secret put SECRET_NAME
```

## Maintenance

### Updating the Worker
```bash
# Make code changes
# Test locally
npm run dev

# Deploy updates
npm run deploy
```

### Rotating Tokens
```bash
# Update Bearer token
wrangler secret put BEARER_TOKEN

# Update GitHub token
wrangler secret put GITHUB_TOKEN
```

### Monitoring
- View metrics in Cloudflare Dashboard
- Set up alerts for error rates
- Monitor GitHub API rate limits

## Security Checklist

- [ ] Never commit `.dev.vars` or secrets
- [ ] Use strong, unique Bearer token
- [ ] Limit GitHub token scope to `gist` only
- [ ] Regularly rotate tokens
- [ ] Monitor access logs
- [ ] Keep dependencies updated

## Next Steps

1. **Set up monitoring** - Configure alerts in Cloudflare
2. **Add rate limiting** - Implement request throttling
3. **Enable analytics** - Track usage patterns
4. **Create backup** - Export Gist contents regularly
5. **Document API** - Share endpoint documentation with users
