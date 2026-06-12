import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@english-teacher/shared'],
};

export default withNextIntl(nextConfig);
