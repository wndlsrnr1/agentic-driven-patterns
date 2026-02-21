import axios from 'axios';
import { clientSettings } from '@/config/settings';

export const axiosInstance = axios.create({
  baseURL: clientSettings.apiBaseUrl,
  timeout: clientSettings.httpTimeoutMs,
});

export default axiosInstance;
