import { Link } from '@/lib/navigation';
import { fetchReviewDue } from '@/lib/api';
import { ReviewDeck } from '@/components/ReviewDeck';
import { getTranslations } from 'next-intl/server';
import { getServerAuthToken } from '@/lib/actions';
import { InnerHeader } from '@/components/InnerHeader';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
    const t = await getTranslations('review');
    const token = await getServerAuthToken();

    const initial = await fetchReviewDue(token).catch(() => ({ cards: [], totalDue: 0 }));

    return (
        <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
            <InnerHeader text={t('title')} />

            <div className="p-4 md:p-0 flex flex-col gap-5">
                <p className="text-sm-clamp text-cadet-blue">{t('subtitle')}</p>
                <ReviewDeck initialCards={initial.cards} initialTotal={initial.totalDue} />
            </div>
        </main>
    );
}
