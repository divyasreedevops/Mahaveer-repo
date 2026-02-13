import apiClient from './client';
import type { ApiResponse, User } from '@/types';

export const userService = {
  createUser: async (user: Partial<User>): Promise<ApiResponse<User>> => {
    if (__DEV__) console.log('[UserService] createUser - Creating user:', user.username);
    try {
      const response = await apiClient.post('/User/CreateUser', user);
      if (__DEV__) console.log('[UserService] createUser - User created successfully');
      return { success: true, data: response.data, message: response.data?.message || 'User created successfully' };
    } catch (error: any) {
      if (__DEV__) console.error('[UserService] createUser - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Username and password are required' };
      return { success: false, message: error.message || 'Failed to create user. Please try again.' };
    }
  },
};
