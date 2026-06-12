import { fetchWritingPrompts, fetchWritingSubmissions, fetchDashboard } from '@/lib/api';
import { WritingWorkspace } from '@/components/WritingWorkspace';
import { getServerAuthToken } from '@/lib/actions';
import { getTranslations } from 'next-intl/server';
import { InnerHeader } from '@/components/InnerHeader';
import { Card } from '@/components/Card';

export const dynamic = 'force-dynamic';

export default async function WritingPage() {
    const t = await getTranslations('writing');
    const tErrors = await getTranslations('errors');
    const token = await getServerAuthToken();
    const [prompts, submissions, dashboard] = await Promise.all([
        fetchWritingPrompts(token).catch(() => []),
        fetchWritingSubmissions(token).catch(() => []),
        fetchDashboard(token).catch(() => null),
    ]);

    const locked = dashboard?.freeUserLimits?.writingUsedToday === true;

    return (
        <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
            <InnerHeader text={t('title')} />

            <div className="p-4 md:p-0 flex flex-col gap-5">
                <p className="text-sm-clamp text-cadet-blue">
                    {t('subtitle')}
                </p>
                {locked ? (
                    <Card type="amber" className="flex flex-col gap-1">
                        <p className="font-semibold">{tErrors('WRITING_DAILY_LIMIT')}</p>
                    </Card>
                ) : (
                    <WritingWorkspace prompts={prompts} initialSubmissions={submissions} />
                )}
            </div>
        </main>
    );
}
