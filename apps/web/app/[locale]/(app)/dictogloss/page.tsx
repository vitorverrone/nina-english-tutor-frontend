import { getTranslations } from 'next-intl/server';
import { getServerAuthToken } from '@/lib/actions';
import { fetchDictoglossDaily } from '@/lib/api';
import { Card } from '@/components/Card';
import { DictoglossWorkspace } from '@/components/DictoglossWorkspace';
import { DictoglossGenerateButton } from '@/components/DictoglossGenerateButton';
import { InnerHeader } from '@/components/InnerHeader';

export const dynamic = 'force-dynamic';

export default async function DictoglossPage() {
    const token = await getServerAuthToken();
    const t = await getTranslations('dictogloss');
    const session = await fetchDictoglossDaily(token).catch(() => null);

    return (
        <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
            <InnerHeader text={t('title')} />

            <div className="p-4 md:p-0 flex flex-col gap-5">
                <p className="text-sm-clamp text-cadet-blue">{t('subtitle')}</p>

                {!session ? (
                    <Card type="red" className="text-sm-clamp">{t('loadError')}</Card>
                ) : !session.generated ? (
                    <DictoglossGenerateButton />
                ) : (
                    <DictoglossWorkspace session={session} />
                )}
            </div>
        </main>
    );
}
