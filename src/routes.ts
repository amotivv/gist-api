import { Hono } from 'hono';
import { Context, JWTPayload } from './types';
import { GistClient } from './gist-client';
import { validateFilename } from './auth';

type ExtendedContext = Context & { jwtPayload?: JWTPayload };

export const routes = new Hono<{ Bindings: ExtendedContext['env'] }>();

/**
 * Helper to get GitHub token and Gist ID from context
 */
function getCredentials(c: any, urlGistId?: string): { githubToken: string; gistId: string } {
  // If JWT payload exists, use it
  if (c.jwtPayload) {
    const gistId = urlGistId || c.jwtPayload.gistId;
    if (!gistId) {
      throw new Error('Gist ID not provided');
    }
    return {
      githubToken: c.jwtPayload.githubToken,
      gistId
    };
  }

  // Fall back to environment variables
  if (!c.env.GITHUB_TOKEN || !c.env.GIST_ID) {
    throw new Error('GitHub credentials not configured');
  }
  
  return {
    githubToken: c.env.GITHUB_TOKEN,
    gistId: urlGistId || c.env.GIST_ID
  };
}

/**
 * GET /api/gist - Get full gist data (legacy route)
 */
routes.get('/api/gist', async (c) => {
  try {
    const { githubToken, gistId } = getCredentials(c);
    const client = new GistClient(githubToken, gistId);
    const gist = await client.getGist();
    
    // Remove internal rate limit headers before sending
    const { _rateLimitHeaders, ...gistData } = gist as any;
    
    // Add rate limit headers to response
    if (_rateLimitHeaders) {
      Object.entries(_rateLimitHeaders).forEach(([key, value]) => {
        c.header(key, value as string);
      });
    }
    
    return c.json(gistData);
  } catch (error) {
    console.error('Error fetching gist:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return c.text(message, status);
  }
});

/**
 * GET /api/gist/:gistId - Get full gist data with dynamic Gist ID
 */
routes.get('/api/gist/:gistId', async (c) => {
  try {
    const urlGistId = c.req.param('gistId');
    const { githubToken, gistId } = getCredentials(c, urlGistId);
    const client = new GistClient(githubToken, gistId);
    const gist = await client.getGist();
    
    // Remove internal rate limit headers before sending
    const { _rateLimitHeaders, ...gistData } = gist as any;
    
    // Add rate limit headers to response
    if (_rateLimitHeaders) {
      Object.entries(_rateLimitHeaders).forEach(([key, value]) => {
        c.header(key, value as string);
      });
    }
    
    return c.json(gistData);
  } catch (error) {
    console.error('Error fetching gist:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return c.text(message, status);
  }
});

/**
 * GET /api/gist/file/:filename - Get file content (legacy route)
 */
routes.get('/api/gist/file/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  if (!filename || !validateFilename(filename)) {
    return c.text('Invalid filename', 400);
  }

  try {
    const { githubToken, gistId } = getCredentials(c);
    const client = new GistClient(githubToken, gistId);
    const { content, headers } = await client.getFile(filename);
    
    // Add rate limit headers to response
    Object.entries(headers).forEach(([key, value]) => {
      c.header(key, value);
    });
    
    // Return raw text content
    return c.text(content);
  } catch (error) {
    console.error('Error fetching file:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return c.text(message, status);
  }
});

/**
 * GET /api/gist/:gistId/file/:filename - Get file content with dynamic Gist ID
 */
routes.get('/api/gist/:gistId/file/:filename', async (c) => {
  const urlGistId = c.req.param('gistId');
  const filename = c.req.param('filename');
  
  if (!filename || !validateFilename(filename)) {
    return c.text('Invalid filename', 400);
  }

  try {
    const { githubToken, gistId } = getCredentials(c, urlGistId);
    const client = new GistClient(githubToken, gistId);
    const { content, headers } = await client.getFile(filename);
    
    // Add rate limit headers to response
    Object.entries(headers).forEach(([key, value]) => {
      c.header(key, value);
    });
    
    // Return raw text content
    return c.text(content);
  } catch (error) {
    console.error('Error fetching file:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return c.text(message, status);
  }
});

/**
 * PUT /api/gist/file/:filename - Update file content (legacy route)
 */
routes.put('/api/gist/file/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  if (!filename || !validateFilename(filename)) {
    return c.text('Invalid filename', 400);
  }

  const body = await c.req.text();
  if (!body) {
    return c.text('Request body is required', 400);
  }

  try {
    const { githubToken, gistId } = getCredentials(c);
    const client = new GistClient(githubToken, gistId);
    await client.updateFile(filename, body);
    return c.text('File updated successfully');
  } catch (error) {
    console.error('Error updating file:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return c.text(message, status);
  }
});

/**
 * PUT /api/gist/:gistId/file/:filename - Update file with dynamic Gist ID
 */
routes.put('/api/gist/:gistId/file/:filename', async (c) => {
  const urlGistId = c.req.param('gistId');
  const filename = c.req.param('filename');
  
  if (!filename || !validateFilename(filename)) {
    return c.text('Invalid filename', 400);
  }

  const body = await c.req.text();
  if (!body) {
    return c.text('Request body is required', 400);
  }

  try {
    const { githubToken, gistId } = getCredentials(c, urlGistId);
    const client = new GistClient(githubToken, gistId);
    await client.updateFile(filename, body);
    return c.text('File updated successfully');
  } catch (error) {
    console.error('Error updating file:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return c.text(message, status);
  }
});

/**
 * POST /api/gist/file/:filename - Create new file (legacy route)
 */
routes.post('/api/gist/file/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  if (!filename || !validateFilename(filename)) {
    return c.text('Invalid filename', 400);
  }

  const body = await c.req.text();
  if (!body) {
    return c.text('Request body is required', 400);
  }

  try {
    const { githubToken, gistId } = getCredentials(c);
    const client = new GistClient(githubToken, gistId);
    await client.createFile(filename, body);
    return c.text('File created successfully', 201);
  } catch (error) {
    console.error('Error creating file:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('already exists') ? 400 : 500;
    return c.text(message, status);
  }
});

/**
 * POST /api/gist/:gistId/file/:filename - Create file with dynamic Gist ID
 */
routes.post('/api/gist/:gistId/file/:filename', async (c) => {
  const urlGistId = c.req.param('gistId');
  const filename = c.req.param('filename');
  
  if (!filename || !validateFilename(filename)) {
    return c.text('Invalid filename', 400);
  }

  const body = await c.req.text();
  if (!body) {
    return c.text('Request body is required', 400);
  }

  try {
    const { githubToken, gistId } = getCredentials(c, urlGistId);
    const client = new GistClient(githubToken, gistId);
    await client.createFile(filename, body);
    return c.text('File created successfully', 201);
  } catch (error) {
    console.error('Error creating file:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('already exists') ? 400 : 500;
    return c.text(message, status);
  }
});

/**
 * DELETE /api/gist/file/:filename - Delete file (legacy route)
 */
routes.delete('/api/gist/file/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  if (!filename || !validateFilename(filename)) {
    return c.text('Invalid filename', 400);
  }

  try {
    const { githubToken, gistId } = getCredentials(c);
    const client = new GistClient(githubToken, gistId);
    await client.deleteFile(filename);
    return c.text('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return c.text(message, status);
  }
});

/**
 * DELETE /api/gist/:gistId/file/:filename - Delete file with dynamic Gist ID
 */
routes.delete('/api/gist/:gistId/file/:filename', async (c) => {
  const urlGistId = c.req.param('gistId');
  const filename = c.req.param('filename');
  
  if (!filename || !validateFilename(filename)) {
    return c.text('Invalid filename', 400);
  }

  try {
    const { githubToken, gistId } = getCredentials(c, urlGistId);
    const client = new GistClient(githubToken, gistId);
    await client.deleteFile(filename);
    return c.text('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return c.text(message, status);
  }
});
