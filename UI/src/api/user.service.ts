import apiClient from './client';
import type { User, ApiResponse } from '@/types';

/**
 * User service
 */
export const userService = {
  /**
   * Create a new user
   */
  async createUser(user: User): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.post('/User/CreateUser', user);
      // Backend returns: {message: "User created successfully"}
      
      return {
        success: true,
        data: user, // Return the input data as backend only confirms with message
        message: response.data.message || 'User created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create user',
      };
    }
  },
};

export default userService;
