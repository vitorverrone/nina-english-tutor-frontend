import type {
    TopicWithProgress,
    TopicReference,
    ChatMessage,
    StartSessionResponse,
    SendMessageResponse,
    PerformanceResponse,
    UserProfile,
    PlacementQuestion,
    PlacementResult,
    ReviewDueResponse,
    ReviewCard,
    DashboardResponse,
    CulturalNote,
    WritingPromptOption,
    WritingSubmissionSummary,
    NativeLanguage,
    UserGoal,
    AuthResponse,
    PromotionEligibility,
    PromotionResult,
    SaveInterviewVocabRequest,
    StartInterviewRequest,
    InterviewDebriefResponse,
    UploadResumeResponse,
    StartInterviewResponse,
    SendInterviewMessageResponse,
    SaveInterviewVocabResponse,
    DictoglossDailySession,
    DictoglossEvaluation,
    ApiErrorResponse,
} from '@english-teacher/shared';
import { ApiErrorCode } from '@english-teacher/shared';

export class ApiError extends Error {
    code: ApiErrorCode;
    statusCode: number;
    constructor(code: ApiErrorCode, message: string, statusCode: number) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

export const BASE_URL = typeof window === 'undefined' ? process.env.INTERNAL_API_URL ?? 'http://server:3001' : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface RequestOptions extends RequestInit {
    token?: string | null;
    params?: Record<string, string | number | boolean | undefined>;
    body?: any;
}

export type StreamEvent = { type: 'token'; text: string } | { type: 'done'; topicCompleted: boolean } | { type: 'error'; message: string };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { token, params, body, headers: customHeaders, ...rest } = options;

    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) url.searchParams.append(key, String(value));
        });
    }

    const headers = new Headers(customHeaders);
    if (!headers.has('Content-Type') && !(body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(url.toString(), {
        ...rest,
        headers,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
    });

    if (!res.ok) {
        const errorData: Partial<ApiErrorResponse> = await res.json().catch(() => ({}));
        const code = (errorData.code as ApiErrorCode) ?? ApiErrorCode.UNKNOWN_ERROR;
        const raw = errorData.message ?? `${res.status} ${res.statusText}`;
        const message = Array.isArray(raw) ? (raw as string[]).join(', ') : raw;
        throw new ApiError(code, message, res.status);
    }

    if (res.status === 204) return {} as T;

    return res.json();
}

export async function* sendMessageStream(topicId: string, message: string, sessionGoal?: UserGoal | null): AsyncGenerator<StreamEvent> {
    const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, message, sessionGoal: sessionGoal ?? undefined }),
    });

    if (!res.ok || !res.body) {
        throw new ApiError(ApiErrorCode.CHAT_SEND_FAILED, 'Could not send your message right now. Please try again.', res.status ?? 503);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    yield JSON.parse(line.slice(6)) as StreamEvent;
                } catch { }
            }
        }
    }
}

// AUTHENTICATION

export const login = (email: string, password: string) => {
    return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } });
}

export const signup = (email: string, password: string, name: string) => {
    return apiRequest<AuthResponse>('/auth/signup', { method: 'POST', body: { email, password, name } });
}

// TOPICS & CONTENT

export const fetchTopics = (token?: string | null) => {
    return apiRequest<TopicWithProgress[]>('/topics', { token });
}

export const fetchTopicReference = (slug: string, token?: string | null) => {
    return apiRequest<TopicReference | null>(`/topics/${encodeURIComponent(slug)}/reference`, { token }).catch(err => err.message.includes('404') ? null : Promise.reject(err));
}

export const completeTopic = (topicId: string, token?: string | null) => {
    return apiRequest<void>(`/topics/${topicId}/complete`, { method: 'PATCH', token });
}

// CHAT & AI

export const fetchHistory = (topicId: string, token?: string | null) => {
    return apiRequest<ChatMessage[]>(`/chat/${topicId}/history`, { token });
}

export const startSession = (topicId: string, token?: string | null, sessionGoal?: UserGoal | null) => {
    return apiRequest<StartSessionResponse>(`/chat/${topicId}/start`, {
        method: 'POST',
        token,
        body: { sessionGoal: sessionGoal ?? undefined }
    });
}

export const sendMessage = (topicId: string, message: string, token?: string | null, sessionGoal?: UserGoal | null) => {
    return apiRequest<SendMessageResponse>('/chat/message', {
        method: 'POST',
        token,
        body: { topicId, message, sessionGoal: sessionGoal ?? undefined }
    });
}

// USER & ONBOARDING

export const fetchProfile = (token?: string | null) => {
    return apiRequest<UserProfile>('/users/me', { token });
}

export const updateCoachLanguage = (coachLanguage: NativeLanguage, token?: string | null) => {
    return apiRequest<UserProfile>('/users/me/coach-language', { method: 'PATCH', token, body: { coachLanguage } });
}

export const fetchPlacementQuestions = () => {
    return apiRequest<PlacementQuestion[]>('/users/placement-questions');
}

export const submitOnboarding = (answers: string[], nativeLanguage: NativeLanguage, goal: UserGoal, token?: string | null) => {
    return apiRequest<PlacementResult>('/users/onboarding', {
        method: 'POST',
        token,
        body: { answers, nativeLanguage, goal }
    });
}

// REVIEW & PERFORMANCE

export const fetchPerformance = (topicId?: string, token?: string | null) => {
    return apiRequest<PerformanceResponse>('/performance', { token, params: { topicId } });
}

export const fetchDashboard = (token?: string | null) => {
    return apiRequest<DashboardResponse>('/performance/dashboard', { token });
}

export const fetchReviewDue = (token?: string | null) => {
    return apiRequest<ReviewDueResponse>('/review/due', { token });
}

export const gradeReviewApi = (cardId: string, input: { quality?: number; remembered?: boolean }, token?: string | null) => {
    return apiRequest<ReviewCard>(`/review/${cardId}/grade`, { method: 'POST', token, body: input });
}

export const gradeFillInApi = (cardId: string, attempt: string, token?: string | null) => {
    return apiRequest<{ quality: number; card: ReviewCard }>(`/review/${cardId}/grade-fill-in`, { method: 'POST', token, body: { attempt } });
}

// WRITING & CULTURAL

export const fetchCulturalNotes = (token?: string | null) => {
    return apiRequest<CulturalNote[]>('/cultural-notes', { token });
}

export const fetchWritingPrompts = (token?: string | null) => {
    return apiRequest<WritingPromptOption[]>('/writing/prompts', { token });
}

export const fetchWritingSubmissions = (token?: string | null) => {
    return apiRequest<WritingSubmissionSummary[]>('/writing', { token });
}

export const submitWritingApi = (input: { promptSlug: string; studentText: string }, token?: string | null) => {
    return apiRequest<WritingSubmissionSummary>('/writing', { method: 'POST', token, body: input });
}

export const fetchDictoglossDaily = (token?: string | null) => {
    return apiRequest<DictoglossDailySession>('/dictogloss/daily', { token });
}

export const submitDictoglossApi = (input: { sessionKey: string; answers: string[] }, token?: string | null) => {
    return apiRequest<DictoglossEvaluation>('/dictogloss/evaluate', { method: 'POST', token, body: input });
}

export const generateDictoglossSessionApi = (token?: string | null) => {
    return apiRequest<DictoglossDailySession>('/dictogloss/generate', { method: 'POST', token });
}

// PROMOTION & EXAMS (NEW FLOW)

export const fetchPromotionEligibility = (token?: string | null) => {
    return apiRequest<PromotionEligibility>('/promotion/eligibility', { token });
}

export const requestExamApi = (token?: string | null) => {
    return apiRequest<any>('/promotion/request-exam', { method: 'POST', token });
}

export const fetchExamStatus = (examId: string, token?: string | null) => {
    return apiRequest<any>(`/promotion/exam-status/${examId}`, { token });
}

export const fetchExamByIdApi = (examId: string, token?: string | null) => {
    return apiRequest<any>(`/promotion/exam/${examId}`, { token });
}

export const startExamApi = (examId: string, token?: string | null) => {
    return apiRequest<any>(`/promotion/start/${examId}`, { method: 'POST', token });
}

export const submitExamApi = (pendingExamId: string, answers: any[], token?: string | null) => {
    return apiRequest<PromotionResult>('/promotion/submit-exam', {
        method: 'POST',
        token,
        body: { pendingExamId, answers }
    });
}

// INTERVIEW

export const fetchInterviewDebriefApi = (sessionId: string, token: string | null) => {
    return apiRequest<InterviewDebriefResponse>(`/interview/debrief/${encodeURIComponent(sessionId)}`, { token });
}

export const uploadResumeApi = (token: string | null, file: FormData) => {
    return apiRequest<UploadResumeResponse>(`/interview/upload-resume`, { method: 'POST', token, body: file });
}

export const startInterviewApi = (body: StartInterviewRequest, token?: string | null) => {
    return apiRequest<StartInterviewResponse>(`/interview/start`, { method: 'POST', body, token });
}

export const sendInterviewMessageApi = (body: { sessionId: string, message: string }, token?: string | null) => {
    return apiRequest<SendInterviewMessageResponse>(`/interview/message`, { method: 'POST', body, token });
}

export const saveInterviewVocabApi = (body: SaveInterviewVocabRequest, token?: string | null) => {
    return apiRequest<SaveInterviewVocabResponse>(`/interview/save-vocab`, { method: 'POST', body, token });
}
