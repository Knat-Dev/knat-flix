// Point to your API URL
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3006';

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

