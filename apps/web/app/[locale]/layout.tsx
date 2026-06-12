import '../globals.css'
import type { Metadata } from 'next';
import { DM_Serif_Display, DM_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import NextTopLoader from 'nextjs-toploader';
import { ExamReadyToast } from '@/components/ExamReadyToast';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: ['400'], variable: '--font-dm-serif', display: 'swap' });

export const metadata: Metadata = {
    title: 'English Tutor',
    description: 'AI English tutor',
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    if (!routing.locales.includes(locale as any)) notFound();
    setRequestLocale(locale);

    const messages = await getMessages();

    return (
        <html lang={locale} className="h-full">
            <body className={`${dmSans.variable} ${dmSerif.variable} h-full`}>
                <NextTopLoader color="#0EA5E9" height={3} showSpinner={false} />
                <NextIntlClientProvider messages={messages}>
                    {children}
                    <ExamReadyToast />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}
