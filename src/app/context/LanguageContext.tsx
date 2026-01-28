/**
 * 다국어 지원 Context
 * 한국어 / 일본어 지원
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ko' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ko: {
    // 공통
    'common.home': '홈',
    'common.login': '로그인',
    'common.signup': '회원가입',
    'common.logout': '로그아웃',
    'common.start': '시작하기',
    'common.next': '다음',
    'common.prev': '이전',
    'common.submit': '제출',
    'common.cancel': '취소',
    'common.confirm': '확인',
    'common.save': '저장',
    'common.download': '다운로드',
    'common.share': '공유',
    'common.close': '닫기',
    'common.loading': '로딩 중...',
    'common.error': '오류',
    'common.success': '성공',
    'common.warning': '경고',
    'common.minutes': '분',
    'common.seconds': '초',
    'common.remaining': '남음',
    'common.language': '언어',

    // 홈
    'home.title': 'AI 역량 인증',
    'home.subtitle': 'AI 시대, 당신의 역량을 증명하세요',
    'home.description': 'AICT Essential은 직장인을 위한 AI 활용 역량 인증 시험입니다. 6가지 핵심 역량을 평가하여 AI 도구를 안전하고 효과적으로 사용할 수 있는 능력을 검증합니다.',
    'home.startExam': '시험 시작하기',
    'home.practice': '연습 모드',
    'home.learnMore': '자세히 알아보기',
    'home.feature1.title': '6가지 핵심 역량',
    'home.feature1.desc': 'AI 개념 이해, 프롬프트 설계, 데이터 보호, 결과 검증, 윤리적 판단, 업무 통합',
    'home.feature2.title': '직무별 맞춤 평가',
    'home.feature2.desc': 'HR, 마케팅, 영업, 개발, 사무행정 등 직무에 맞는 시나리오',
    'home.feature3.title': '공인 인증서 발급',
    'home.feature3.desc': '합격 시 1년간 유효한 디지털 인증서 발급',

    // 시험
    'exam.part1': 'Part 1: AI 리터러시',
    'exam.part2': 'Part 2: 프롬프트 리터러시',
    'exam.part3': 'Part 3: 직무 시나리오',
    'exam.question': '문제',
    'exam.of': '/',
    'exam.timeWarning5': '5분 남았습니다!',
    'exam.timeWarning1': '1분 남았습니다!',
    'exam.autoSaved': '자동 저장됨',
    'exam.bookmark': '북마크',
    'exam.bookmarked': '북마크됨',
    'exam.progress': '진행률',

    // 결과
    'result.title': '시험 결과',
    'result.pass': '합격',
    'result.fail': '불합격',
    'result.score': '점수',
    'result.totalScore': '총점',
    'result.passLine': '합격 기준: 70점 이상',
    'result.certificate': '인증서',
    'result.downloadPdf': 'PDF 다운로드',
    'result.downloadImage': '이미지 다운로드',
    'result.shareLinkedIn': 'LinkedIn 공유',
    'result.shareTwitter': '트위터 공유',
    'result.shareKakao': '카카오톡 공유',
    'result.retakeInfo': '재응시 안내',
    'result.retakeAfter': '7일 후 재응시 가능',
    'result.studyRecommend': '추천 학습 자료',
    'result.competencyAnalysis': '역량 분석',
    'result.rubricFeedback': '루브릭 기반 평가',
    'result.jobFeedback': '직무 대비 피드백',
    'result.improvements': '개선 영역',

    // 대시보드
    'dashboard.title': '마이페이지',
    'dashboard.welcome': '환영합니다',
    'dashboard.examHistory': '응시 이력',
    'dashboard.certificates': '인증서',
    'dashboard.noHistory': '응시 이력이 없습니다',

    // 환경 체크
    'envCheck.title': '시험 환경 확인',
    'envCheck.fullscreen': '전체 화면',
    'envCheck.camera': '카메라',
    'envCheck.browser': '브라우저',
    'envCheck.ready': '시험 시작 준비 완료',

    // 다크모드
    'theme.light': '라이트 모드',
    'theme.dark': '다크 모드',
    'theme.system': '시스템 설정',
  },
  ja: {
    // 共通
    'common.home': 'ホーム',
    'common.login': 'ログイン',
    'common.signup': '新規登録',
    'common.logout': 'ログアウト',
    'common.start': '開始',
    'common.next': '次へ',
    'common.prev': '前へ',
    'common.submit': '提出',
    'common.cancel': 'キャンセル',
    'common.confirm': '確認',
    'common.save': '保存',
    'common.download': 'ダウンロード',
    'common.share': '共有',
    'common.close': '閉じる',
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.warning': '警告',
    'common.minutes': '分',
    'common.seconds': '秒',
    'common.remaining': '残り',
    'common.language': '言語',

    // ホーム
    'home.title': 'AI能力認証',
    'home.subtitle': 'AI時代、あなたの能力を証明しましょう',
    'home.description': 'AICT Essentialは、ビジネスパーソンのためのAI活用能力認証試験です。6つのコア能力を評価し、AIツールを安全かつ効果的に使用する能力を検証します。',
    'home.startExam': '試験を開始',
    'home.practice': '練習モード',
    'home.learnMore': '詳細を見る',
    'home.feature1.title': '6つのコア能力',
    'home.feature1.desc': 'AI概念理解、プロンプト設計、データ保護、結果検証、倫理的判断、業務統合',
    'home.feature2.title': '職種別カスタム評価',
    'home.feature2.desc': 'HR、マーケティング、営業、開発、事務など職種に合わせたシナリオ',
    'home.feature3.title': '公認証明書発行',
    'home.feature3.desc': '合格時、1年間有効なデジタル証明書を発行',

    // 試験
    'exam.part1': 'Part 1: AIリテラシー',
    'exam.part2': 'Part 2: プロンプトリテラシー',
    'exam.part3': 'Part 3: 職務シナリオ',
    'exam.question': '問題',
    'exam.of': '/',
    'exam.timeWarning5': '残り5分です！',
    'exam.timeWarning1': '残り1分です！',
    'exam.autoSaved': '自動保存済み',
    'exam.bookmark': 'ブックマーク',
    'exam.bookmarked': 'ブックマーク済み',
    'exam.progress': '進捗',

    // 結果
    'result.title': '試験結果',
    'result.pass': '合格',
    'result.fail': '不合格',
    'result.score': 'スコア',
    'result.totalScore': '総合点',
    'result.passLine': '合格基準: 70点以上',
    'result.certificate': '証明書',
    'result.downloadPdf': 'PDFダウンロード',
    'result.downloadImage': '画像ダウンロード',
    'result.shareLinkedIn': 'LinkedIn共有',
    'result.shareTwitter': 'Twitter共有',
    'result.shareKakao': 'カカオトーク共有',
    'result.retakeInfo': '再受験案内',
    'result.retakeAfter': '7日後に再受験可能',
    'result.studyRecommend': 'おすすめ学習資料',
    'result.competencyAnalysis': '能力分析',
    'result.rubricFeedback': 'ルーブリック評価',
    'result.jobFeedback': '職務別フィードバック',
    'result.improvements': '改善領域',

    // ダッシュボード
    'dashboard.title': 'マイページ',
    'dashboard.welcome': 'ようこそ',
    'dashboard.examHistory': '受験履歴',
    'dashboard.certificates': '証明書',
    'dashboard.noHistory': '受験履歴がありません',

    // 環境チェック
    'envCheck.title': '試験環境確認',
    'envCheck.fullscreen': 'フルスクリーン',
    'envCheck.camera': 'カメラ',
    'envCheck.browser': 'ブラウザ',
    'envCheck.ready': '試験開始準備完了',

    // ダークモード
    'theme.light': 'ライトモード',
    'theme.dark': 'ダークモード',
    'theme.system': 'システム設定',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aict_language');
      if (saved === 'ko' || saved === 'ja') return saved;
    }
    return 'ko';
  });

  useEffect(() => {
    localStorage.setItem('aict_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
