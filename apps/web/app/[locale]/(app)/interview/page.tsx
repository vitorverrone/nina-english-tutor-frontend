import InterviewContent from '@/components/InterviewContent';
import { fetchDashboard } from '@/lib/api';
import { getServerAuthToken } from '@/lib/actions';
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/Card';
import { InnerHeader } from '@/components/InnerHeader';

export const dynamic = 'force-dynamic';

export default async function InterviewPage() {
    const token = await getServerAuthToken();
    const tErrors = await getTranslations('errors');
    const tInterview = await getTranslations('interview');
    const dashboard = await fetchDashboard(token).catch(() => null);
    const locked = dashboard?.freeUserLimits?.interviewUsedToday === true;

    if (locked) {
        return (
            <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
                <InnerHeader text={tInterview('title')} />
                <div className="p-4 md:p-0">
                    <Card type="amber" className="flex flex-col gap-1">
                        <p className="font-semibold">{tErrors('INTERVIEW_DAILY_LIMIT')}</p>
                    </Card>
                </div>
            </main>
        );
    }

    return <InterviewContent />;
}
