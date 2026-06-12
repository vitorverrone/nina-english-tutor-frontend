'use client';

import { useActionState } from 'react';
import { handleSignup } from '@/lib/actions';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { useTranslations } from 'next-intl';

export function SignupForm() {
    const t = useTranslations('auth');
    const [state, formAction, isPending] = useActionState(handleSignup, null);

    return (
        <Card className="w-96 max-w-full">
            <div className="flex gap-2 flex-col mb-6">
                <h2 className="text-2xl-clamp font-serif text-dark-indigo">{t('signup.title')}</h2>
                <p className="text-sm-clamp text-cadet-blue">{t('signup.subtitle')}</p>
            </div>
            <form action={formAction} className="flex gap-4 flex-col">
                <Input label={t('nameLabel')} name="fullname" type="text" placeholder="Nina Silva" required defaultValue={state?.fields?.fullname || ''} />
                <Input label={t('emailLabel')} name="email" type="email" placeholder="nina.silva@example.com" required defaultValue={state?.fields?.email || ''} />
                <Input label={t('passwordLabel')} name="password" type="password" placeholder="••••••••" required />

                {state?.error && (
                    <Card type="red" className="text-sm-clamp">{state.error}</Card>
                )}
                <Button type="submit" disabled={isPending} loading={isPending} loadingText={t('signup.submitting')}>
                    {t('signup.submit')}
                </Button>
            </form>
        </Card>
    );
}
