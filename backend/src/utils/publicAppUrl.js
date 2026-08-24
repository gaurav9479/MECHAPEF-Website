const DEFAULT_PUBLIC_APP_URL = 'https://mechapef-website.vercel.app';

export const getPublicAppUrl = () => (
    process.env.EMAIL_FRONTEND_URL || DEFAULT_PUBLIC_APP_URL
).replace(/\/$/, '');

export const toPublicEmailUrl = (value = '/') => {
    try {
        const parsed = new URL(value, getPublicAppUrl());
        return `${getPublicAppUrl()}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return `${getPublicAppUrl()}/`;
    }
};
