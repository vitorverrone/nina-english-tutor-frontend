'use client';

import { useTransition } from 'react';
import { logout } from '@/lib/actions';
import { Button } from './Button';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LogoutButton() {
    const t = useTranslations('navbar');
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            mode="nav-button"
            onClick={() => startTransition(() => logout())}
            disabled={isPending}
            loading={isPending}
            loadingText={t('loggingOut')}
            className="hover:bg-white/50 self-end w-auto text-sm-clamp text-slate-500 font-semibold"
        >
            <LogOut /> {t('logout')}
        </Button>
    );
}
