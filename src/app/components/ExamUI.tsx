/**
 * 시험 공통 UI 컴포넌트
 * - 타이머 (5분/1분 경고 포함)
 * - 진행률 표시
 * - 자동저장 알림
 * - 북마크 버튼
 */

import { useState, useEffect, useCallback } from 'react';
import { Clock, Bookmark, BookmarkCheck, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// 색상 상수
const COLORS = {
  navy: '#1E3A5F',
  gold: '#C9A227',
  success: '#059669',
  warning: '#CA8A04',
  error: '#DC2626',
  textMuted: '#64748B',
  border: '#E5E7EB',
  surface: '#F8F9FA',
};

interface TimerProps {
  totalSeconds: number;
  onTimeUp?: () => void;
  onWarning5Min?: () => void;
  onWarning1Min?: () => void;
}

// 타이머 컴포넌트 (5분/1분 경고 포함)
export const ExamTimer = ({ totalSeconds, onTimeUp, onWarning5Min, onWarning1Min }: TimerProps) => {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [warned5Min, setWarned5Min] = useState(false);
  const [warned1Min, setWarned1Min] = useState(false);
  const [showWarning, setShowWarning] = useState<'5min' | '1min' | null>(null);
  const { language } = useLanguage();

  const texts = {
    ko: { remaining: '남음', min5: '5분 남았습니다!', min1: '1분 남았습니다!' },
    ja: { remaining: '残り', min5: '残り5分です！', min1: '残り1分です！' },
  };
  const t = texts[language];

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  // 5분 경고
  useEffect(() => {
    if (remaining === 300 && !warned5Min) {
      setWarned5Min(true);
      setShowWarning('5min');
      onWarning5Min?.();
      setTimeout(() => setShowWarning(null), 5000);
    }
  }, [remaining, warned5Min, onWarning5Min]);

  // 1분 경고
  useEffect(() => {
    if (remaining === 60 && !warned1Min) {
      setWarned1Min(true);
      setShowWarning('1min');
      onWarning1Min?.();
      setTimeout(() => setShowWarning(null), 5000);
    }
  }, [remaining, warned1Min, onWarning1Min]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining <= 60;
  const isWarning = remaining <= 300;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition-colors ${
          isUrgent ? 'animate-pulse' : ''
        }`}
        style={{
          backgroundColor: isUrgent ? '#FEE2E2' : isWarning ? '#FEF3C7' : COLORS.surface,
          color: isUrgent ? COLORS.error : isWarning ? COLORS.warning : COLORS.navy,
        }}
      >
        <Clock className="w-5 h-5" />
        <span>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="text-xs font-normal opacity-70">{t.remaining}</span>
      </div>

      {/* 경고 팝업 */}
      {showWarning && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap z-50 animate-bounce"
          style={{
            backgroundColor: showWarning === '1min' ? COLORS.error : COLORS.warning,
            color: 'white',
          }}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-bold">
            {showWarning === '5min' ? t.min5 : t.min1}
          </span>
        </div>
      )}
    </div>
  );
};

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

// 진행률 표시 바
export const ProgressBar = ({ current, total, label }: ProgressBarProps) => {
  const percentage = Math.round((current / total) * 100);
  const { language } = useLanguage();

  const texts = {
    ko: { progress: '진행률', question: '문제' },
    ja: { progress: '進捗', question: '問題' },
  };
  const t = texts[language];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
          {label || t.progress}
        </span>
        <span className="text-xs font-bold" style={{ color: COLORS.navy }}>
          {current}/{total} ({percentage}%)
        </span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ backgroundColor: COLORS.border }}>
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage === 100 ? COLORS.success : COLORS.navy,
          }}
        />
      </div>
    </div>
  );
};

interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  isSaving?: boolean;
}

// 자동저장 알림
export const AutoSaveIndicator = ({ lastSaved, isSaving }: AutoSaveIndicatorProps) => {
  const { language } = useLanguage();

  const texts = {
    ko: { saving: '저장 중...', saved: '자동 저장됨', at: '' },
    ja: { saving: '保存中...', saved: '自動保存済み', at: '' },
  };
  const t = texts[language];

  if (isSaving) {
    return (
      <div className="flex items-center gap-1 text-xs animate-pulse" style={{ color: COLORS.textMuted }}>
        <Save className="w-3 h-3" />
        <span>{t.saving}</span>
      </div>
    );
  }

  if (!lastSaved) return null;

  const timeStr = lastSaved.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex items-center gap-1 text-xs" style={{ color: COLORS.success }}>
      <CheckCircle className="w-3 h-3" />
      <span>{t.saved} {timeStr}</span>
    </div>
  );
};

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

// 북마크 버튼
export const BookmarkButton = ({ isBookmarked, onToggle, size = 'md' }: BookmarkButtonProps) => {
  const { language } = useLanguage();
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  const texts = {
    ko: { bookmark: '북마크', bookmarked: '북마크됨' },
    ja: { bookmark: 'ブックマーク', bookmarked: 'ブックマーク済み' },
  };
  const t = texts[language];

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}
      style={{
        backgroundColor: isBookmarked ? '#FEF3C7' : 'transparent',
        color: isBookmarked ? COLORS.warning : COLORS.textMuted,
        border: `1px solid ${isBookmarked ? COLORS.warning : COLORS.border}`,
      }}
      title={isBookmarked ? t.bookmarked : t.bookmark}
    >
      {isBookmarked ? (
        <BookmarkCheck className={iconSize} />
      ) : (
        <Bookmark className={iconSize} />
      )}
      <span className="hidden sm:inline">{isBookmarked ? t.bookmarked : t.bookmark}</span>
    </button>
  );
};

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: number[];
  bookmarkedQuestions: number[];
  onNavigate: (index: number) => void;
}

// 문제 네비게이터 (번호 버튼)
export const QuestionNavigator = ({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  bookmarkedQuestions,
  onNavigate,
}: QuestionNavigatorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: totalQuestions }, (_, i) => {
        const isAnswered = answeredQuestions.includes(i);
        const isBookmarked = bookmarkedQuestions.includes(i);
        const isCurrent = currentIndex === i;

        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all relative ${
              isCurrent ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: isCurrent
                ? COLORS.navy
                : isAnswered
                ? COLORS.success
                : COLORS.surface,
              color: isCurrent || isAnswered ? 'white' : COLORS.navy,
              borderColor: isCurrent ? COLORS.navy : COLORS.border,
              ['--tw-ring-color' as any]: COLORS.navy,
            }}
          >
            {i + 1}
            {isBookmarked && (
              <span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS.warning }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

// 자동저장 훅
export const useAutoSave = (saveCallback: () => void, interval = 30000) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(() => {
    setIsSaving(true);
    saveCallback();
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 500);
  }, [saveCallback]);

  // 자동 저장 (30초마다)
  useEffect(() => {
    const timer = setInterval(save, interval);
    return () => clearInterval(timer);
  }, [save, interval]);

  // 페이지 나가기 전 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      save();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [save]);

  return { lastSaved, isSaving, save };
};
