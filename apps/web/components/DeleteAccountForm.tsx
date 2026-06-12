'use client';

import { useActionState, useState } from 'react';
import { deleteAccount } from '@/lib/actions';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { useTranslations } from 'next-intl';
import { TriangleAlert } from 'lucide-react';

export function DeleteAccountForm() {
    const t = useTranslations('settings');
    const [open, setOpen] = useState(false);
    const [state, formAction, isPending] = useActionState(deleteAccount, null);

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-sm-clamp text-red-500 font-semibold hover:underline"
            >
                {t('deleteAccount')}
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 text-sm-clamp text-red-600">
                <TriangleAlert size={16} className="shrink-0 mt-0.5" />
                <p>{t('deleteWarning')}</p>
            </div>

            <form action={formAction} className="flex flex-col gap-3">
                <Input
                    label={t('deleteConfirmLabel')}
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                />

                {state?.error && (
                    <Card type="red" className="text-sm-clamp">{state.error}</Card>
                )}

                <div className="flex gap-3">
                    <Button
                        type="submit"
                        disabled={isPending}
                        loading={isPending}
                        loadingText={t('deleting')}
                        className="bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600"
                    >
                        {t('deleteConfirmCta')}
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                    >
                        {t('deleteCancel')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
