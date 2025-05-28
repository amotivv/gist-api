/**
 * Environment variables available in the Worker
 */
export interface Env {
  JWT_SECRET: string;
  // Optional fallback values for backward compatibility
  BEARER_TOKEN?: string;
  GITHUB_TOKEN?: string;
  GIST_ID?: string;
}

/**
 * JWT Token payload
 */
export interface JWTPayload {
  githubToken: string;
  gistId?: string;
  exp?: number;
  iat?: number;
}

/**
 * GitHub Gist API response types
 */
export interface GistFile {
  filename: string;
  type: string;
  language: string | null;
  raw_url: string;
  size: number;
  truncated: boolean;
  content: string;
}

export interface Gist {
  id: string;
  url: string;
  files: Record<string, GistFile>;
  public: boolean;
  created_at: string;
  updated_at: string;
  description: string | null;
  comments: number;
  owner: {
    login: string;
    id: number;
  };
}

/**
 * Request context with environment bindings
 */
export interface Context {
  env: Env;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  status: number;
}

/**
 * GitHub API error response
 */
export interface GitHubError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}
