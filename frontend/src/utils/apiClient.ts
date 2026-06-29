import axios from 'axios';

// Ensure you replace this with your actual local network IP or backend domain
// For Android emulator it is typically 10.0.2.2, for iOS simulator it's localhost or 127.0.0.1
const API_URL = 'http://127.0.0.1:5000/api'; 

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Optionally add interceptors for auth tokens here
apiClient.interceptors.request.use((config) => {
  // const token = await SecureStore.getItemAsync('token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});
