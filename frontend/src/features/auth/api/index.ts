import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/utils/apiClient';

export const useAuthLogin = () => {
  return useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await apiClient.post('/auth/login', credentials);
      return data;
    },
  });
};
