import { BookOpen } from 'lucide-react';
import { cookies } from 'next/headers';
import { VerifyEmailForm } from '@/components/VerifyEmailForm';

function decodeJwtEmail(token: string): string | null {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
        return decoded.email ?? null;
    } catch {
        return null;
    }
}

export default async function VerifyEmailPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const email = token ? decodeJwtEmail(token) : null;

    return (
        <main className="mx-auto px-6 py-16 flex flex-col items-center">
            <div className="flex flex-col gap-2 mb-8">
                <BookOpen className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl-clamp text-center font-serif text-dark-indigo">English Tutor</h1>
            </div>
            <VerifyEmailForm email={email} />
        </main>
    );
}

export { authMetadata as metadata } from '@/lib/metadata';
