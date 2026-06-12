'use client';

import { useTransition } from 'react';
import { useRouter, usePathname } from '@/lib/navigation';
import { Badge } from "./Badge";
import { updateCoachLanguage } from '@/lib/actions';
import type { NativeLanguage } from '@english-teacher/shared';

const SUPPORTED: NativeLanguage[] = ['pt', 'es', 'en'];

function isSupported(value: string): value is NativeLanguage {
    return (SUPPORTED as string[]).includes(value);
}

export function LanguageSwitch({
    nativeLanguage,
    coachLanguage,
}: {
    nativeLanguage: string;
    coachLanguage: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [, startTransition] = useTransition();

    const changeLanguage = async (next: string) => {
        if (isSupported(next)) {
            try {
                await updateCoachLanguage(next);
            } catch (err) { }
        }
        startTransition(() => {
            router.replace(pathname, { locale: next });
        });
    }

    const showNativeBadge = nativeLanguage !== 'en';

    return (
        <div className="flex gap-3 items-center">
            {showNativeBadge && (
                <Badge className="uppercase" mode={coachLanguage === nativeLanguage ? 'sky' : 'transparent'} onClick={() => changeLanguage(nativeLanguage)}>
                    {nativeLanguage}
                </Badge>
            )}

            <Badge className="uppercase" mode={coachLanguage === 'en' ? 'sky' : 'transparent'} onClick={() => changeLanguage('en')}>
                EN
            </Badge>
        </div>
    );
}
