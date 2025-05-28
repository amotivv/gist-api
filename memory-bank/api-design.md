# API Design Specification

## Base URL
```
https://your-worker.workers.dev
```

## Authentication
All requests require Bearer token authentication:
```
Authorization: Bearer YOUR_TOKEN
```

## Endpoints

### 1. Get Full Gist
Retrieves the entire gist data including all files.

```
GET /api/gist
```

**Response**
- **200 OK**: JSON representation of the full gist
- **401 Unauthorized**: Invalid or missing Bearer token
- **404 Not Found**: Gist not found
- **500 Internal Server Error**: GitHub API error

**Example Request**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-worker.workers.dev/api/gist
```

### 2. Get File Content
Retrieves raw content of a specific file from the gist.

```
GET /api/gist/file/:filename
```

**Parameters**
- `filename` (path parameter): Name of the file to retrieve

**Response**
- **200 OK**: Raw text content of the file
- **401 Unauthorized**: Invalid or missing Bearer token
- **404 Not Found**: File not found in gist
- **500 Internal Server Error**: GitHub API error

**Example Request**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-worker.workers.dev/api/gist/file/notes.txt
```

**Example Response**
```
This is the raw content of notes.txt
No JSON wrapping, just the file content.
```

### 3. Update File
Updates the content of an existing file in the gist.

```
PUT /api/gist/file/:filename
```

**Parameters**
- `filename` (path parameter): Name of the file to update
- Request body: Raw text content to replace file with

**Response**
- **200 OK**: "File updated successfully"
- **400 Bad Request**: Missing request body
- **401 Unauthorized**: Invalid or missing Bearer token
- **404 Not Found**: File not found in gist
- **500 Internal Server Error**: GitHub API error

**Example Request**
```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: text/plain" \
     -d "Updated content for the file" \
     https://your-worker.workers.dev/api/gist/file/notes.txt
```

### 4. Create File
Creates a new file in the gist.

```
POST /api/gist/file/:filename
```

**Parameters**
- `filename` (path parameter): Name of the file to create
- Request body: Raw text content for the new file

**Response**
- **201 Created**: "File created successfully"
- **400 Bad Request**: Missing request body or file already exists
- **401 Unauthorized**: Invalid or missing Bearer token
- **500 Internal Server Error**: GitHub API error

**Example Request**
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: text/plain" \
     -d "Content for the new file" \
     https://your-worker.workers.dev/api/gist/file/newfile.txt
```

### 5. Delete File
Removes a file from the gist.

```
DELETE /api/gist/file/:filename
```

**Parameters**
- `filename` (path parameter): Name of the file to delete

**Response**
- **200 OK**: "File deleted successfully"
- **401 Unauthorized**: Invalid or missing Bearer token
- **404 Not Found**: File not found in gist
- **500 Internal Server Error**: GitHub API error

**Example Request**
```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-worker.workers.dev/api/gist/file/oldfile.txt
```

## Error Responses

All error responses return plain text messages with appropriate HTTP status codes:

### 400 Bad Request
```
Invalid filename
```
```
Request body is required
```
```
File already exists
```

### 401 Unauthorized
```
Missing authorization header
```
```
Invalid bearer token
```

### 404 Not Found
```
File not found
```
```
Gist not found
```

### 500 Internal Server Error
```
GitHub API error
```
```
Internal server error
```

## Request/Response Headers

### Request Headers
- `Authorization: Bearer YOUR_TOKEN` (required)
- `Content-Type: text/plain` (for PUT/POST requests)

### Response Headers
- `Content-Type: text/plain` (for all responses)
- `X-RateLimit-Remaining` (GitHub API rate limit remaining)

## Rate Limiting

The API inherits GitHub's rate limiting:
- **Authenticated requests**: 5,000 requests per hour
- Rate limit headers are passed through from GitHub

## Filename Validation

Valid filenames must:
- Be 1-255 characters long
- Contain only alphanumeric characters, dots, dashes, and underscores
- Not contain path separators (/, \)
- Not start with a dot

Examples of valid filenames:
- `notes.txt`
- `config.json`
- `my-file-2024.md`
- `data_backup.csv`

## Content Limits

- **Maximum file size**: 1MB (GitHub Gist limit)
- **Maximum request body**: 1MB
- **Maximum files per gist**: 300 (GitHub limit)

## CORS Support

The API includes CORS headers to allow browser-based access:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

## Usage Examples

### Reading a configuration file
```bash
CONFIG=$(curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-worker.workers.dev/api/gist/file/config.json)
echo "$CONFIG"
```

### Updating a log file
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "$(date): Task completed" \
  https://your-worker.workers.dev/api/gist/file/task.log
```

### Creating a new note
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "Remember to update the documentation" \
  https://your-worker.workers.dev/api/gist/file/todo-$(date +%Y%m%d).txt
