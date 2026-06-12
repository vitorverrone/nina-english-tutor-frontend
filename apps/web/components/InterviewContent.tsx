'use client';

import { useState } from 'react';
import type { StartInterviewResponse } from '@english-teacher/shared';
import { InterviewSetup } from './InterviewSetup';
import { InterviewChat } from './InterviewChat';
import { InterviewDebrief } from './InterviewDebrief';
import { useTranslations } from 'next-intl';
import { InnerHeader } from './InnerHeader';

type Stage = 'setup' | 'interview' | 'debrief';

export default function InterviewContent() {
    const t = useTranslations('');
    const [stage, setStage] = useState<Stage>('setup');
    const [session, setSession] = useState<StartInterviewResponse | null>(null);
    let pageContent;

    const handleStart = (s: StartInterviewResponse) => {
        setSession(s);
        setStage('interview');
    };

    const handleComplete = (_sessionId: string) => {
        setStage('debrief');
    };

    const title = t.rich('interview.setup.title', {
        highlighted: (chunks) => <span className="text-primary">{chunks}</span>
    })

    if (stage === 'setup') {
        pageContent = (
            <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
                <InnerHeader text={title} />

                <div className="p-4 md:p-0 flex flex-col gap-5">
                    <InterviewSetup onStart={handleStart} />
                </div>
            </main>
        )
    }

    if (stage === 'interview' && session) {
        pageContent = (
            <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col h-[100dvh]">
                <InnerHeader text={title} />

                <div className="p-4 md:p-0 flex flex-col gap-5 flex-1 min-h-0">
                    <InterviewChat session={session} onComplete={handleComplete} />
                </div>
            </main>
        )
    }

    if (stage === 'debrief' && session) {
        pageContent = (
            <main className="mx-auto md:px-6 md:py-10 w-[1020px] max-w-full flex flex-col">
                <InnerHeader text={title} />

                <div className="p-4 md:p-0 flex flex-col gap-5">
                    <InterviewDebrief sessionId={session.sessionId} companyName={session.companyName} jobRole={session.jobRole} />
                </div>
            </main>
        )
    }

    return pageContent;
}
