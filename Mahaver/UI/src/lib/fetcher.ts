import apiClient from '@/api/client';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

/**
 * SWR fetcher function using axios
 */
export async function fetcher<T>(url: string): Promise<T> {
  try {
    const response = await apiClient.get<T>(url);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw {
      message: axiosError.message || 'An error occurred',
      status: axiosError.response?.status,
      details: axiosError.response?.data,
    } as ApiError;
  }
}

/**
 * POST fetcher for mutations
 */
export async function postFetcher<T>(url: string, data: unknown): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw {
      message: axiosError.message || 'An error occurred',
      status: axiosError.response?.status,
      details: axiosError.response?.data,
    } as ApiError;
  }
}

/**
 * PUT fetcher for updates
 */
export async function putFetcher<T>(url: string, data: unknown): Promise<T> {
  try {
    const response = await apiClient.put<T>(url, data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw {
      message: axiosError.message || 'An error occurred',
      status: axiosError.response?.status,
      details: axiosError.response?.data,
    } as ApiError;
  }
}

/**
 * DELETE fetcher
 */
export async function deleteFetcher<T>(url: string): Promise<T> {
  try {
    const response = await apiClient.delete<T>(url);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw {
      message: axiosError.message || 'An error occurred',
      status: axiosError.response?.status,
      details: axiosError.response?.data,
    } as ApiError;
  }
}
