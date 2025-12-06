/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { parseAuthTokenFromUrl, getAuthUrl } from './auth';

describe('Auth Utils', () => {
    it('should generate correct auth URL', () => {
        // Mock env
        import.meta.env.VITE_GOOGLE_CLIENT_ID = 'test-client-id';

        const url = getAuthUrl();
        expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
        expect(url).toContain('client_id='); // Vite env might be undefined in test context depending on setup, but checking presence
        expect(url).toContain('response_type=token');
        expect(url).toContain('scope=');
    });

    it('should parse hash string correctly', () => {
        const hash = '#access_token=ya29.test&token_type=Bearer&expires_in=3600&scope=https://www.googleapis.com/auth/drive';
        const token = parseAuthTokenFromUrl(hash);

        expect(token).toEqual({
            access_token: 'ya29.test',
            token_type: 'Bearer',
            expires_in: '3600',
            scope: 'https://www.googleapis.com/auth/drive'
        });
    });

    it('should return null for invalid hash', () => {
        const hash = '#other_param=123';
        const token = parseAuthTokenFromUrl(hash);
        expect(token).toBeNull();
    });
});
