import { BookOpen } from "lucide-react";
import Link from "next/link";
import { SignupForm } from "@/components/SignUpForm";
import { useTranslations } from "next-intl";

export default function SignupPage() {
    const t = useTranslations('');

    return (
        <main className="mx-auto px-6 py-16 flex flex-col items-center">
            <div className="flex flex-col gap-2 mb-8">
                <BookOpen className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl-clamp text-center font-serif text-dark-indigo">{t('common.appTitle')}</h1>
                <p className="text-cadet-blue text-center">{t('common.appDescription')}</p>
            </div>

            <SignupForm />

            <p className="text-center text-sm-clamp text-cadet-blue mt-6">
                {t('auth.signup.switchQuestion')}{' '}
                <Link href="/login" className="text-primary font-bold">
                    {t('auth.signup.switchCta')}
                </Link>
            </p>
        </main>
    );
}

export { authMetadata as metadata } from '@/lib/metadata';
