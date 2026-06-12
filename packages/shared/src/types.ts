export enum ApiErrorCode {
  // Auth
  INVALID_EMAIL = 'INVALID_EMAIL',
  PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
  NAME_REQUIRED = 'NAME_REQUIRED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  // Chat
  TOPIC_NOT_FOUND = 'TOPIC_NOT_FOUND',
  MESSAGE_EMPTY = 'MESSAGE_EMPTY',
  // Interview
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_FORBIDDEN = 'SESSION_FORBIDDEN',
  INTERVIEW_ALREADY_ENDED = 'INTERVIEW_ALREADY_ENDED',
  // Promotion
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  EXAM_NOT_FOUND = 'EXAM_NOT_FOUND',
  EXAM_EXPIRED = 'EXAM_EXPIRED',
  EXAM_NOT_READY = 'EXAM_NOT_READY',
  EXAM_ALREADY_SUBMITTED = 'EXAM_ALREADY_SUBMITTED',
  EXAM_TIME_EXPIRED = 'EXAM_TIME_EXPIRED',
  // Writing
  WRITING_PROMPT_NOT_FOUND = 'WRITING_PROMPT_NOT_FOUND',
  WRITING_TEXT_TOO_SHORT = 'WRITING_TEXT_TOO_SHORT',
  WRITING_TEXT_TOO_LONG = 'WRITING_TEXT_TOO_LONG',
  WRITING_EVAL_FAILED = 'WRITING_EVAL_FAILED',
  // AI / infra
  AI_HIGH_DEMAND = 'AI_HIGH_DEMAND',
  AI_NO_PROVIDERS = 'AI_NO_PROVIDERS',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CHAT_SEND_FAILED = 'CHAT_SEND_FAILED',
  // Interview (extra)
  INTERVIEW_NOT_FINISHED = 'INTERVIEW_NOT_FINISHED',
  FILE_TYPE_NOT_ALLOWED = 'FILE_TYPE_NOT_ALLOWED',
  NO_FILE_UPLOADED = 'NO_FILE_UPLOADED',
  FILE_PARSE_FAILED = 'FILE_PARSE_FAILED',
  // Onboarding / user
  ONBOARDING_INVALID_ANSWERS = 'ONBOARDING_INVALID_ANSWERS',
  ONBOARDING_FAILED = 'ONBOARDING_FAILED',
  LANGUAGE_NOT_SUPPORTED = 'LANGUAGE_NOT_SUPPORTED',
  // Review / SRS
  REVIEW_CARD_NOT_FOUND = 'REVIEW_CARD_NOT_FOUND',
  REVIEW_CARD_FORBIDDEN = 'REVIEW_CARD_FORBIDDEN',
  REVIEW_GRADE_INVALID = 'REVIEW_GRADE_INVALID',
  // Dictogloss
  DICTOGLOSS_INVALID_ANSWERS = 'DICTOGLOSS_INVALID_ANSWERS',
  // Email verification
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  VERIFICATION_CODE_INVALID = 'VERIFICATION_CODE_INVALID',
  VERIFICATION_CODE_EXPIRED = 'VERIFICATION_CODE_EXPIRED',
  // Free user limits
  TOPIC_LIMIT_REACHED = 'TOPIC_LIMIT_REACHED',
  WRITING_DAILY_LIMIT = 'WRITING_DAILY_LIMIT',
  INTERVIEW_DAILY_LIMIT = 'INTERVIEW_DAILY_LIMIT',
  PROMOTION_LIMIT_REACHED = 'PROMOTION_LIMIT_REACHED',
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ApiErrorResponse {
  statusCode: number;
  code: ApiErrorCode;
  message: string;
}

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type NativeLanguage = 'pt' | 'es' | 'en';

export type UserGoal = 'conversation' | 'grammar' | 'vocabulary' | 'exam' | 'professional';

export type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface PendingExamResponse {
  pendingExamId: string;
  status: 'generating' | 'ready' | 'started' | 'submitted' | 'expired' | 'error';
  targetLevel: string;
}

export interface ExamStatusResponse {
  pendingExamId: string;
  status: 'generating' | 'ready' | 'started' | 'submitted' | 'expired' | 'error';
  targetLevel: string;
  readyAt: string | null;
  expiresAt: string | null;
  startedAt: string | null;
  timeLimit: number;
}

export interface PendingExamItems {
  targetLevel: string;
  status: string;
  startedAt: string | null;
  timeLimit: number;
  items: {
    id: string;
    kind: string;
    stem: string;
    options: string[] | null;
    skill: string;
    passage: string | null;
    keyWord: string | null;
  }[];
}

export interface StartExamResponse {
  pendingExamId: string;
  status: 'started';
  startedAt: string;
  timeLimit: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  goal: UserGoal | string;
  studyTimeMinutes: number;
  cefrLevel: CefrLevel | null;
  nativeLanguage: NativeLanguage | string;
  coachLanguage: NativeLanguage | string;
  immersionMode: boolean;
  onboardingCompleted: boolean;
  emailVerified: boolean;
  freeUser: boolean;
}

export interface AuthResponse {
  user: UserProfile;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string;
  cefrLevel?: CefrLevel | null;
}

export interface TopicWithProgress extends Topic {
  status: TopicStatus;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface SendMessageRequest {
  topicId: string;
  message: string;
}

export interface SendMessageResponse {
  assistantMessage: ChatMessage;
  history: ChatMessage[];
  topicCompleted: boolean;
}

export interface StartSessionResponse {
  history: ChatMessage[];
  topicCompleted: boolean;
}

export type ErrorCategory =
  | 'tense'
  | 'agreement'
  | 'preposition'
  | 'article'
  | 'word_order'
  | 'vocab'
  | 'spelling'
  | 'pronunciation'
  | 'other';

export interface StudentErrorEntry {
  id: string;
  topicId: string;
  category: ErrorCategory;
  studentOutput: string;
  correction: string;
  ruleHintL1: string;
  createdAt: string;
}

export interface VocabularyEntry {
  id: string;
  topicId: string;
  termEn: string;
  translationL1: string;
  example: string;
  createdAt: string;
}

export interface PerformanceResponse {
  errors: StudentErrorEntry[];
  vocabulary: VocabularyEntry[];
  summary: {
    totalErrors: number;
    totalVocab: number;
    errorsByCategory: { category: string; count: number }[];
  };
}

export type PlacementQuestionKind = 'writing' | 'mc' | 'fill' | 'speaking';
export type PlacementLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface PlacementQuestion {
  index: number;
  kind: PlacementQuestionKind;
  level: PlacementLevel;
  question: string;
  /** Present for `mc` questions; ordered as displayed. */
  options?: string[];
}

export interface PlacementResult {
  cefrLevel: CefrLevel;
  confidence: 'low' | 'medium' | 'high' | string;
  rationale: string;
  focusAreas: string[];
  user: UserProfile;
}

export type ReviewItemType = 'error' | 'vocab';

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewCard {
  id: string;
  itemType: ReviewItemType;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextDue: string;
  lastSeen: string | null;
  createdAt: string;
  topicId: string | null;
  error: {
    category: string;
    studentOutput: string;
    correction: string;
    ruleHintL1: string;
  } | null;
  vocab: {
    termEn: string;
    translationL1: string;
    example: string;
  } | null;
}

export interface ReviewDueResponse {
  cards: ReviewCard[];
  totalDue: number;
}

export interface FreeUserLimits {
  activeTopicId: string | null;
  activeTopicTitle: string | null;
  topicLocked: boolean;
  topicCompleted: boolean;
  writingUsedToday: boolean;
  interviewUsedToday: boolean;
  promotionUsed: boolean;
}

export interface DashboardResponse {
  streak: number;
  topicsCompleted: number;
  topicsInProgress: number;
  reviewDue: number;
  activeVocab: number;
  continueTopic: { topicId: string; title: string } | null;
  topErrorCategories: { category: string; count: number }[];
  recentVocab: { id: string; termEn: string; translationL1: string }[];
  recentCulturalNotes: {
    id: string;
    title: string;
    noteL1: string;
    tag: string | null;
  }[];
  freeUserLimits: FreeUserLimits | null;
}

export interface CulturalNote {
  id: string;
  topicId: string | null;
  title: string;
  noteEn: string;
  noteL1: string;
  tag: string | null;
  createdAt: string;
}

export type TopicKind = 'grammar' | 'situational';

export type InterviewJobRole =
  | 'technology'
  | 'marketing'
  | 'finance'
  | 'healthcare'
  | 'education'
  | 'sales'
  | 'other';

export interface UploadResumeResponse {
  resumeText: string;
}

export interface StartInterviewRequest {
  resumeText: string;
  jobRole: InterviewJobRole | string;
  customJobRole?: string;
}

export interface StartInterviewResponse {
  sessionId: string;
  companyName: string;
  jobRole: string;
  firstMessage: string;
}

export interface SendInterviewMessageRequest {
  sessionId: string;
  message: string;
}

export interface SendInterviewMessageResponse {
  message: string;
  interviewComplete: boolean;
}

export interface InterviewVocabItem {
  termEn: string;
  howUsed: string;
  betterAlternativeEn?: string;
}

export interface InterviewImprovementSuggestion {
  area: string;
  tipL1: string;
  exampleEn: string;
}

export interface InterviewDebrief {
  fluencyNotes: string;
  professionalVocabUsed: InterviewVocabItem[];
  improvementSuggestions: InterviewImprovementSuggestion[];
  strengths: string[];
  interviewScore: number;
}

export interface InterviewDebriefResponse {
  debrief: InterviewDebrief;
  sessionId: string;
}

export interface SaveInterviewVocabRequest {
  sessionId: string;
  items: { termEn: string; translationL1: string; example: string }[];
}

export interface SaveInterviewVocabResponse {
  saved: number;
}

export interface GrammarReferenceRow {
  /** EN — name of the structure or sub-form (e.g. "Past Perfect"). */
  name: string;
  /** L1 — short definition, max ~1 line. */
  whatItIs: string;
  /** EN monospace — syntactic formula, e.g. "S + had + past participle". */
  formula: string;
  /** EN italic — canonical example sentence. */
  example: string;
}

export interface GrammarReferenceGroup {
  /** Section header (e.g. "Past Tenses") or null for a single-row card. */
  header: string | null;
  rows: GrammarReferenceRow[];
}

export interface GrammarReference {
  kind: 'grammar';
  groups: GrammarReferenceGroup[];
}

export interface SituationalKeyPhrase {
  /** EN — natural phrase. */
  phrase: string;
  /** L1 — pragmatic function (what speech act it accomplishes). */
  function: string;
  /** L1 — when/with whom it's appropriate. */
  whenToUse: string;
  /** EN — optional contextual example sentence. */
  example?: string;
}

export interface SituationalExchangeLine {
  role: 'You' | 'Other';
  /** EN. */
  line: string;
}

export interface SituationalReference {
  kind: 'situational';
  /** L1 — 1-2 lines of cultural framing. */
  context: string;
  keyPhrases: SituationalKeyPhrase[];
  miniExchange?: SituationalExchangeLine[];
}

export type TopicReference = GrammarReference | SituationalReference;

export interface WritingPromptOption {
  slug: string;
  title: string;
  body: string;
  cefrLevel: string;
}

export interface WritingRubric {
  task: number;
  grammar: number;
  vocab: number;
  cohesion: number;
  overall: number;
}

export type PromotionItemKind =
  | 'mc_grammar'
  | 'cloze'
  | 'mc_vocab'
  | 'reading_comprehension'
  | 'sentence_transformation'
  | 'error_identification'
  | 'open_cloze_paragraph';
export type PromotionLevel = 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface PromotionEligibility {
  eligible: boolean;
  reason: 'max_level' | 'cooldown' | 'promotion_used' | null;
  currentLevel: string | null;
  nextLevel: PromotionLevel | null;
  cooldownUntil: string | null;
  cefrReadyForPromotion?: boolean;
}

export interface PromotionExamItem {
  id: string;
  kind: PromotionItemKind;
  stem: string;
  options: string[] | null;
  skill: string;
  passage?: string | null;
  keyWord?: string | null;
}

export interface PromotionExam {
  targetLevel: PromotionLevel;
  items: PromotionExamItem[];
}

export interface PromotionResult {
  passed: boolean;
  score: number;
  total: number;
  correct: number;
  targetLevel: PromotionLevel;
  newLevel: string | null;
}

export interface WritingSubmissionSummary {
  id: string;
  promptTitle: string;
  promptBody: string;
  studentText: string;
  rubric: WritingRubric;
  feedbackL1: string;
  strengths: string;
  weaknesses: string;
  revisedVersion: string;
  createdAt: string;
}

export interface DictoglossSentence {
  id: string;
  text: string;
}

export type DictoglossDailySession =
  | { generated: false }
  | { generated: true; sessionKey: string; sentences: DictoglossSentence[] };

export interface DictoglossDiffToken {
  text: string;
  kind: 'match' | 'missing' | 'extra';
}

export interface DictoglossSentenceResult {
  sentenceId: string;
  expected: string;
  student: string;
  accuracy: number;
  diff: DictoglossDiffToken[];
}

export interface DictoglossEvaluation {
  sessionKey: string;
  overallAccuracy: number;
  results: DictoglossSentenceResult[];
}
