export interface HttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
}

export const httpClient: HttpClient = {
  async get() {
    throw new Error('HTTP client not implemented');
  },
  async post() {
    throw new Error('HTTP client not implemented');
  },
};

