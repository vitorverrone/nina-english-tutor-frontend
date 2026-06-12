import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const localeCookieName: string | null =
    routing.localeCookie === false
        ? null
        : (typeof routing.localeCookie === 'object' ? routing.localeCookie.name : null) ?? 'NEXT_LOCALE';

const PUBLIC_PATHS = ['/login', '/signup'];
const LOCALE_REGEX = new RegExp(`^\\/(${routing.locales.join('|')})(\\/|$)`);

const COUNTRY_TO_LOCALE: Record<string, string> = {
    BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt',
    GW: 'pt', ST: 'pt', TL: 'pt',
    ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es',
    PE: 'es', VE: 'es', EC: 'es', GT: 'es', CU: 'es',
    BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es',
    NI: 'es', CR: 'es', PA: 'es', UY: 'es', GQ: 'es',
};

function stripLocale(pathname: string): string {
    return pathname.replace(LOCALE_REGEX, '/') || '/';
}

function extractLocale(pathname: string): string {
    const match = pathname.match(LOCALE_REGEX);
    return match?.[1] ?? routing.defaultLocale;
}

function getGeoLocale(req: NextRequest): string | null {
    const country = req.headers.get('x-vercel-ip-country') || (req as any).geo?.country;
    if (!country) return null;
    return COUNTRY_TO_LOCALE[country] ?? routing.defaultLocale;
}

function getJwtEmailVerified(token: string): boolean {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return decoded.emailVerified === true;
    } catch {
        return true;
    }
}

export function middleware(req: NextRequest) {
    const token = req.cookies.get('auth_token')?.value;
    const geoLocale = getGeoLocale(req);
    const hasLocaleCookie = localeCookieName !== null && req.cookies.has(localeCookieName);

    if (!token && geoLocale && localeCookieName !== null && !hasLocaleCookie) {
        const currentLocale = extractLocale(req.nextUrl.pathname);
        if (currentLocale !== geoLocale) {
            const pathWithoutLocale = stripLocale(req.nextUrl.pathname);
            const url = req.nextUrl.clone();
            url.pathname = geoLocale === routing.defaultLocale
                ? pathWithoutLocale
                : `/${geoLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
            const redirect = NextResponse.redirect(url);
            redirect.cookies.set(localeCookieName, geoLocale, {
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });
            return redirect;
        }
    }

    const intlResponse = intlMiddleware(req);

    if (!token && geoLocale && localeCookieName !== null && !hasLocaleCookie) {
        intlResponse.cookies.set(localeCookieName, geoLocale, {
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
    }

    const location = intlResponse.headers.get('location');
    const effectiveUrl = location ? new URL(location, req.url) : req.nextUrl;

    const locale = extractLocale(effectiveUrl.pathname);
    const pathnameWithoutLocale = stripLocale(effectiveUrl.pathname);

    const isPublic = PUBLIC_PATHS.some(
        (p) => pathnameWithoutLocale === p || pathnameWithoutLocale.startsWith(`${p}/`),
    );

    if (!token && !isPublic) {
        const url = req.nextUrl.clone();
        url.pathname = locale === routing.defaultLocale ? '/login' : `/${locale}/login`;
        url.search = '';
        return NextResponse.redirect(url);
    }

    if (token && isPublic) {
        const emailVerified = getJwtEmailVerified(token);
        const url = req.nextUrl.clone();
        url.pathname = emailVerified
            ? (locale === routing.defaultLocale ? '/' : `/${locale}`)
            : (locale === routing.defaultLocale ? '/verify-email' : `/${locale}/verify-email`);
        url.search = '';
        return NextResponse.redirect(url);
    }

    if (token) {
        const emailVerified = getJwtEmailVerified(token);
        if (!emailVerified && pathnameWithoutLocale !== '/verify-email') {
            const url = req.nextUrl.clone();
            url.pathname = locale === routing.defaultLocale ? '/verify-email' : `/${locale}/verify-email`;
            url.search = '';
            return NextResponse.redirect(url);
        }
        if (emailVerified && pathnameWithoutLocale === '/verify-email') {
            const url = req.nextUrl.clone();
            url.pathname = locale === routing.defaultLocale ? '/' : `/${locale}`;
            url.search = '';
            return NextResponse.redirect(url);
        }
    }

    return intlResponse;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
