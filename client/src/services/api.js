/**
 * NOTEX REST API Service
 * Centralized Fetch API client for communicating with the Express backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('notex_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // If response is raw XML
  if (contentType && (contentType.includes('application/xml') || contentType.includes('text/xml'))) {
    const xmlText = await response.text();
    if (!response.ok) {
      throw new Error(`XML Request failed with status ${response.status}`);
    }
    return xmlText;
  }

  // Handle JSON
  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return { success: true };
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // --- Auth Endpoints ---
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  async googleAuth(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async getMe() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updateProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // --- Notes CRUD Endpoints ---
  async getNotes(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.subject && params.subject !== 'all') query.append('subject', params.subject);
    if (params.tag) query.append('tag', params.tag);
    if (params.favorite) query.append('favorite', 'true');
    if (params.sort) query.append('sort', params.sort);
    if (params.folderId !== undefined && params.folderId !== null) query.append('folderId', params.folderId);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/notes${qs}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getNoteById(id) {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async createNote(noteData) {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData),
    });
    return handleResponse(response);
  },

  async updateNote(id, noteData) {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData),
    });
    return handleResponse(response);
  },

  async deleteNote(id) {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // --- Folders CRUD Endpoints ---
  async getFolders() {
    const response = await fetch(`${API_BASE_URL}/folders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async createFolder(folderData) {
    const response = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(folderData),
    });
    return handleResponse(response);
  },

  async updateFolder(id, folderData) {
    const response = await fetch(`${API_BASE_URL}/folders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(folderData),
    });
    return handleResponse(response);
  },

  async deleteFolder(id) {
    const response = await fetch(`${API_BASE_URL}/folders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // --- Share & Clone Endpoints ---
  async createShareLink(folderId, expiresInHours = 72) {
    const response = await fetch(`${API_BASE_URL}/share/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ folderId, expiresInHours }),
    });
    return handleResponse(response);
  },

  async getSharedRepo(shareCode) {
    const response = await fetch(`${API_BASE_URL}/share/${shareCode}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async cloneSharedRepo(shareCode) {
    const response = await fetch(`${API_BASE_URL}/share/clone/${shareCode}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // --- Stats & Subjects ---
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/notes/stats/summary`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getSubjects() {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // --- XML Export Endpoints ---
  async exportNotesXML(subject = null) {
    const query = subject && subject !== 'all' ? `?subject=${encodeURIComponent(subject)}` : '';
    const response = await fetch(`${API_BASE_URL}/notes/export/xml${query}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async exportSingleNoteXML(noteId) {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/xml`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // --- Google Drive Synchronization ---
  async syncDriveVault() {
    const response = await fetch(`${API_BASE_URL}/notes/sync-drive`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Direct XML file download trigger
  getXMLDownloadUrl(subject = null) {
    const token = localStorage.getItem('notex_token');
    const query = new URLSearchParams({ download: 'true' });
    if (subject && subject !== 'all') query.append('subject', subject);
    return `${API_BASE_URL}/notes/export/xml?${query.toString()}`;
  }
};
