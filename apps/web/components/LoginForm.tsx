'use client';

import { useActionState } from 'react';

import { handleLogin } from '@/lib/actions';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { useTranslations } from 'next-intl';

export function LoginForm() {
    const t = useTranslations('auth');
    const [state, formAction, isPending] = useActionState(handleLogin, null);

    return (
        <Card className="w-96 max-w-full">
            <div className="flex gap-2 flex-col mb-6">
                <h2 className="text-2xl-clamp font-serif text-dark-indigo">{t('login.title')}</h2>
                <p className="text-sm-clamp text-cadet-blue">{t('login.subtitle')}</p>
            </div>
            <form action={formAction} className="flex flex-col gap-4">
                <Input label={t('emailLabel')} name="email" type="email" placeholder="you@example.com" required defaultValue={state?.fields?.email || ''} />
                <Input label={t('passwordLabel')} name="password" type="password" placeholder="******" required />
                {state?.error && (
                    <Card type="red" className="text-sm-clamp">{state.error}</Card>
                )}
                <Button type="submit" disabled={isPending} loading={isPending} loadingText={t('login.submitting')}>
                    {t('login.submit')}
                </Button>
            </form>
        </Card>
    );
}
