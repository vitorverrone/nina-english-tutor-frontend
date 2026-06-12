'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { handleVerifyEmail, handleResendVerification } from '@/lib/actions';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { useTranslations } from 'next-intl';

const RESEND_COOLDOWN = 60;

export function VerifyEmailForm({ email }: { email: string | null }) {
    const t = useTranslations('auth.verify');
    const [state, formAction, isPending] = useActionState(handleVerifyEmail, null);
    const [countdown, setCountdown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendError, setResendError] = useState<string | null>(null);
    const [resendSent, setResendSent] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    function startCountdown() {
        setCountdown(RESEND_COOLDOWN);
        timerRef.current = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
    }

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    async function onResend() {
        setResendError(null);
        setResendSent(false);
        setResendLoading(true);
        try {
            const result = await handleResendVerification();
            if (result?.success) {
                setResendSent(true);
                startCountdown();
            } else {
                setResendError(result?.error ?? 'Error');
            }
        } finally {
            setResendLoading(false);
        }
    }

    return (
        <Card className="w-96 max-w-full">
            <div className="flex flex-col gap-2 mb-6">
                <h2 className="text-2xl-clamp font-serif text-dark-indigo">{t('title')}</h2>
                <p className="text-sm-clamp text-cadet-blue">
                    {email ? t('subtitleEmail', { email }) : t('subtitle')}
                </p>
            </div>

            <form action={formAction} className="flex flex-col gap-4">
                <Input
                    label={t('codeLabel')}
                    name="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    required
                    autoComplete="one-time-code"
                />

                {state?.error && (
                    <Card type="red" className="text-sm-clamp">{state.error}</Card>
                )}
                {resendError && (
                    <Card type="red" className="text-sm-clamp">{resendError}</Card>
                )}
                {resendSent && (
                    <Card type="green" className="text-sm-clamp">{t('resendSent')}</Card>
                )}

                <Button type="submit" disabled={isPending} loading={isPending} loadingText={t('submitting')}>
                    {t('submit')}
                </Button>
            </form>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={onResend}
                    disabled={countdown > 0 || resendLoading}
                    className="text-sm-clamp text-primary disabled:text-cadet-blue disabled:cursor-not-allowed"
                >
                    {resendLoading ? t('resendLoading') : countdown > 0 ? t('resendIn', { seconds: countdown }) : t('resend')}
                </button>
            </div>
        </Card>
    );
}
