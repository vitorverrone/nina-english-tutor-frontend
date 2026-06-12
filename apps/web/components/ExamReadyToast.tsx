'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from '@/lib/navigation';
import { useExamStatus } from '../lib/use-exam-status';
import { useTranslations } from 'next-intl';
import { Card } from './Card';
import { Button } from './Button';

function playExamReadySound() {
    try {
        const ctx = new AudioContext();
        const notes = [523.25, 659.25];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = ctx.currentTime + i * 0.2;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
            osc.start(start);
            osc.stop(start + 0.6);
        });
    } catch { }
}

export function ExamReadyToast() {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('promotion');
    const [examId, setExamId] = useState<string | null>(null);
    const [seenExamId, setSeenExamId] = useState<string | null>(null);
    const soundPlayedRef = useRef<string | null>(null);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const checkStorage = () => {
            const id = localStorage.getItem('pendingExamId');
            setExamId(id);
            setSeenExamId(localStorage.getItem('seenExamId'));
            if (id && intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };
        checkStorage();

        window.addEventListener('storage', checkStorage);
        intervalId = setInterval(checkStorage, 2000);

        return () => {
            window.removeEventListener('storage', checkStorage);
            if (intervalId !== null) clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        if (pathname === '/level-up' && examId) {
            localStorage.setItem('seenExamId', examId);
            setSeenExamId(examId);
        }
    }, [pathname, examId]);

    const { status } = useExamStatus(examId, 3000);

    useEffect(() => {
        if (
            status?.status === 'ready' &&
            examId &&
            seenExamId !== examId &&
            pathname !== '/level-up' &&
            soundPlayedRef.current !== examId
        ) {
            soundPlayedRef.current = examId;
            playExamReadySound();
        }
    }, [status?.status, examId, seenExamId, pathname]);

    if (pathname === '/level-up') {
        return null;
    }

    if (status?.status === 'ready' && seenExamId !== examId) {
        return (
            <Card type="green" className="fixed bottom-6 left-6 md:left-auto right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-center gap-4 max-w-sm">
                    <div>
                        <h4 className="text-lg">
                            {t('exam.async.readyTitle')}
                        </h4>
                        <p className="text-sm-clamp mt-1">
                            {t('exam.async.readyBody')}
                        </p>
                    </div>
                    <Button
                        mode="green"
                        className="shrink-0"
                        onClick={() => router.push('/level-up')}
                    >
                        {t('exam.async.readyCta')}
                    </Button>
                </div>
            </Card>
        );
    }

    return null;
}
