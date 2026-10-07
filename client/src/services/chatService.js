import { api } from './apiClient.js';

export const chatService = {
  async sendMessage(tripId, message, history = []) {
    const data = await api.post('/api/v1/chat', { tripId, message, history });
    return data.reply;
  },
};