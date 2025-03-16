// src/services/calendarService.js
import axios from 'axios';

const BASE_URL = '/api';

export const calendarService = {
  async getEvents() {
    try {
      const response = await axios.get(`${BASE_URL}/events`);
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  },

  async getEventResponses(eventId) {
    try {
      const response = await axios.get(`${BASE_URL}/events/${eventId}/responses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event responses:', error);
      throw error;
    }
  },

  async respondToEvent(eventId, responseType) {
    try {
      // Generate a simple anonymous user ID for tracking responses
      // In a real app, you might want to use a more stable identifier
      const userId = `user_${Date.now()}`;
      
      const result = await axios.post(`${BASE_URL}/events/${eventId}/respond`, {
        responseType, // 'like' or 'dislike'
        userId,
        timestamp: new Date().toISOString()
      });
      return result.data;
    } catch (error) {
      console.error('Error responding to event:', error);
      throw error;
    }
  },

  async getStatistics() {
    try {
      const response = await axios.get(`${BASE_URL}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },
  
  // New methods for event metadata
  async getEventMetadata(eventId) {
    try {
      const response = await axios.get(`${BASE_URL}/events/${eventId}/metadata`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event metadata:', error);
      throw error;
    }
  },
  
  async saveEventMetadata(eventId, metadata) {
    try {
      const response = await axios.post(`${BASE_URL}/events/${eventId}/metadata`, metadata);
      return response.data;
    } catch (error) {
      console.error('Error saving event metadata:', error);
      throw error;
    }
  }
};