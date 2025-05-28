# GitHub Gist RAG API - Project Brief

## Project Overview
A lightweight REST API that provides programmatic access to a private GitHub Gist, deployed as a Cloudflare Worker with Bearer token authentication.

## Core Requirements

### Functional Requirements
1. **CRUD Operations on Gist Files**
   - GET full gist content
   - GET individual file content (raw text)
   - PUT to update existing files
   - POST to create new files
   - DELETE to remove files

2. **Authentication**
   - Simple Bearer token authentication
   - Single static token stored in environment variables

3. **Response Format**
   - Raw text responses for GET operations
   - Minimal status messages for write operations
   - Plain text error messages

### Non-Functional Requirements
1. **Performance**
   - Low latency via Cloudflare edge network
   - Minimal dependencies for fast cold starts

2. **Security**
   - Bearer token validation on all requests
   - GitHub token stored securely in environment
   - No token exposure in responses

3. **Deployment**
   - Cloudflare Workers platform
   - Zero-downtime deployments
   - Global edge distribution

## API Endpoints

```
GET    /api/gist                    # Get full gist data
GET    /api/gist/file/:filename     # Get file content (raw text)
PUT    /api/gist/file/:filename     # Update file content
POST   /api/gist/file/:filename     # Create new file
DELETE /api/gist/file/:filename     # Delete file
```

## Success Criteria
1. All endpoints functioning with proper authentication
2. Raw text responses for seamless integration
3. Deployed and accessible via Cloudflare Workers
4. Simple to use with curl or any HTTP client
5. Reliable error handling and status codes

## Constraints
- Must use Cloudflare Workers runtime
- Minimal external dependencies
- Simple Bearer token (no JWT complexity)
- Raw text responses (no JSON wrapping for content)
