import { redirect } from 'next/navigation';
import { fetchPromotionEligibility } from '@/lib/api';
import { PromotionExamUI } from '@/components/PromotionExamUI';
import { getServerAuthToken } from '@/lib/actions';
import { getTranslations } from 'next-intl/server';
import { InnerHeader } from '@/components/InnerHeader';
import { Card } from '@/components/Card';
import { Link } from '@/lib/navigation';

export const dynamic = 'force-dynamic';

export default async function LevelUpPage() {
    const token = await getServerAuthToken();
    const eligibility = await fetchPromotionEligibility(token).catch(() => null);

    const t = await getTranslations('promotion');

    if (eligibility?.reason === 'promotion_used') {
        return (
            <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
                <InnerHeader text={t('exam.intro')} />
                <div className="p-4 md:p-0 flex flex-col gap-5">
                    <Card type="amber" className="flex flex-col gap-2">
                        <p className="font-semibold">{t('locked.title')}</p>
                        <p className="text-sm-clamp text-cadet-blue">{t('locked.body')}</p>
                    </Card>
                    <Link href="/" className="text-sm-clamp text-primary">{t('locked.backHome')}</Link>
                </div>
            </main>
        );
    }

    if (!eligibility?.eligible || !eligibility.nextLevel) {
        redirect('/');
    }

    return (
        <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
            <InnerHeader text={t('exam.intro')} />

            <div className="p-4 md:p-0 flex flex-col gap-5">
                <p className="text-sm-clamp text-cadet-blue">{t('exam.title', { target: eligibility.nextLevel })}</p>
                <PromotionExamUI targetLevel={eligibility.nextLevel} />
            </div>
        </main>
    );
}
