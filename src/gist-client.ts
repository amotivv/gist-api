import { Gist, GistFile, GitHubError, Env } from './types';

/**
 * Client for interacting with GitHub Gist API
 */
export class GistClient {
  private readonly baseUrl = 'https://api.github.com';
  private readonly gistId: string;
  private readonly headers: HeadersInit;

  constructor(githubToken: string, gistId: string) {
    this.gistId = gistId;
    this.headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'github-gist-api-worker',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  /**
   * Get the full gist data
   */
  async getGist(): Promise<Gist> {
    const response = await fetch(`${this.baseUrl}/gists/${this.gistId}`, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const gist = await response.json() as Gist;
    
    // Pass through rate limit headers
    const rateLimitHeaders = this.extractRateLimitHeaders(response);
    
    return { ...gist, _rateLimitHeaders: rateLimitHeaders } as any;
  }

  /**
   * Get a specific file from the gist
   */
  async getFile(filename: string): Promise<{ content: string; headers: Record<string, string> }> {
    const gist = await this.getGist();
    const file = gist.files[filename];

    if (!file) {
      throw new Error('File not found');
    }

    // For large files, GitHub may truncate content and provide a raw_url
    if (file.truncated && file.raw_url) {
      const rawResponse = await fetch(file.raw_url, {
        headers: {
          'User-Agent': 'github-gist-api-worker'
        }
      });

      if (!rawResponse.ok) {
        throw new Error('Failed to fetch file content');
      }

      const content = await rawResponse.text();
      return { 
        content, 
        headers: (gist as any)._rateLimitHeaders || {}
      };
    }

    return { 
      content: file.content, 
      headers: (gist as any)._rateLimitHeaders || {}
    };
  }

  /**
   * Update a file in the gist
   */
  async updateFile(filename: string, content: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/gists/${this.gistId}`, {
      method: 'PATCH',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [filename]: {
            content
          }
        }
      })
    });

    if (!response.ok) {
      await this.handleError(response);
    }
  }

  /**
   * Create a new file in the gist
   */
  async createFile(filename: string, content: string): Promise<void> {
    // First check if file already exists
    const gist = await this.getGist();
    if (gist.files[filename]) {
      throw new Error('File already exists');
    }

    const response = await fetch(`${this.baseUrl}/gists/${this.gistId}`, {
      method: 'PATCH',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [filename]: {
            content
          }
        }
      })
    });

    if (!response.ok) {
      await this.handleError(response);
    }
  }

  /**
   * Delete a file from the gist
   */
  async deleteFile(filename: string): Promise<void> {
    // First check if file exists
    const gist = await this.getGist();
    if (!gist.files[filename]) {
      throw new Error('File not found');
    }

    const response = await fetch(`${this.baseUrl}/gists/${this.gistId}`, {
      method: 'PATCH',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [filename]: null
        }
      })
    });

    if (!response.ok) {
      await this.handleError(response);
    }
  }

  /**
   * Extract rate limit headers from GitHub API response
   */
  private extractRateLimitHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    const rateLimitHeaders = [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-RateLimit-Used',
      'X-RateLimit-Resource'
    ];

    rateLimitHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    return headers;
  }

  /**
   * Handle GitHub API errors
   */
  private async handleError(response: Response): Promise<never> {
    let errorMessage = 'GitHub API error';

    try {
      const errorData = await response.json() as GitHubError;
      if (errorData.message) {
        // Log detailed error for debugging
        console.error('GitHub API error:', errorData);
        
        // Return generic message to client
        if (response.status === 404) {
          errorMessage = 'Gist not found';
        } else if (response.status === 401) {
          errorMessage = 'GitHub authentication failed';
        } else if (response.status === 403) {
          errorMessage = 'GitHub API rate limit exceeded';
        }
      }
    } catch {
      // If we can't parse the error, use the status code
      errorMessage = `GitHub API error: ${response.status}`;
    }

    throw new Error(errorMessage);
  }
}
