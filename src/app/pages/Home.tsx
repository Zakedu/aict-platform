import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  MessageSquare,
  Shield,
  CircleCheck,
  Workflow,
  Scale,
  Clock,
  FileText,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Sparkles,
  User,
  LogOut,
  Globe
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';

// ============================================
// DESIGN SYSTEM: Slate + Green + Glassmorphism
// ============================================
const colors = {
  slate: {
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
    600: '#475569',
    400: '#94a3b8',
    200: '#e2e8f0',
    100: '#f1f5f9',
  },
  green: {
    600: '#059669',
    500: '#10b981',
    400: '#34d399',
  },
  white: '#ffffff',
};

// ============================================
// GNB COMPONENT (Glassmorphism)
// ============================================
// 언어 선택 컴포넌트
const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
        style={{ color: colors.slate[200] }}
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang?.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 py-2 rounded-lg shadow-lg z-50 min-w-[120px]"
            style={{
              background: colors.slate[800],
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10 transition-colors ${
                  language === lang.code ? 'font-bold' : ''
                }`}
                style={{ color: language === lang.code ? colors.green[500] : colors.slate[200] }}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const GNB = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { language } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 언어별 텍스트
  const texts = {
    ko: { exam: '시험 응시', textbook: '교재', login: '로그인', signup: '회원가입' },
    ja: { exam: '試験を受ける', textbook: '教材', login: 'ログイン', signup: '新規登録' },
  };
  const t = texts[language];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div
          className="font-bold text-xl tracking-wider cursor-pointer"
          style={{ color: colors.white }}
          onClick={() => navigate('/')}
        >
          AICT<span style={{ color: colors.green[500] }}>.</span>
        </div>

        {/* Menu */}
        <div className="flex items-center gap-6">
          {/* Language Selector - 첫 번째 위치 */}
          <LanguageSelector />

          <button
            onClick={() => navigate('/landing')}
            className="text-sm font-medium transition-colors hover:opacity-100"
            style={{ color: colors.slate[200], opacity: 0.8 }}
          >
            {t.exam}
          </button>
          <a
            href="https://zakedu.github.io/genai-book/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium transition-colors hover:opacity-100 flex items-center gap-1"
            style={{ color: colors.slate[200], opacity: 0.8 }}
          >
            {t.textbook} <ExternalLink className="w-3 h-3" />
          </a>

          {/* Auth Buttons */}
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm font-medium transition-colors hover:opacity-100 flex items-center gap-1"
                style={{ color: colors.slate[200], opacity: 0.8 }}
              >
                <User className="w-4 h-4" />
                {user?.name}
              </button>
              <button
                onClick={handleLogout}
                className="text-sm font-medium transition-colors hover:opacity-100 flex items-center gap-1"
                style={{ color: colors.slate[400], opacity: 0.8 }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium transition-colors hover:opacity-100"
                style={{ color: colors.slate[200], opacity: 0.8 }}
              >
                {t.login}
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: colors.green[500], color: colors.white }}
              >
                {t.signup}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// ============================================
// HERO SECTION
// ============================================
const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <section 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${colors.slate[900]} 0%, ${colors.slate[800]} 100%)` }}
    >
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ 
            background: colors.green[500],
            top: '10%',
            right: '10%',
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ 
            background: colors.green[400],
            bottom: '20%',
            left: '5%',
          }}
        />
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(${colors.slate[400]} 1px, transparent 1px), linear-gradient(90deg, ${colors.slate[400]} 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ 
            background: 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${colors.green[500]}30`,
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: colors.green[500] }} />
          <span className="text-sm font-medium" style={{ color: colors.green[400] }}>
            AI Competence Test
          </span>
        </div>
        
        {/* Main Copy */}
        <h1 
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          style={{ color: colors.white }}
        >
          AI 역량,<br />
          <span style={{ color: colors.green[500] }}>이제 증명하세요</span>
        </h1>
        
        {/* Sub Copy */}
        <p 
          className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto"
          style={{ color: colors.slate[400] }}
        >
          6가지 핵심 역량으로 측정하는 AI 활용 능력
        </p>
        
        {/* CTA Button */}
        <button
          onClick={() => navigate('/landing')}
          className="px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-lg"
          style={{ 
            background: colors.green[500],
            color: colors.white,
            boxShadow: `0 4px 20px ${colors.green[500]}40`,
          }}
        >
          역량 측정하기
        </button>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6" style={{ color: colors.slate[400] }} />
        </div>
      </div>
    </section>
  );
};

// ============================================
// STATS SECTION
// ============================================
const StatsSection = () => {
  const stats = [
    { value: '88%', label: 'AI 사용률', description: '직장인들이 일상에서 AI 사용' },
    { value: '5%', label: '실제 임팩트', description: '업무에 실질적 영향을 주는 비율' },
    { value: '75분', label: '시험 시간', description: '3개 파트, 19문항' },
  ];
  
  return (
    <section 
      className="py-20 px-6"
      style={{ background: colors.slate[800] }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p 
            className="text-sm font-medium uppercase tracking-widest mb-4"
            style={{ color: colors.green[500] }}
          >
            Why AICT
          </p>
          <h2 
            className="text-3xl md:text-4xl font-bold"
            style={{ color: colors.white }}
          >
            AI 도구는 보급되었지만,<br />
            <span style={{ color: colors.slate[400] }}>역량은 검증되지 않았습니다</span>
          </h2>
        </div>
        
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-8 rounded-xl"
              style={{ 
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div 
                className="text-5xl md:text-6xl font-bold mb-2"
                style={{ color: colors.green[500] }}
              >
                {stat.value}
              </div>
              <div 
                className="text-lg font-semibold mb-2"
                style={{ color: colors.white }}
              >
                {stat.label}
              </div>
              <div 
                className="text-sm"
                style={{ color: colors.slate[400] }}
              >
                {stat.description}
              </div>
            </div>
          ))}
        </div>
        
        {/* Source */}
        <p 
          className="text-center mt-8 text-xs"
          style={{ color: colors.slate[600] }}
        >
          Source: EY Survey, 29개국 15,000명+ 직장인 대상 (2025)
        </p>
      </div>
    </section>
  );
};

// ============================================
// 6 COMPETENCIES SECTION (Bento Grid)
// ============================================
const CompetenciesSection = () => {
  const competencies = [
    {
      icon: Lightbulb,
      name: 'Defining',
      nameKr: '문제 정의',
      description: 'AI에게 맡길 문제와 범위를 명확히 정의하는 능력',
    },
    {
      icon: MessageSquare,
      name: 'Prompting',
      nameKr: '프롬프트 설계',
      description: '원하는 결과를 위한 구조화된 프롬프트 작성 능력',
    },
    {
      icon: CircleCheck,
      name: 'Refining',
      nameKr: '결과 검증',
      description: 'AI 결과물을 평가하고 반복적으로 개선하는 역량',
    },
    {
      icon: Shield,
      name: 'Protecting',
      nameKr: '데이터 보호',
      description: 'AI 활용 시 보안, 윤리, 환각 리스크를 인지하고 방지하는 역량',
    },
    {
      icon: Scale,
      name: 'Acumen',
      nameKr: '비즈니스 판단',
      description: 'AI를 비즈니스 맥락에서 효과적으로 활용하는 의사결정 역량',
    },
    {
      icon: Workflow,
      name: 'Integrating',
      nameKr: '업무 통합',
      description: 'AI를 기존 업무 프로세스에 자연스럽게 통합하는 능력',
    },
  ];
  
  return (
    <section 
      className="py-20 px-6"
      style={{ background: colors.slate[900] }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p 
            className="text-sm font-medium uppercase tracking-widest mb-4"
            style={{ color: colors.green[500] }}
          >
            6 Competencies
          </p>
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colors.white }}
          >
            6가지 핵심 역량
          </h2>
          <p 
            className="text-lg"
            style={{ color: colors.slate[400] }}
          >
            "AI를 잘 쓴다"를 설명 가능한 언어로 정의합니다
          </p>
        </div>
        
        {/* Bento Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {competencies.map((comp, index) => {
            const Icon = comp.icon;
            return (
              <div 
                key={index}
                className="p-6 rounded-xl transition-all hover:scale-[1.02] cursor-default"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${colors.green[500]}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: colors.green[500] }} />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span 
                    className="text-lg font-bold"
                    style={{ color: colors.white }}
                  >
                    {comp.name}
                  </span>
                  <span 
                    className="text-sm"
                    style={{ color: colors.slate[400] }}
                  >
                    {comp.nameKr}
                  </span>
                </div>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: colors.slate[400] }}
                >
                  {comp.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ============================================
// EXAM STRUCTURE SECTION
// ============================================
const ExamStructureSection = () => {
  const parts = [
    {
      number: 1,
      icon: BookOpen,
      title: 'AI 리터러시',
      titleEn: 'AI Literacy',
      time: '15분',
      questions: '10문항',
      description: 'AI 핵심 개념과 용어에 대한 이해도 평가',
      type: '객관식 4지선다',
      color: colors.slate[700],
    },
    {
      number: 2,
      icon: MessageSquare,
      title: '프롬프트 문해력',
      titleEn: 'Prompt Literacy',
      time: '20분',
      questions: '5문항',
      description: '프롬프트를 분석·개선하는 실전 능력 평가',
      type: '드래그앤드롭, 하이라이트, 리라이트',
      color: colors.slate[600],
    },
    {
      number: 3,
      icon: FileText,
      title: '직무 시나리오',
      titleEn: 'Job Scenario',
      time: '40분',
      questions: '4문항',
      description: '실제 업무 시나리오에서 AI 협업으로 문제 해결',
      type: '프롬프트 작성, AI 협업, 결과물 평가',
      color: colors.green[600],
    },
  ];
  
  return (
    <section 
      className="py-20 px-6"
      style={{ background: colors.slate[800] }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p 
            className="text-sm font-medium uppercase tracking-widest mb-4"
            style={{ color: colors.green[500] }}
          >
            Exam Structure
          </p>
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colors.white }}
          >
            시험 구성
          </h2>
          <p 
            className="text-lg"
            style={{ color: colors.slate[400] }}
          >
            지식 암기가 아닌, 수행 능력 평가
          </p>
        </div>
        
        {/* Parts Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {parts.map((part) => {
            const Icon = part.icon;
            return (
              <div 
                key={part.number}
                className="rounded-xl overflow-hidden"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Header */}
                <div 
                  className="p-4 flex items-center justify-between"
                  style={{ background: part.color }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" style={{ color: colors.white }} />
                    <span 
                      className="font-semibold"
                      style={{ color: colors.white }}
                    >
                      Part {part.number}
                    </span>
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {part.time} | {part.questions}
                  </div>
                </div>
                
                {/* Body */}
                <div className="p-6">
                  <h3 
                    className="text-xl font-bold mb-1"
                    style={{ color: colors.white }}
                  >
                    {part.title}
                  </h3>
                  <p 
                    className="text-sm mb-4"
                    style={{ color: colors.slate[400] }}
                  >
                    {part.titleEn}
                  </p>
                  <p 
                    className="text-sm mb-4 leading-relaxed"
                    style={{ color: colors.slate[400] }}
                  >
                    {part.description}
                  </p>
                  <div 
                    className="text-xs px-3 py-1.5 rounded-full inline-block"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: colors.slate[400],
                    }}
                  >
                    {part.type}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Bar */}
        <div 
          className="mt-8 p-6 rounded-xl flex flex-wrap items-center justify-center gap-8"
          style={{ 
            background: 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${colors.green[500]}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: colors.green[500] }} />
            <span style={{ color: colors.white }}>총 <strong>75분</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: colors.green[500] }} />
            <span style={{ color: colors.white }}>총 <strong>19문항</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CircleCheck className="w-5 h-5" style={{ color: colors.green[500] }} />
            <span style={{ color: colors.white }}>결과 발표 <strong>24시간 내</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// FAQ SECTION
// ============================================
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const faqs = [
    {
      question: 'AICT 인증은 어떤 효력이 있나요?',
      answer: 'AICT는 AI 활용 역량을 객관적으로 측정하는 인증 시험입니다. 채용 서류 가산점, 승진 요건, 역량 평가 등 다양한 목적으로 활용될 수 있습니다. TOEIC이 영어 역량의 표준이 되었듯, AICT가 AI 역량의 표준이 됩니다.',
    },
    {
      question: '시험 준비는 어떻게 해야 하나요?',
      answer: '별도의 암기가 필요한 시험이 아닙니다. AI 도구를 실제로 사용해본 경험이 있다면 충분합니다. 교재 메뉴에서 제공하는 Gen AI 가이드북을 통해 핵심 개념을 학습할 수 있습니다.',
    },
    {
      question: '시험 중 AI 도구를 사용할 수 있나요?',
      answer: 'Part 3(직무 시나리오)에서는 시험 내 제공되는 AI 채팅 기능을 활용하여 문제를 해결합니다. 단, 외부 AI 도구 사용은 제한됩니다.',
    },
    {
      question: '재응시가 가능한가요?',
      answer: '네, 재응시가 가능합니다. 단, 재응시 간격 및 횟수 제한이 있을 수 있으며, 정책은 추후 공지됩니다.',
    },
    {
      question: '어떤 직군을 대상으로 하나요?',
      answer: 'Essential 레벨은 비전공자, 직장인, 취준생 등 모든 사람을 대상으로 합니다. 마케팅, 영업, HR, 기획/PM, 개발, 데이터 분석 등 14개 직군별 시나리오가 제공됩니다.',
    },
  ];
  
  return (
    <section 
      className="py-20 px-6"
      style={{ background: colors.slate[900] }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p 
            className="text-sm font-medium uppercase tracking-widest mb-4"
            style={{ color: colors.green[500] }}
          >
            FAQ
          </p>
          <h2 
            className="text-3xl md:text-4xl font-bold"
            style={{ color: colors.white }}
          >
            자주 묻는 질문
          </h2>
        </div>
        
        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="rounded-xl overflow-hidden"
              style={{ 
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <span 
                  className="font-medium text-lg"
                  style={{ color: colors.white }}
                >
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  style={{ color: colors.slate[400] }}
                />
              </button>
              {openIndex === index && (
                <div 
                  className="px-6 pb-6"
                  style={{ color: colors.slate[400] }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// FOOTER (Minimal)
// ============================================
const Footer = () => {
  return (
    <footer 
      className="py-8 px-6 text-center"
      style={{ 
        background: colors.slate[900],
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <p 
        className="text-sm"
        style={{ color: colors.slate[600] }}
      >
        © 2026 AICT. All rights reserved.
      </p>
    </footer>
  );
};

// ============================================
// MAIN HOME COMPONENT
// ============================================
export const Home = () => {
  return (
    <div className="min-h-screen" style={{ background: colors.slate[900] }}>
      <GNB />
      <HeroSection />
      <StatsSection />
      <CompetenciesSection />
      <ExamStructureSection />
      <FAQSection />
      <Footer />
    </div>
  );
};
