'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { BASE_URL, submitOnboarding as submitOnboardingApi, fetchInterviewDebriefApi, uploadResumeApi, startInterviewApi, sendInterviewMessageApi, saveInterviewVocabApi, requestExamApi, startExamApi, submitExamApi, fetchExamByIdApi, gradeReviewApi, gradeFillInApi, submitWritingApi, updateCoachLanguage as updateCoachLanguageApi, submitDictoglossApi, generateDictoglossSessionApi } from './api';
import { ApiErrorCode, DictoglossEvaluation, DictoglossDailySession, NativeLanguage, PendingExamItems, PendingExamResponse, PlacementResult, PromotionResult, SaveInterviewVocabRequest, SaveInterviewVocabResponse, SendInterviewMessageResponse, StartExamResponse, StartInterviewRequest, StartInterviewResponse, UploadResumeResponse, UserGoal, UserProfile } from '@english-teacher/shared';
import type { ApiErrorResponse } from '@english-teacher/shared';

const AUTH_COOKIE_NAME = 'auth_token';

async function setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    });
}

async function setLocaleCookie(locale: string) {
    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    revalidatePath('/');
    redirect('/');
}

export async function deleteAccount(prevState: any, formData: FormData) {
    const password = formData.get('password') as string;
    const token = await getServerAuthToken();

    let res: Response;
    try {
        res = await fetch(`${BASE_URL}/users/me`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ password }),
        });
    } catch {
        const t = await getTranslations('errors');
        return { error: t(ApiErrorCode.CONNECTION_ERROR) };
    }

    if (!res.ok) {
        const err: Partial<ApiErrorResponse> = await res.json().catch(() => ({}));
        const t = await getTranslations('errors');
        return { error: await translateApiError(err, t(ApiErrorCode.UNKNOWN_ERROR)) };
    }

    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    redirect('/signup');
}

export async function getServerAuthToken() {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

async function translateApiError(err: Partial<ApiErrorResponse>, fallback: string): Promise<string> {
    const t = await getTranslations('errors');
    const code = err.code as ApiErrorCode | undefined;
    if (code && code !== ApiErrorCode.UNKNOWN_ERROR) {
        try { return t(code); } catch { }
    }
    const raw = err.message ?? fallback;
    return Array.isArray(raw) ? (raw as string[]).join(', ') : raw;
}

export async function handleSignup(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullname = formData.get('fullname') as string;

    let res: Response;
    try {
        res = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name: fullname }),
        });
    } catch {
        const t = await getTranslations('errors');
        return { error: t(ApiErrorCode.CONNECTION_ERROR), fields: { email, fullname } };
    }

    if (!res.ok) {
        const err: Partial<ApiErrorResponse> = await res.json().catch(() => ({}));
        const t = await getTranslations('errors');
        const error = await translateApiError(err, t(ApiErrorCode.UNKNOWN_ERROR));
        return { error, fields: { email, fullname } };
    }

    const token = res.headers.get('x-auth-token');
    if (token) await setAuthCookie(token);

    revalidatePath('/');
    redirect('/');
}

export async function handleVerifyEmail(prevState: any, formData: FormData) {
    const code = formData.get('code') as string;
    const token = await getServerAuthToken();

    let res: Response;
    try {
        res = await fetch(`${BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ code }),
        });
    } catch {
        const t = await getTranslations('errors');
        return { error: t(ApiErrorCode.CONNECTION_ERROR) };
    }

    if (!res.ok) {
        const err: Partial<ApiErrorResponse> = await res.json().catch(() => ({}));
        const t = await getTranslations('errors');
        const error = await translateApiError(err, t(ApiErrorCode.UNKNOWN_ERROR));
        return { error };
    }

    const newToken = res.headers.get('x-auth-token');
    if (newToken) await setAuthCookie(newToken);

    revalidatePath('/');
    redirect('/');
}

export async function handleResendVerification() {
    const token = await getServerAuthToken();

    try {
        const res = await fetch(`${BASE_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });

        if (!res.ok) {
            const err: Partial<ApiErrorResponse> = await res.json().catch(() => ({}));
            const t = await getTranslations('errors');
            const error = await translateApiError(err, t(ApiErrorCode.UNKNOWN_ERROR));
            return { success: false as const, error };
        }

        return { success: true as const };
    } catch {
        const t = await getTranslations('errors');
        return { success: false as const, error: t(ApiErrorCode.CONNECTION_ERROR) };
    }
}

export async function handleLogin(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    let res: Response;
    try {
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
    } catch {
        const t = await getTranslations('errors');
        return { error: t(ApiErrorCode.CONNECTION_ERROR), fields: { email } };
    }

    if (!res.ok) {
        const err: Partial<ApiErrorResponse> = await res.json().catch(() => ({}));
        const t = await getTranslations('errors');
        const error = await translateApiError(err, t(ApiErrorCode.UNKNOWN_ERROR));
        return { error, fields: { email } };
    }

    const data: { user: UserProfile } | null = await res.json().catch(() => null);
    const token = res.headers.get('x-auth-token');
    if (token) await setAuthCookie(token);
    if (data?.user?.coachLanguage) await setLocaleCookie(data.user.coachLanguage as string);

    revalidatePath('/');
    redirect('/');
}

export async function gradeReview(cardId: string, input: { quality?: number; remembered?: boolean }) {
    const token = await getServerAuthToken();
    return gradeReviewApi(cardId, input, token);
}

export async function gradeFillIn(cardId: string, attempt: string) {
    const token = await getServerAuthToken();
    return gradeFillInApi(cardId, attempt, token);
}

export async function submitWriting(input: { promptSlug: string; studentText: string }) {
    const token = await getServerAuthToken();
    return submitWritingApi(input, token);
}

export async function submitDictogloss(input: { sessionKey: string; answers: string[] }): Promise<DictoglossEvaluation> {
    const token = await getServerAuthToken();
    return submitDictoglossApi(input, token);
}

export async function generateDictoglossSession(): Promise<DictoglossDailySession> {
    const token = await getServerAuthToken();
    return generateDictoglossSessionApi(token);
}

export async function requestExam(): Promise<PendingExamResponse> {
    const token = await getServerAuthToken();
    return requestExamApi(token);
}

export async function startExam(examId: string): Promise<StartExamResponse> {
    const token = await getServerAuthToken();
    return startExamApi(examId, token);
}

export async function submitExam(pendingExamId: string, answers: any[]): Promise<PromotionResult> {
    const token = await getServerAuthToken();
    return submitExamApi(pendingExamId, answers, token);
}

export async function fetchExamById(examId: string): Promise<PendingExamItems> {
    const token = await getServerAuthToken();
    return fetchExamByIdApi(examId, token);
}

export async function submitOnboarding(answers: string[], nativeLanguage: NativeLanguage, goal: UserGoal): Promise<PlacementResult> {
    const token = await getServerAuthToken();
    const result = await submitOnboardingApi(answers, nativeLanguage, goal, token);
    return result;
}

export async function finishOnboarding(nativeLanguage: NativeLanguage): Promise<never> {
    await setLocaleCookie(nativeLanguage);
    revalidatePath('/');
    redirect('/');
}

export async function updateCoachLanguage(coachLanguage: NativeLanguage): Promise<UserProfile> {
    const token = await getServerAuthToken();
    const profile = await updateCoachLanguageApi(coachLanguage, token);
    await setLocaleCookie(coachLanguage);
    return profile;
}

export async function fetchInterviewDebrief(sessionId: string) {
    const token = await getServerAuthToken();
    return fetchInterviewDebriefApi(sessionId, token);
}

export async function uploadResume(file: File): Promise<UploadResumeResponse> {
    const token = await getServerAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    return uploadResumeApi(token, formData);
}

export async function startInterview(body: StartInterviewRequest): Promise<StartInterviewResponse> {
    const token = await getServerAuthToken();
    return startInterviewApi(body, token);
}

export async function sendInterviewMessage(sessionId: string, message: string): Promise<SendInterviewMessageResponse> {
    const token = await getServerAuthToken();
    return sendInterviewMessageApi({ sessionId, message }, token);
}

export async function saveInterviewVocab(body: SaveInterviewVocabRequest): Promise<SaveInterviewVocabResponse> {
    const token = await getServerAuthToken();
    const data = await saveInterviewVocabApi(body, token);
    revalidatePath('/');
    return data;
}

