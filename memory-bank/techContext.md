# Technical Context

## Technology Stack

### Runtime Environment
- **Platform**: Cloudflare Workers
- **Runtime**: V8 JavaScript engine
- **Execution Model**: Serverless edge functions
- **Global Distribution**: 200+ data centers worldwide

### Development Stack
- **Language**: TypeScript
- **Build Tool**: Wrangler CLI (Cloudflare's official tool)
- **Package Manager**: npm
- **Type Checking**: TypeScript strict mode

### Dependencies
- **Hono**: Lightweight web framework optimized for edge runtimes
  - Chosen for minimal overhead and Workers compatibility
  - Provides routing, middleware support
  - ~12KB compressed size

### External APIs
- **GitHub REST API v3**
  - Endpoint: `https://api.github.com`
  - Authentication: Personal Access Token
  - Rate Limit: 5,000 requests/hour (authenticated)

## Development Setup

### Prerequisites
1. Node.js 18+ and npm
2. Cloudflare account (free tier sufficient)
3. GitHub account with Personal Access Token
4. Wrangler CLI installed globally

### Environment Variables
```
BEARER_TOKEN    # API authentication token
GITHUB_TOKEN    # GitHub Personal Access Token
GIST_ID         # Target Gist ID
```

### Local Development
```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Type checking
npm run typecheck

# Deploy
npm run deploy
```

## Technical Constraints

### Cloudflare Workers Limits
- **CPU Time**: 10ms (free) / 50ms (paid)
- **Memory**: 128MB
- **Request Size**: 100MB
- **Subrequests**: 50 per request
- **Environment Variables**: 64 total, 5KB each

### GitHub API Constraints
- **Rate Limiting**: 5,000 req/hour authenticated
- **File Size**: 1MB per file in Gist
- **Total Files**: 300 files per Gist
- **Gist Size**: 100MB total

### Design Decisions

1. **No Database**
   - Gist serves as the data store
   - No state management needed

2. **Minimal Dependencies**
   - Only Hono framework
   - Faster cold starts
   - Reduced attack surface

3. **Raw Text Responses**
   - No JSON serialization overhead
   - Direct content delivery
   - Simpler client integration

4. **Simple Authentication**
   - Static Bearer token
   - No JWT complexity
   - Stored in environment variable

## Security Considerations

### Token Management
- Bearer token never exposed in responses
- GitHub token isolated to server-side
- Environment variables for sensitive data

### Input Validation
- Filename sanitization
- Request size limits
- Content type validation

### Error Handling
- Generic error messages to avoid info leakage
- Proper HTTP status codes
- No stack traces in production

## Performance Optimizations

### Edge Computing Benefits
- Requests handled at nearest data center
- No origin server round trips
- Built-in DDoS protection

### Caching Strategy
- GitHub responses cached when possible
- ETags for conditional requests
- Cache headers for static content

### Code Optimization
- Minimal middleware chain
- Direct response streaming
- Efficient error paths

## Monitoring & Debugging

### Cloudflare Analytics
- Request metrics
- Error rates
- Geographic distribution

### Logging Strategy
- Structured logs for debugging
- Error tracking
- Performance metrics

### Testing Approach
- Unit tests for core logic
- Integration tests for API endpoints
- Manual testing with curl scripts
