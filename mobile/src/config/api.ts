import { Platform } from 'react-native';
import { setApiBaseUrl } from '../../../shared/services/aiChatService';

/**
 * Configure the API base URL for the React Native app. Update the values below
 * to point to your local development server or production deployment.
 */

const LOCAL_ANDROID = 'http://10.0.2.2:5000';
const LOCAL_IOS = 'http://localhost:5000';
const PRODUCTION_API = 'https://tranquiloo-app-production-url.com';

const API_BASE_URL = __DEV__
  ? Platform.select({ android: LOCAL_ANDROID, ios: LOCAL_IOS, default: LOCAL_IOS })!
  : PRODUCTION_API;

setApiBaseUrl(API_BASE_URL);

export { API_BASE_URL };
