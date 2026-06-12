import { Badge } from "@/components/Badge";
import { ChatUI } from "@/components/ChatUI";
import { InnerHeader } from "@/components/InnerHeader";
import { TopicReferenceCard } from "@/components/TopicReferenceCard";
import { getServerAuthToken } from "@/lib/actions";
import { fetchHistory, fetchTopicReference, fetchTopics, startSession } from "@/lib/api";
import { UserGoal } from "@english-teacher/shared";
import { getTranslations } from "next-intl/server";

const VALID_GOALS = new Set<UserGoal>([
    'conversation',
    'grammar',
    'vocabulary',
    'exam',
    'professional',
]);

function parseGoal(raw: string | string[] | undefined): UserGoal | null {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value && VALID_GOALS.has(value as UserGoal)) return value as UserGoal;
    return null;
}

export default async function ChatPage({ params, searchParams }: { params: Promise<{ topicId: string }>; searchParams: Promise<{ goal?: string | string[] }> }) {
    const [{ topicId }, { goal }, token] = await Promise.all([params, searchParams, getServerAuthToken()]);
    const sessionGoal = parseGoal(goal);

    const t = await getTranslations('');

    const [topics, initialHistory] = await Promise.all([
        fetchTopics(token).catch(() => []),
        fetchHistory(topicId, token).catch(() => []),
    ]);

    const topic = topics.find((x) => x.id === topicId);

    if (!topic) return;

    const topicsMap = t.raw('topics') as Record<string, { title: string; description: string }>;
    const override = topicsMap[topic.slug || ''] || null;
    const title = override?.title ?? topic.title;
    const goalLabel = sessionGoal ? t(`onboarding.goalStep.options.${sessionGoal}.title`) : null;

    const reference = topic ? await fetchTopicReference(topic.slug, token).catch(() => null) : null;
    const history = initialHistory.length === 0 ? await startSession(topicId, token, sessionGoal).then((res) => res.history).catch(() => []) : initialHistory;

    return (
        <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col md:gap-5 h-[100dvh] overflow-hidden">
            <InnerHeader text={title}>
                {sessionGoal && (
                    <Badge mode="cyan" className="capitalize px-2 font-semibold">
                        {t('chat.focusBadge')}: {goalLabel}
                    </Badge>
                )}
            </InnerHeader>
            {reference && (
                <TopicReferenceCard topicId={topicId} reference={reference} />
            )}
            <ChatUI
                topicId={topicId}
                initialHistory={history}
                sessionGoal={sessionGoal}
            />
        </main>
    )
}
