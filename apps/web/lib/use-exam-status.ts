import { useEffect, useState } from 'react';
import type { ExamStatusResponse } from '@english-teacher/shared';

async function fetchExamStatusLocal(examId: string): Promise<ExamStatusResponse> {
    const res = await fetch(`/api/promotion/exam-status/${examId}`, { cache: 'no-store' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erro ${res.status}`);
    }
    return res.json();
}

export function useExamStatus(examId: string | null, intervalMs = 3000) {
    const [status, setStatus] = useState<ExamStatusResponse | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [trigger, setTrigger] = useState(0);

    const mutate = () => setTrigger((prev) => prev + 1);

    useEffect(() => {
        if (!examId) {
            setStatus(null);
            setError(null);
            setIsPolling(false);
            return;
        }

        let isMounted = true;
        let timeoutId: ReturnType<typeof setTimeout>;

        const stopStatuses = new Set(['ready', 'started', 'submitted', 'expired', 'error']);

        const schedule = (ms: number) => {
            timeoutId = setTimeout(poll, ms);
        };

        const poll = async () => {
            try {
                setIsPolling(true);
                const data = await fetchExamStatusLocal(examId);
                if (isMounted) {
                    setStatus(data);
                    setError(null);
                    if (stopStatuses.has(data.status)) {
                        setIsPolling(false);
                    } else {
                        schedule(intervalMs);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    const isTooManyRequests = /\b429\b/.test(error.message) || /too many requests/i.test(error.message);
                    if (isTooManyRequests) {
                        setError(null);
                        setIsPolling(true);
                        schedule(15_000);
                        return;
                    }
                    setError(error);
                    setIsPolling(false);
                }
            }
        };

        poll();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [examId, intervalMs, trigger]);

    return { status, error, isPolling, mutate };
}
