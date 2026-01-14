import axios from 'axios';

// ✅ CORRECTED: Points to your live Render backend
const LIVE_BACKEND_URL = 'https://mindscribe-api-8laf.onrender.com';

const apiClient = axios.create({
  baseURL: LIVE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // 1. Check Health
  checkHealth: () => apiClient.get('/'),

  // 2. Entries
  getEntries: (userId) => apiClient.get(`/entries/${userId}`),
  createEntry: (userId, content) => apiClient.post('/entries/', {
    user_id: userId,
    content: content
  }),
  deleteEntry: (id) => apiClient.delete(`/entries/${id}`),

  // 3. Batch Analysis (AI)
  analyzeBatch: (entryIds) => apiClient.post('/analyze/batch/', {
    entry_ids: entryIds
  }),

  // 4. Goals
  getGoals: (userId) => apiClient.get(`/goals/${userId}`),
  createGoal: (userId, title) => apiClient.post('/goals/', {
    user_id: userId,
    title: title
  }),
  deleteGoal: (id) => apiClient.delete(`/goals/${id}`),

  // 5. Chat (Therapist)
  chat: (message, context) => apiClient.post('/chat/', {
    message: message,
    context: context
  })
};