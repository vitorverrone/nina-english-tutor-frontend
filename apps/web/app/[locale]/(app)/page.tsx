import { redirect } from "next/navigation";
import { ChevronRight, X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Link } from "@/lib/navigation";

import { fetchDashboard, fetchPromotionEligibility, fetchTopics } from "@/lib/api";
import { getServerAuthToken } from "@/lib/actions";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { TopicGrid } from "@/components/TopicGrid";
import { getCurrentUser } from "@/lib/get-current-user";

export const dynamic = 'force-dynamic';

export default async function Page() {
    const token = await getServerAuthToken();
    const profile = await getCurrentUser();

    if (profile && !profile.onboardingCompleted) {
        redirect('/onboarding');
    }

    const t = await getTranslations('');

    const [topics, dashboard, eligibility] = await Promise.all([
        fetchTopics(token).catch(() => []),
        fetchDashboard(token).catch(() => null),
        fetchPromotionEligibility(token).catch(() => null),
    ]);

    return (
        <main className="mx-auto px-4 py-4 md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col gap-5">
            <header className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="font-serif text-4xl-clamp">
                        {t('common.greeting', { name: profile?.name?.split(' ')[0] || '' })}
                    </h1>
                    <p className="text-sm-clamp">
                        {t('home.keepStreak')}
                    </p>
                </div>
            </header>

            {dashboard && (
                <Card className="p-0">
                    <div className="grid grid-cols-4">
                        <div className="p-4 flex flex-col gap-1 items-center border-pale-blue border-r">
                            <p className="text-2xl-clamp font-bold text-dark-indigo tabular-nums">{dashboard.streak}</p>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-cadet-blue text-center">{t('home.streakHint')}</p>
                        </div>
                        <div className="p-4 flex flex-col gap-1 items-center border-pale-blue border-r">
                            <p className="text-2xl-clamp font-bold text-dark-indigo tabular-nums">{dashboard.topicsCompleted}</p>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-cadet-blue text-center">{t('home.topicsCompleted')}</p>
                        </div>
                        <Link href="/review" className="p-4 flex flex-col gap-1 group items-center border-pale-blue border-r transition-all bg-sky-50 hover:bg-sky-100">
                            <p className="text-2xl-clamp font-bold text-primary transition-colors tabular-nums">{dashboard.reviewDue}</p>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-cadet-blue flex items-center gap-0.5 text-center">
                                {t('home.reviewToday')}
                            </p>
                        </Link>
                        <div className="p-4 flex flex-col gap-1 items-center">
                            <p className="text-2xl-clamp font-bold text-dark-indigo tabular-nums">{dashboard.activeVocab}</p>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-cadet-blue text-center">{t('home.activeVocab')}</p>
                        </div>
                    </div>
                </Card>
            )}

            {eligibility?.eligible && eligibility.nextLevel && (
                <Link href="/level-up">
                    <Card type="green" className="flex flex-row justify-between items-center" link={true}>
                        <div className="flex flex-col gap-2">
                            <p className="text-xs uppercase font-bold">
                                {eligibility.cefrReadyForPromotion
                                    ? t('promotion.card.perfReadyTag')
                                    : t('promotion.card.eligibleTag')}
                            </p>
                            <p className="text-lg !text-black">
                                {eligibility.cefrReadyForPromotion
                                    ? t('promotion.card.perfReadyTitle', { next: eligibility.nextLevel })
                                    : t('promotion.card.eligibleTitle', { next: eligibility.nextLevel })}
                            </p>
                        </div>
                        <ChevronRight className="shrink-0" />
                    </Card>
                </Link>
            )}

            {dashboard && dashboard.topErrorCategories.length > 0 && (
                <Card>
                    <p className="font-serif text-2xl-clamp">
                        {t('home.recurringErrors')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {dashboard.topErrorCategories.map((c: { category: string; count: number }, index: number) => {
                            const label = t(`home.errorCategory.${c.category}`);
                            return (
                                <Badge key={index} mode={c.count > 2 ? 'danger' : c.count > 1 ? 'warn' : 'default'}>
                                    {label}
                                    <p className="flex items-center leading-[1px]">
                                        <X size={11} />{c.count}
                                    </p>
                                </Badge>
                            );
                        })}
                    </div>
                </Card>
            )}

            {dashboard && dashboard.recentCulturalNotes.length > 0 && (
                <Link href="/cultural">
                    <Card className="flex flex-col gap-3" link={true}>
                        <div className="flex justify-between items-center">
                            <span className="font-serif text-2xl-clamp">
                                {t('home.recentCultural')}
                            </span>
                            <span className="text-primary flex items-center gap-1">
                                {t('home.seeAll')} <ChevronRight size={16} />
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-flow-col md:auto-cols-fr gap-3">
                            {dashboard.recentCulturalNotes.slice(0, 2).map((n: { tag?: string | null; title: string; noteL1: string }, index: number) => (
                                <div key={index} className="flex flex-col gap-1.5 rounded-xl bg-blue-grey border border-pale-blue p-3">
                                    {n.tag && <span className="text-[10px] font-bold uppercase tracking-widest text-cadet-blue">{n.tag}</span>}
                                    <p className="text-sm-clamp font-bold text-dark-indigo">{n.title}</p>
                                    <p className="text-sm-clamp text-cadet-blue">{n.noteL1}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Link>
            )}

            {dashboard?.continueTopic && (
                <Link href={`/chat/${dashboard?.continueTopic?.topicId}`}>
                    <Card type="amber" link={true} className="flex flex-row justify-between items-center">
                        <div className="flex flex-col gap-2">
                            <p className="text-xs uppercase font-bold">
                                {t('home.continueWhere')}
                            </p>
                            <p className="flex justify-between items-center text-lg !text-black">
                                {dashboard?.continueTopic?.title}

                            </p>
                        </div>
                        <ChevronRight />
                    </Card>
                </Link>
            )}

            <TopicGrid topics={topics} defaultGoal={profile?.goal ?? null} freeUserLimits={dashboard?.freeUserLimits} />
        </main>
    )
}

export const metadata: Metadata = {
    title: 'English Tutor',
    description: 'Begin your journey',
};
