# Legacy API & State Mapping Rules

## API Mapping

| Legacy Feature | Legacy Endpoint | New Endpoint (Vite Proxy) | New Service Module |
| :--- | :--- | :--- | :--- |
| Transcription | `/api/v1/stt/sessions` | `/api/v1/stt/sessions` | `services/gemini/transcriptionService.ts` |
| Auth | `/api/v1/auth/login` | `/api/v1/auth/login` | `api/modules/auth.ts` |
| Minutes | `/api/v1/minutes` | `/api/v1/minutes` | `api/modules/minutes.ts` |

## Code Transformation Patterns

### Legacy (Direct Axios)
```typescript
const response = await axiosInstance.get('/api/v1/users/me/profile');
return response.data;
```

### New (Facade Service)
```typescript
// api/modules/user.ts
export const getUserProfile = () => axiosInstance.get('/users/me/profile');

// services/userService.ts
import * as userApi from '../api/modules/user';
export const userService = {
  getProfile: async () => {
    const { data } = await userApi.getUserProfile();
    return data;
  }
};
```

## State Mapping
- **Legacy**: Often used `localStorage` for everything.
- **New**: Use `localStorage` only for tokens. Use React state or `types.ts` for domain objects.
