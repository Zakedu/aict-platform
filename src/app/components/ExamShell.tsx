import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer } from './Timer';
import { Flag, ChevronLeft, ChevronRight, Menu, X, Check, AlertTriangle } from 'lucide-react';
import { EssentialBadge } from './EssentialBadge';
import { useExam } from '../context/ExamContext';
import { useTabLeaveDetection } from '../hooks/useTabLeaveDetection';

// 색상 상수
const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#152A45',
  gold: '#C9A227',
  goldMuted: '#F5EFD7',
  surface: '#F8F9FA',
  border: '#E5E7EB',
  textMuted: '#64748B',
  success: '#059669',
};

interface Question {
  id: string;
  [key: string]: unknown;
}

interface ExamShellProps {
  examTitle: string;
  partLabel: string;
  currentIndex: number;
  totalQuestions: number;
  startTime: number;
  duration: number;
  saveStatus?: 'saving' | 'saved' | 'error';
  questions: Question[];
  getAnswer: (questionId: string) => unknown;
  isFlagged: (questionId: string) => boolean;
  onQuestionSelect: (index: number) => void;
  children: ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  onFlag?: () => void;
  onSubmit?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  nextLabel?: string;
  showSubmit?: boolean;
  onTimeExpired?: () => void;
  enableTabLeaveDetection?: boolean;
  autoSubmitPath?: string;
}

export const ExamShell = ({
  examTitle,
  partLabel,
  currentIndex,
  totalQuestions,
  startTime,
  duration,
  saveStatus = 'saved',
  questions,
  getAnswer,
  isFlagged,
  onQuestionSelect,
  children,
  onPrevious,
  onNext,
  onFlag,
  onSubmit,
  disablePrevious = false,
  disableNext = false,
  nextLabel = 'Next',
  showSubmit = false,
  onTimeExpired,
  enableTabLeaveDetection = true,
  autoSubmitPath,
}: ExamShellProps) => {
  const navigate = useNavigate();
  const { isRecording } = useExam();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTabLeaveWarning, setShowTabLeaveWarning] = useState(false);
  const [lastLeaveDuration, setLastLeaveDuration] = useState(0);

  // 탭 이탈 감지
  const { tabLeaveCount, isOverLimit } = useTabLeaveDetection({
    enabled: enableTabLeaveDetection,
    onTabLeave: () => {
      // 탭을 벗어날 때
    },
    onTabReturn: (leaveDuration) => {
      setLastLeaveDuration(Math.round(leaveDuration));
      setShowTabLeaveWarning(true);
      setTimeout(() => setShowTabLeaveWarning(false), 5000);
    },
    onLimitExceeded: () => {
      // 탭 이탈 제한 초과 시 자동 제출
      if (autoSubmitPath) {
        navigate(autoSubmitPath);
      }
    },
  });

  // 타이머 만료 시 자동 제출
  const handleTimeExpired = useCallback(() => {
    if (onTimeExpired) {
      onTimeExpired();
    } else if (autoSubmitPath) {
      navigate(autoSubmitPath);
    }
  }, [onTimeExpired, autoSubmitPath, navigate]);

  const currentQuestion = questions[currentIndex];
  const isCurrentFlagged = currentQuestion ? isFlagged(currentQuestion.id) : false;

  const SaveStatusIndicator = () => {
    if (saveStatus === 'saving') {
      return (
        <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.gold }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: COLORS.gold }}></div>
          <span>저장 중...</span>
        </div>
      );
    }
    if (saveStatus === 'error') {
      return (
        <div className="flex items-center gap-2 text-xs" style={{ color: '#DC2626' }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#DC2626' }}></div>
          <span>저장 실패</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.success }}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.success }}></div>
        <span>저장됨</span>
      </div>
    );
  };

  const QuestionListItem = ({ question, index }: { question: Question; index: number }) => {
    const answered = Boolean(getAnswer(question.id));
    const flagged = isFlagged(question.id);
    const isCurrent = index === currentIndex;

    return (
      <button
        onClick={() => {
          onQuestionSelect(index);
          setSidebarOpen(false);
        }}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded transition-all text-xs font-medium"
        style={{
          backgroundColor: isCurrent ? COLORS.navy : answered ? COLORS.goldMuted : COLORS.surface,
          color: isCurrent ? 'white' : COLORS.navy,
        }}
      >
        <span>문항 {index + 1}</span>
        <div className="flex items-center gap-1 ml-auto">
          {answered && !isCurrent && <Check className="w-3 h-3" style={{ color: COLORS.success }} />}
          {flagged && <Flag className={`w-3 h-3 ${isCurrent ? 'text-white fill-white' : ''}`} style={{ color: isCurrent ? 'white' : COLORS.gold, fill: isCurrent ? 'white' : COLORS.gold }} />}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.surface }}>
      {/* 탭 이탈 경고 토스트 */}
      {showTabLeaveWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-lg shadow-lg border"
            style={{
              backgroundColor: isOverLimit ? '#FEE2E2' : '#FEF3C7',
              borderColor: isOverLimit ? '#FCA5A5' : '#FCD34D',
            }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: isOverLimit ? '#DC2626' : '#D97706' }} />
            <div>
              <p className="font-medium" style={{ color: isOverLimit ? '#DC2626' : '#92400E' }}>
                {isOverLimit
                  ? '탭 이탈 횟수 초과! 시험이 자동 제출됩니다.'
                  : `탭 이탈 감지됨 (${lastLeaveDuration}초)`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: isOverLimit ? '#B91C1C' : '#A16207' }}>
                {isOverLimit
                  ? '부정행위로 기록됩니다.'
                  : `남은 기회: ${3 - tabLeaveCount}회`}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Top Fixed Bar */}
      <div className="bg-white sticky top-0 z-30" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded transition-colors"
              style={{ color: COLORS.navy }}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:block">
              <EssentialBadge size="small" showLabel={false} />
            </div>

            <div>
              <div className="text-xs font-medium mb-0.5" style={{ color: COLORS.gold }}>{examTitle}</div>
              <div className="font-bold" style={{ color: COLORS.navy }}>{partLabel}</div>
            </div>
          </div>

          {/* Center: Progress */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>진행</span>
            <span className="font-bold" style={{ color: COLORS.navy }}>{currentIndex + 1}/{totalQuestions}</span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.border }}>
              <div className="h-full rounded-full" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%`, backgroundColor: COLORS.navy }} />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            {/* 녹화 인디케이터 */}
            {isRecording && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#DC2626' }}></div>
                <span>REC</span>
              </div>
            )}
            {/* 탭 이탈 카운터 */}
            {enableTabLeaveDetection && tabLeaveCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: isOverLimit ? '#FEE2E2' : '#FEF3C7',
                  color: isOverLimit ? '#DC2626' : '#D97706'
                }}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>탭이탈 {tabLeaveCount}/3</span>
              </div>
            )}
            <div className="hidden sm:block"><SaveStatusIndicator /></div>
            <Timer startTime={startTime} duration={duration} onExpire={handleTimeExpired} />
          </div>
        </div>

        {/* Mobile Progress */}
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: COLORS.textMuted }}>
            <span>문항 {currentIndex + 1} / {totalQuestions}</span>
            <span>{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.border }}>
            <div className="h-full rounded-full" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%`, backgroundColor: COLORS.navy }} />
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-36 bg-white overflow-y-auto" style={{ borderRight: `1px solid ${COLORS.border}` }}>
          <div className="p-4">
            <div className="mb-4">
              <div className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>문항</div>
              <div className="text-sm font-bold" style={{ color: COLORS.navy }}>
                {questions.filter((q) => getAnswer(q.id)).length}/{totalQuestions} 완료
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-1.5 mb-4 text-xs pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS.navy }}></div>
                <span style={{ color: COLORS.textMuted }}>현재</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS.goldMuted }}></div>
                <span style={{ color: COLORS.textMuted }}>완료</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="w-2.5 h-2.5" style={{ color: COLORS.gold, fill: COLORS.gold }} />
                <span style={{ color: COLORS.textMuted }}>플래그</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {questions.map((question, index) => (
                <QuestionListItem key={question.id} question={question} index={index} />
              ))}
            </div>
          </div>
        </aside>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold" style={{ color: COLORS.navy }}>문항 목록</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-1"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-1.5">
                  {questions.map((question, index) => (
                    <QuestionListItem key={question.id} question={question} index={index} />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 lg:px-10 py-8 lg:py-12 pb-32">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white sticky bottom-0 z-20" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-10 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Previous */}
            <button
              onClick={onPrevious}
              disabled={disablePrevious}
              className="flex items-center gap-2 px-5 py-3 bg-white border rounded-lg transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
              style={{ borderColor: COLORS.border, color: COLORS.navy }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">이전</span>
            </button>

            {/* Flag */}
            <div className="flex items-center gap-3">
              {onFlag && (
                <button
                  onClick={onFlag}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all font-medium border"
                  style={{
                    backgroundColor: isCurrentFlagged ? COLORS.goldMuted : 'white',
                    borderColor: isCurrentFlagged ? COLORS.gold : COLORS.border,
                    color: COLORS.navy
                  }}
                >
                  <Flag className="w-4 h-4" style={{ color: COLORS.gold, fill: isCurrentFlagged ? COLORS.gold : 'none' }} />
                  <span className="hidden sm:inline">{isCurrentFlagged ? '플래그됨' : '플래그'}</span>
                </button>
              )}
              <div className="sm:hidden text-sm px-3 py-2 rounded font-medium" style={{ backgroundColor: COLORS.surface, color: COLORS.navy }}>
                {currentIndex + 1}/{totalQuestions}
              </div>
            </div>

            {/* Next/Submit */}
            <div className="flex items-center gap-2">
              {showSubmit && onSubmit ? (
                <button onClick={onSubmit} className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-all font-semibold" style={{ backgroundColor: COLORS.navy }}>
                  <span>시험 제출</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onNext}
                  disabled={disableNext}
                  className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
                  style={{ backgroundColor: COLORS.navy }}
                >
                  <span className="hidden sm:inline">{nextLabel}</span>
                  <span className="sm:hidden">다음</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
