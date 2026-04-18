import api from './api';
import { Waste } from '../types';

export const wasteService = {
  /**
   * Fetch all waste records
   * @param params Optional filter parameters
   */
  getWasteRecords: async (params?: any) => {
    return api.get<Waste[]>('/api/waste/', { params });
  },

  /**
   * Fetch summary statistics for waste
   */
  getWasteSummary: async () => {
    return api.get('/api/waste/summary/');
  },

  /**
   * Create a new waste record
   */
  createWasteRecord: async (data: Partial<Waste>) => {
    return api.post<Waste>('/api/waste/', data);
  },

  /**
   * Fetch a single waste record by ID
   */
  getWasteById: async (id: number) => {
    return api.get<Waste>(`/api/waste/${id}/`);
  }
};

export default wasteService;
