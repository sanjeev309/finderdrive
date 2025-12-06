export const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

export interface AuthToken {
    access_token: string;
    expires_in: string; // Seconds as string
    token_type: string;
    scope: string;
}

export const getAuthUrl = () => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: window.location.origin,
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        access_type: 'online',
        response_type: 'token',
        scope: SCOPES,
        include_granted_scopes: 'true',
        prompt: 'consent',
    };

    const qs = new URLSearchParams(options as any).toString();
    return `${rootUrl}?${qs}`;
};

export const parseAuthTokenFromUrl = (hash: string): AuthToken | null => {
    const cleanHash = hash.replace(/^#/, '');
    const params = new URLSearchParams(cleanHash);

    const accessToken = params.get('access_token');
    if (!accessToken) return null;

    return {
        access_token: accessToken,
        expires_in: params.get('expires_in') || '3600',
        token_type: params.get('token_type') || 'Bearer',
        scope: params.get('scope') || '',
    };
};

export const setStoredToken = (token: AuthToken) => {
    const expiresAt = Date.now() + (parseInt(token.expires_in) * 1000);
    localStorage.setItem('driveFS_auth', JSON.stringify({ ...token, expiresAt }));
};

export const getStoredToken = () => {
    const stored = localStorage.getItem('driveFS_auth');
    if (!stored) return null;

    const token = JSON.parse(stored);
    if (Date.now() > token.expiresAt) {
        localStorage.removeItem('driveFS_auth');
        return null;
    }
    return token;
};

export const clearStoredToken = () => {
    localStorage.removeItem('driveFS_auth');
};
