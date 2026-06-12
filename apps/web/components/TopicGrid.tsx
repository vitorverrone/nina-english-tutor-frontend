'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from '@/lib/navigation';
import type { FreeUserLimits, TopicWithProgress, UserGoal } from '@english-teacher/shared';
import { Card } from './Card';
import { Badge } from './Badge';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';

type GoalValue = 'Conversation' | 'Grammar' | 'Vocabulary' | 'Exam Prep' | 'Professional';

const GOAL_OPTIONS: Array<{ key: UserGoal; value: GoalValue }> = [
    { key: 'conversation', value: 'Conversation' },
    { key: 'grammar', value: 'Grammar' },
    { key: 'vocabulary', value: 'Vocabulary' },
    { key: 'exam', value: 'Exam Prep' },
    { key: 'professional', value: 'Professional' },
];

const VALID_GOAL_KEYS = new Set<UserGoal>(GOAL_OPTIONS.map((o) => o.key));

const STORAGE_KEY = 'sessionGoal';

function normalizeGoal(input: string | null | undefined): UserGoal {
    if (input && VALID_GOAL_KEYS.has(input as UserGoal)) return input as UserGoal;
    return 'conversation';
}

export function TopicGrid({
    topics,
    defaultGoal,
    freeUserLimits,
}: {
    topics: TopicWithProgress[];
    defaultGoal: string | null;
    freeUserLimits?: FreeUserLimits | null;
}) {
    const t = useTranslations('');
    const router = useRouter();
    const [goal, setGoal] = useState<UserGoal>(() => normalizeGoal(defaultGoal));
    const [isPending, startTransition] = useTransition();
    const [pendingTopicId, setPendingTopicId] = useState<string | null>(null);

    useEffect(() => {
        const stored =
            typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (stored && VALID_GOAL_KEYS.has(stored as UserGoal)) {
            setGoal(stored as UserGoal);
        }
    }, []);

    const handleChange = (next: UserGoal) => {
        setGoal(next);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, next);
        }
    };

    const handleTopicClick = (topicId: string, locked: boolean) => {
        if (isPending || locked) return;
        setPendingTopicId(topicId);
        startTransition(() => {
            router.push(`/chat/${topicId}?goal=${encodeURIComponent(goal)}`);
        });
    };

    return (
        <>
            <div className="flex flex-col gap-5">
                <Card className="flex flex-row items-center justify-between flex-wrap">
                    <div className="flex flex-col gap-2">
                        <p className="font-serif text-xl">
                            {t('home.focusPicker.label')}
                        </p>
                        <p className="text-xs font-medium">
                            {t('home.focusPicker.hint')}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {GOAL_OPTIONS.map((opt) => {
                            const selected = goal === opt.key;
                            return (
                                <Badge
                                    key={opt.key}
                                    onClick={() => handleChange(opt.key)}
                                    disabled={isPending}
                                    className={`py-2 border border-pale-blue text-xs ${selected && 'bg-emerald-50 border-emerald-300 text-emerald-600'}`}
                                >
                                    {opt.value}
                                </Badge>
                            );
                        })}
                    </div>
                </Card>

                <h2 className="text-3xl-clamp font-serif">
                    {t('home.suggestedTopics')}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {topics.map((topic) => {
                        const topicsMap = t.raw('topics') as Record<string, { title: string; description: string }>;
                        const override = topicsMap[topic.slug];
                        const title = override?.title ?? topic.title;
                        const statusLabel = t(`home.status.${topic.status}`);
                        const isThisPending = pendingTopicId === topic.id;
                        const isOtherPending = isPending && !isThisPending;
                        const description = override?.description ?? topic.description;

                        const isLockedByFreeUser = !!(
                            freeUserLimits?.topicLocked &&
                            (freeUserLimits.topicCompleted || topic.id !== freeUserLimits.activeTopicId)
                        );

                        return (
                            <Card
                                link={!isLockedByFreeUser}
                                key={topic.id}
                                onClick={() => handleTopicClick(topic.id, isLockedByFreeUser)}
                                aria-busy={isThisPending}
                                title={isLockedByFreeUser ? t('common.topicLockedHint') : undefined}
                                className={`flex flex-col gap-2 ${isLockedByFreeUser
                                        ? 'opacity-50 cursor-not-allowed'
                                        : isOtherPending
                                            ? 'opacity-40 cursor-not-allowed'
                                            : isThisPending
                                                ? 'cursor-wait'
                                                : 'cursor-pointer'
                                    }`}
                                type={topic.status === 'in_progress' ? 'amber' : topic.status === 'completed' ? 'green' : 'default'}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-lg font-serif">{title}</p>
                                    <div className="flex items-center gap-1.5">
                                        {isLockedByFreeUser && <Lock size={14} className="text-cadet-blue shrink-0" />}
                                        <Badge className="text-[10px] rounded-md px-2 whitespace-nowrap" mode={topic.status === 'in_progress' ? 'warn' : topic.status === 'completed' ? 'green' : 'default'}>
                                            {statusLabel}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-sm-clamp mb-1 font-medium">{description}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    {topic.cefrLevel && (
                                        <Badge mode={topic.status === 'in_progress' ? 'warn' : topic.status === 'completed' ? 'green' : 'default'} className='text-xs px-3'>
                                            CEFR · {topic.cefrLevel}
                                        </Badge>
                                    )}
                                    {isThisPending && (
                                        <span
                                            className="w-4 h-4 border-2 border-pale-blue border-t-primary rounded-full animate-spin"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
