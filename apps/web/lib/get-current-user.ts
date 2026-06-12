import { cache } from 'react';
import { fetchProfile } from './api';
import { getServerAuthToken } from './actions';

export const getCurrentUser = cache(async () => {
    const token = await getServerAuthToken();
    return fetchProfile(token).catch(() => null);
});
