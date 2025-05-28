import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Context } from './types';
import { authMiddleware } from './auth';
import { routes } from './routes';

// Create the main Hono app
const app = new Hono<{ Bindings: Context['env'] }>();

// Add CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400,
}));

// Add security headers
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000');
});

// Root endpoint
app.get('/', (c) => {
  return c.text('GitHub Gist API - Use /api/gist endpoints');
});

// Add authentication middleware for all /api routes
app.use('/api/*', authMiddleware);

// Mount routes
app.route('/', routes);

// Export for Cloudflare Workers
export default app;
