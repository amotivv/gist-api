# GitHub Gist API

A lightweight REST API for interacting with GitHub Gists, deployed on Cloudflare Workers. This API provides simple CRUD operations with JWT or Bearer token authentication and returns raw text responses. Supports dynamic Gist IDs for multi-tenant usage.

## Features

- 🔐 JWT authentication with dynamic Gist IDs
- 🔑 Legacy Bearer token support for backward compatibility
- 📝 CRUD operations on Gist files
- 🌍 Global edge deployment via Cloudflare Workers
- 🚀 Minimal dependencies (Hono framework + jsonwebtoken)
- 📄 Raw text responses for easy integration
- 🔒 Secure token isolation (client token ≠ GitHub token)
- 🎯 Multi-tenant support - access any Gist with proper credentials

## API Endpoints

### Legacy Endpoints (with configured Gist ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gist` | Get full gist data (JSON) |
| GET | `/api/gist/file/:filename` | Get file content (raw text) |
| PUT | `/api/gist/file/:filename` | Update existing file |
| POST | `/api/gist/file/:filename` | Create new file |
| DELETE | `/api/gist/file/:filename` | Delete file |

### Dynamic Gist ID Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gist/:gistId` | Get full gist data (JSON) |
| GET | `/api/gist/:gistId/file/:filename` | Get file content (raw text) |
| PUT | `/api/gist/:gistId/file/:filename` | Update existing file |
| POST | `/api/gist/:gistId/file/:filename` | Create new file |
| DELETE | `/api/gist/:gistId/file/:filename` | Delete file |

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- GitHub account with Personal Access Token
- Cloudflare account (free tier works)
- A GitHub Gist to use as storage

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd github-gist-rag
```

2. Install dependencies:
```bash
npm install
```

3. Copy the example environment file:
```bash
cp .dev.vars.example .dev.vars
```

4. Edit `.dev.vars` with your values:
```
# For JWT authentication
JWT_SECRET=your-jwt-secret-here

# Optional: For legacy Bearer token support
BEARER_TOKEN=your-secret-bearer-token
GITHUB_TOKEN=ghp_your_github_token
GIST_ID=your_gist_id
```

### Local Development

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

### Generate JWT Token

```bash
# Generate a JWT token with embedded Gist ID
node cli/create-token.js --github-token ghp_xxxxx --gist-id 4528f20f

# Generate a JWT token without Gist ID (for dynamic usage)
node cli/create-token.js --github-token ghp_xxxxx

# Generate with custom secret and expiration
node cli/create-token.js --github-token ghp_xxxxx --secret mysecret --expires 7d
```

### Testing

```bash
# Using JWT with dynamic Gist ID
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8787/api/gist/GIST_ID/file/test.txt

# Using legacy Bearer token
curl -H "Authorization: Bearer your-secret-bearer-token" \
     http://localhost:8787/api/gist/file/test.txt

# Create new file with JWT
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d "Hello, World!" \
     http://localhost:8787/api/gist/GIST_ID/file/hello.txt

# Update file
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d "Updated content" \
     http://localhost:8787/api/gist/GIST_ID/file/hello.txt

# Delete file
curl -X DELETE \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8787/api/gist/GIST_ID/file/hello.txt
```

### Deployment

1. Login to Cloudflare:
```bash
wrangler login
```

2. Set production secrets:
```bash
# For JWT authentication
wrangler secret put JWT_SECRET

# Optional: For legacy Bearer token support
wrangler secret put BEARER_TOKEN
wrangler secret put GITHUB_TOKEN
wrangler secret put GIST_ID
```

3. Deploy:
```bash
npm run deploy
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT token validation | Yes (for JWT auth) |
| `BEARER_TOKEN` | Legacy Bearer token for API authentication | Optional |
| `GITHUB_TOKEN` | Default GitHub Personal Access Token | Optional |
| `GIST_ID` | Default Gist ID | Optional |

### GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select only the `gist` scope
4. Copy the token immediately

### JWT Token Generator

The `cli/create-token.js` tool helps you generate JWT tokens:

```bash
Usage: node cli/create-token.js [options]

Options:
  --github-token <token>   GitHub Personal Access Token (required)
  --gist-id <id>          Gist ID (optional, can be provided per request)
  --secret <secret>       JWT secret (optional, generates random if not provided)
  --expires <time>        Token expiration (default: 24h)
  --output <file>         Save token to file (optional)
  --help                  Show help message
```

### Security Considerations

- Never commit `.dev.vars` to version control
- Keep JWT secrets secure and rotate them regularly
- Use strong, randomly generated tokens
- JWT tokens contain GitHub tokens, treat them with same security
- Monitor GitHub API rate limits (5,000 req/hour)
- Review the `memory-bank/security-considerations.md` for detailed security practices

## Project Structure

```
github-gist-rag/
├── cli/                  # Command-line tools
│   └── create-token.js  # JWT token generator
├── memory-bank/          # Project documentation
├── src/                  # TypeScript source code
│   ├── index.ts         # Main entry point
│   ├── auth.ts          # Authentication middleware
│   ├── gist-client.ts   # GitHub API client
│   ├── jwt-utils.ts     # JWT utilities
│   ├── routes.ts        # API route handlers
│   └── types.ts         # TypeScript types
├── tests/               # Test scripts
│   └── test-api.sh      # API test suite
├── .dev.vars            # Local environment variables (gitignored)
├── wrangler.toml        # Cloudflare Workers config
└── package.json         # Dependencies and scripts
```

## Error Responses

All errors return plain text messages with appropriate HTTP status codes:

- `400` - Bad Request (invalid filename, missing body)
- `401` - Unauthorized (invalid/missing token, expired JWT)
- `404` - Not Found (file/gist not found)
- `500` - Internal Server Error

## Rate Limiting

The API inherits GitHub's rate limiting:
- Authenticated requests: 5,000/hour
- Rate limit headers are passed through in responses

## License

MIT

## Documentation

For detailed documentation, see the `memory-bank/` directory:
- `projectbrief.md` - Project requirements
- `api-design.md` - Detailed API specification
- `deployment-guide.md` - Step-by-step deployment
- `security-considerations.md` - Security best practices
