'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { generateDictoglossSession } from '@/lib/actions';
import { Button } from './Button';
import { Card } from './Card';

export function DictoglossGenerateButton() {
    const t = useTranslations('dictogloss');
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = async () => {
        setBusy(true);
        setError(null);
        try {
            await generateDictoglossSession();
            router.refresh();
        } catch {
            setError(t('generateError'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {error && <Card type="red" className="text-sm-clamp">{error}</Card>}
            <Card className="flex flex-col gap-4 items-center py-10">
                <p className="text-sm-clamp text-cadet-blue text-center max-w-sm">{t('subtitle')}</p>
                <Button onClick={generate} disabled={busy} loading={busy} loadingText={t('generating')}>
                    {t('generateButton')}
                </Button>
            </Card>
        </div>
    );
}
