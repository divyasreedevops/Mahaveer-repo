import apiClient from './client';
import type { ApiResponse, User } from '@/types';

export const userService = {
  createUser: async (user: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const response = await apiClient.post('/User/CreateUser', user);
      return { success: true, data: response.data, message: response.data?.message || 'User created successfully' };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Username and password are required' };
      return { success: false, message: error.message || 'Failed to create user. Please try again.' };
    }
  },
};
