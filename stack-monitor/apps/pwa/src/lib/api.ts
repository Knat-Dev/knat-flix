// Point to your API URL - detect from current hostname or use env var
function getApiUrl(): string {
  // If we have a build-time env var, use it
  if (import.meta.env.PUBLIC_API_URL) {
    return import.meta.env.PUBLIC_API_URL;
  }
  
  // Otherwise, detect from current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If we're on stack.domain, use api.domain
    if (hostname.startsWith('stack.')) {
      return `https://api.${hostname.substring(6)}`;
    }
    // If we're on localhost, use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3006';
    }
  }
  
  // Fallback
  return 'http://localhost:3006';
}

const API_URL = getApiUrl();

// Type will be inferred from the API at runtime
// For now, we'll use a simple fetch-based client
export const api = {
  async getContainers() {
    const res = await fetch(`${API_URL}/api/containers`);
    return res.json();
  },
  async restartContainer(id: string) {
    const res = await fetch(`${API_URL}/api/containers/${id}/restart`, { method: 'POST' });
    return res.json();
  },
  async getBackups() {
    const res = await fetch(`${API_URL}/api/backups`);
    return res.json();
  },
  async createBackup() {
    const res = await fetch(`${API_URL}/api/backups`, { method: 'POST' });
    return res.json();
  },
  getBackupDownloadUrl(filename: string) {
    return `${API_URL}/api/backups/${filename}/download`;
  },
};

