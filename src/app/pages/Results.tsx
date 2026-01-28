/**
 * Results 페이지 - 네이비 + 골드 테마
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { Download, Award, TrendingUp, CheckCircle2, Target, Lightbulb, Share2, FileText, AlertCircle, Loader2, Key, X, QrCode, ChevronDown, ChevronUp, BarChart3, BookOpen, Briefcase, Star, ArrowRight } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { part1Questions, part2Questions } from '../data/questions';
import { getJobTasks, getJobInfo } from '../data/part3-data';
import { EssentialBadge } from '../components/EssentialBadge';
import { gradeAllPart3Tasks } from '../services/part3-grading';
import { IndicatorType } from '../data/questions/types';
import { JobCode, Part3Response, Part3ScoringResult } from '../data/types/part3';
import {
  calculatePart1Scores,
  calculatePart2Scores,
  calculatePart3Scores,
  calculateTotalScores,
  normalizeScores,
  toRadarChartData,
  calculateTotalPoints,
  isPassed,
} from '../services/scoring';
import {
  downloadCertificatePDF,
  generateCertificateId,
  calculateExpiryDate,
  CertificateData,
} from '../services/certificateGenerator';
import { CertificateQRCode } from '../components/CertificateQRCode';
import { useAuth } from '../context/AuthContext';

// 색상 상수
const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#152A45',
  navyLight: '#2D4A6F',
  gold: '#C9A227',
  goldLight: '#E8D48A',
  goldMuted: '#F5EFD7',
  surface: '#F8F9FA',
  border: '#E5E7EB',
  textMuted: '#64748B',
  success: '#059669',
  error: '#DC2626',
};

// 데모 모드 데이터
const DEMO_MODE = true; // 데모용 (나중에 false로 변경)

// 데모 시나리오 타입: 'pass_high' | 'pass_normal' | 'fail_close' | 'fail_low'
type DemoScenario = 'pass_high' | 'pass_normal' | 'fail_close' | 'fail_low';

// URL 파라미터나 localStorage에서 데모 시나리오 가져오기
const getDemoScenario = (): DemoScenario => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const scenario = params.get('demo') as DemoScenario;
    if (scenario && ['pass_high', 'pass_normal', 'fail_close', 'fail_low'].includes(scenario)) {
      return scenario;
    }
  }
  return 'pass_normal'; // 기본값
};

// 시나리오별 데모 점수 데이터
const DEMO_SCENARIOS: Record<DemoScenario, {
  part1Correct: string[];
  part2Correct: string[];
  part3Scores: { defining: number; prompting: number; protecting: number; refining: number; acumen: number; integrating: number };
  description: string;
}> = {
  // 고득점 합격 (90점대)
  pass_high: {
    part1Correct: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12'], // 12개 전부 정답
    part2Correct: ['dragdrop', 'ordering', 'highlight', 'rewrite'], // 4개 전부 정답
    part3Scores: { defining: 12, prompting: 14, protecting: 12, refining: 10, acumen: 12, integrating: 12 }, // 72/60 -> 실제로는 max로 제한
    description: '우수한 성적으로 합격',
  },
  // 일반 합격 (70~80점대)
  pass_normal: {
    part1Correct: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q8', 'q9', 'q10', 'q11', 'q12'], // 12개 중 11개 정답
    part2Correct: ['dragdrop', 'ordering', 'highlight'], // 4개 중 3개 정답
    part3Scores: { defining: 10, prompting: 12, protecting: 10, refining: 8, acumen: 10, integrating: 10 },
    description: '합격 기준 충족',
  },
  // 아쉬운 불합격 (65~69점)
  fail_close: {
    part1Correct: ['q1', 'q2', 'q3', 'q5', 'q6', 'q8', 'q9', 'q10'], // 12개 중 8개 정답
    part2Correct: ['dragdrop', 'ordering'], // 4개 중 2개 정답
    part3Scores: { defining: 8, prompting: 10, protecting: 8, refining: 6, acumen: 8, integrating: 8 },
    description: '합격까지 조금 부족',
  },
  // 낮은 점수 불합격 (50점대 이하)
  fail_low: {
    part1Correct: ['q1', 'q3', 'q5', 'q8', 'q10'], // 12개 중 5개 정답
    part2Correct: ['dragdrop'], // 4개 중 1개 정답
    part3Scores: { defining: 5, prompting: 6, protecting: 4, refining: 4, acumen: 5, integrating: 4 },
    description: '기초 역량 강화 필요',
  },
};

// 현재 데모 시나리오
const CURRENT_DEMO_SCENARIO = getDemoScenario();
const DEMO_SCORES = DEMO_SCENARIOS[CURRENT_DEMO_SCENARIO];

// Part 3 상세 채점 결과 (시나리오별)
const DEMO_PART3_DETAILED_BY_SCENARIO: Record<DemoScenario, Array<{
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  score: number;
  maxScore: number;
  gradingTime: string;
  criteria: Array<{ name: string; score: number; maxScore: number; comment: string }>;
  feedback: string;
  strengths: string[];
  improvements: string[];
}>> = {
  pass_high: [
    {
      taskId: 'hr-task-1',
      taskTitle: '채용 공고 작성',
      taskDescription: 'AI를 활용하여 신입 개발자 채용 공고를 작성하세요.',
      score: 19,
      maxScore: 20,
      gradingTime: '2026-01-15 14:23:45',
      criteria: [
        { name: '프롬프트 구조', score: 5, maxScore: 5, comment: '역할-맥락-지시-제약-출력 구조를 완벽하게 활용함' },
        { name: '직무 요구사항 반영', score: 5, maxScore: 5, comment: '모든 요구사항을 상세하고 정확하게 반영함' },
        { name: '개인정보 보호', score: 5, maxScore: 5, comment: '민감 정보 없이 완벽하게 작성됨' },
        { name: '결과물 품질', score: 4, maxScore: 5, comment: '매우 전문적이고 매력적인 공고, 거의 완벽함' },
      ],
      feedback: '탁월한 프롬프트 설계 능력을 보여주셨습니다. 채용 공고가 전문적이면서도 회사의 매력을 효과적으로 전달하고 있습니다. AI 도구 활용에 대한 깊은 이해가 돋보입니다.',
      strengths: ['완벽한 프롬프트 구조', '상세한 직무 요건 기술', '브랜딩 요소 효과적 반영', '법적 요건 준수'],
      improvements: ['일부 표현의 간결화 검토'],
    },
    {
      taskId: 'hr-task-2',
      taskTitle: '면접 질문 생성',
      taskDescription: 'AI를 활용하여 역량 기반 면접 질문을 생성하세요.',
      score: 18,
      maxScore: 20,
      gradingTime: '2026-01-15 14:25:12',
      criteria: [
        { name: '프롬프트 구조', score: 5, maxScore: 5, comment: '체계적인 구조와 명확한 제약 조건 설정' },
        { name: '역량 연계성', score: 5, maxScore: 5, comment: '핵심 역량과 질문이 완벽하게 연결됨' },
        { name: '편향 검토', score: 4, maxScore: 5, comment: '대부분 중립적, 세심한 검토가 돋보임' },
        { name: '실용성', score: 4, maxScore: 5, comment: '즉시 활용 가능한 고품질 질문' },
      ],
      feedback: '역량 기반 면접 질문이 매우 체계적으로 생성되었습니다. 다양한 역량을 평가할 수 있는 균형 잡힌 질문 세트가 인상적입니다.',
      strengths: ['역량별 질문 분류 완벽', '행동 기반 질문 형식 마스터', '평가 기준 명확한 연계', '후속 질문 시나리오 포함'],
      improvements: ['일부 질문의 난이도 조절 검토'],
    },
    {
      taskId: 'hr-task-3',
      taskTitle: '지원자 서류 분석',
      taskDescription: 'AI를 활용하여 지원자 이력서를 분석하고 평가하세요.',
      score: 17,
      maxScore: 20,
      gradingTime: '2026-01-15 14:27:33',
      criteria: [
        { name: '프롬프트 구조', score: 5, maxScore: 5, comment: '분석 기준이 명확하고 체계적임' },
        { name: '개인정보 처리', score: 4, maxScore: 5, comment: '개인정보 마스킹 잘 수행됨' },
        { name: '분석 품질', score: 4, maxScore: 5, comment: '심층적이고 체계적인 역량 분석' },
        { name: '결과 검증', score: 4, maxScore: 5, comment: 'AI 결과에 대한 검증 절차 포함' },
      ],
      feedback: 'AI를 활용한 이력서 분석이 매우 우수합니다. 개인정보 보호와 결과 검증에 대한 의식이 높아, 실무에서 안전하게 AI를 활용할 수 있는 역량을 갖추고 있습니다.',
      strengths: ['분석 기준의 체계적 설정', '개인정보 보호 철저', '역량 매칭 분석 탁월', '검증 절차 포함'],
      improvements: ['분석 결과의 시각화 방안 검토'],
    },
  ],
  pass_normal: [
    {
      taskId: 'hr-task-1',
      taskTitle: '채용 공고 작성',
      taskDescription: 'AI를 활용하여 신입 개발자 채용 공고를 작성하세요.',
      score: 16,
      maxScore: 20,
      gradingTime: '2026-01-15 14:23:45',
      criteria: [
        { name: '프롬프트 구조', score: 4, maxScore: 5, comment: '역할-맥락-지시-제약-출력 구조를 잘 사용함' },
        { name: '직무 요구사항 반영', score: 4, maxScore: 5, comment: '대부분의 요구사항을 잘 반영함' },
        { name: '개인정보 보호', score: 4, maxScore: 5, comment: '민감 정보 없이 작성됨' },
        { name: '결과물 품질', score: 4, maxScore: 5, comment: '전문적인 공고 생성' },
      ],
      feedback: '프롬프트 설계가 양호하며, AI 도구를 효과적으로 활용했습니다. 우대사항을 더 구체화하면 더 좋은 결과를 얻을 수 있습니다.',
      strengths: ['기본적인 프롬프트 구조 활용', '직무 요건 기술', '회사 문화 반영'],
      improvements: ['우대사항 구체화', '차별화 요소 강화'],
    },
    {
      taskId: 'hr-task-2',
      taskTitle: '면접 질문 생성',
      taskDescription: 'AI를 활용하여 역량 기반 면접 질문을 생성하세요.',
      score: 15,
      maxScore: 20,
      gradingTime: '2026-01-15 14:25:12',
      criteria: [
        { name: '프롬프트 구조', score: 4, maxScore: 5, comment: '기본 구조는 갖췄으나 제약 조건 보완 필요' },
        { name: '역량 연계성', score: 4, maxScore: 5, comment: '핵심 역량과 질문이 연결됨' },
        { name: '편향 검토', score: 3, maxScore: 5, comment: '일부 질문 재검토 필요' },
        { name: '실용성', score: 4, maxScore: 5, comment: '실제 면접에 활용 가능' },
      ],
      feedback: '역량 기반 면접 질문이 생성되었습니다. 편향 가능성이 있는 질문을 검토하고, 후속 질문도 준비하면 더욱 효과적입니다.',
      strengths: ['역량별 질문 분류', '행동 기반 질문 형식 활용'],
      improvements: ['편향 검토 강화', '후속 질문 시나리오 추가'],
    },
    {
      taskId: 'hr-task-3',
      taskTitle: '지원자 서류 분석',
      taskDescription: 'AI를 활용하여 지원자 이력서를 분석하고 평가하세요.',
      score: 13,
      maxScore: 20,
      gradingTime: '2026-01-15 14:27:33',
      criteria: [
        { name: '프롬프트 구조', score: 4, maxScore: 5, comment: '분석 기준 명시가 되어 있음' },
        { name: '개인정보 처리', score: 3, maxScore: 5, comment: '일부 개인정보 마스킹 누락' },
        { name: '분석 품질', score: 3, maxScore: 5, comment: '기본적인 역량 분석 수행' },
        { name: '결과 검증', score: 3, maxScore: 5, comment: 'AI 분석 결과 검증 부족' },
      ],
      feedback: 'AI를 활용한 분석 능력은 양호하나, 개인정보 보호와 결과 검증에서 개선이 필요합니다.',
      strengths: ['분석 기준 설정', '역량 매칭 시도'],
      improvements: ['개인정보 마스킹 철저히', 'AI 결과 검증 절차 추가'],
    },
  ],
  fail_close: [
    {
      taskId: 'hr-task-1',
      taskTitle: '채용 공고 작성',
      taskDescription: 'AI를 활용하여 신입 개발자 채용 공고를 작성하세요.',
      score: 12,
      maxScore: 20,
      gradingTime: '2026-01-15 14:23:45',
      criteria: [
        { name: '프롬프트 구조', score: 3, maxScore: 5, comment: '기본 구조는 있으나 불완전함' },
        { name: '직무 요구사항 반영', score: 3, maxScore: 5, comment: '일부 요구사항 누락' },
        { name: '개인정보 보호', score: 3, maxScore: 5, comment: '보완이 필요한 부분 있음' },
        { name: '결과물 품질', score: 3, maxScore: 5, comment: '기본적인 수준의 공고' },
      ],
      feedback: '프롬프트 설계의 기본은 갖추었으나, 구조화와 상세화가 부족합니다. 역할-맥락-지시-제약-출력 순서를 더 명확히 하고, 각 요소를 상세히 기술하면 더 좋은 결과를 얻을 수 있습니다.',
      strengths: ['기본적인 프롬프트 작성 시도', 'AI 도구 활용 의지'],
      improvements: ['프롬프트 구조화 학습 필요', '요구사항 상세화', '결과물 검토 강화'],
    },
    {
      taskId: 'hr-task-2',
      taskTitle: '면접 질문 생성',
      taskDescription: 'AI를 활용하여 역량 기반 면접 질문을 생성하세요.',
      score: 11,
      maxScore: 20,
      gradingTime: '2026-01-15 14:25:12',
      criteria: [
        { name: '프롬프트 구조', score: 3, maxScore: 5, comment: '구조 개선 필요' },
        { name: '역량 연계성', score: 3, maxScore: 5, comment: '역량과 질문 연결 부족' },
        { name: '편향 검토', score: 2, maxScore: 5, comment: '편향 검토 미흡' },
        { name: '실용성', score: 3, maxScore: 5, comment: '일부 수정 후 활용 가능' },
      ],
      feedback: '면접 질문이 생성되었으나, 역량과의 연계성이 약하고 편향 검토가 부족합니다. 각 역량별로 필요한 질문을 명확히 정의하고, 생성된 질문의 중립성을 검토하세요.',
      strengths: ['면접 질문 생성 시도', '기본적인 질문 형태 이해'],
      improvements: ['역량-질문 연계 강화', '편향 검토 절차 수립', '행동 기반 질문 형식 학습'],
    },
    {
      taskId: 'hr-task-3',
      taskTitle: '지원자 서류 분석',
      taskDescription: 'AI를 활용하여 지원자 이력서를 분석하고 평가하세요.',
      score: 10,
      maxScore: 20,
      gradingTime: '2026-01-15 14:27:33',
      criteria: [
        { name: '프롬프트 구조', score: 3, maxScore: 5, comment: '분석 기준이 모호함' },
        { name: '개인정보 처리', score: 2, maxScore: 5, comment: '개인정보 마스킹 미흡' },
        { name: '분석 품질', score: 3, maxScore: 5, comment: '분석 깊이 부족' },
        { name: '결과 검증', score: 2, maxScore: 5, comment: '검증 절차 부재' },
      ],
      feedback: '이력서 분석을 시도했으나, 개인정보 보호와 결과 검증에서 심각한 개선이 필요합니다. AI에 데이터를 입력하기 전 반드시 개인정보를 마스킹하고, AI의 판단을 맹신하지 마세요.',
      strengths: ['AI 활용 분석 시도'],
      improvements: ['개인정보 보호 교육 필수', '분석 기준 명확화', 'AI 결과 검증 습관화', '편향 인식 제고'],
    },
  ],
  fail_low: [
    {
      taskId: 'hr-task-1',
      taskTitle: '채용 공고 작성',
      taskDescription: 'AI를 활용하여 신입 개발자 채용 공고를 작성하세요.',
      score: 8,
      maxScore: 20,
      gradingTime: '2026-01-15 14:23:45',
      criteria: [
        { name: '프롬프트 구조', score: 2, maxScore: 5, comment: '프롬프트 구조가 부재함' },
        { name: '직무 요구사항 반영', score: 2, maxScore: 5, comment: '요구사항 파악 부족' },
        { name: '개인정보 보호', score: 2, maxScore: 5, comment: '보안 의식 부족' },
        { name: '결과물 품질', score: 2, maxScore: 5, comment: '품질 미달' },
      ],
      feedback: '프롬프트 설계의 기본 원리에 대한 학습이 필요합니다. AI에게 명확한 역할, 맥락, 지시를 제공하지 않으면 원하는 결과를 얻기 어렵습니다. 기초부터 차근차근 학습하시기 바랍니다.',
      strengths: ['AI 도구 사용 시도'],
      improvements: ['프롬프트 기초 학습 필수', '구조화된 지시 작성 연습', 'AI 활용 사례 학습', '결과물 품질 기준 이해'],
    },
    {
      taskId: 'hr-task-2',
      taskTitle: '면접 질문 생성',
      taskDescription: 'AI를 활용하여 역량 기반 면접 질문을 생성하세요.',
      score: 7,
      maxScore: 20,
      gradingTime: '2026-01-15 14:25:12',
      criteria: [
        { name: '프롬프트 구조', score: 2, maxScore: 5, comment: '구조화 미흡' },
        { name: '역량 연계성', score: 2, maxScore: 5, comment: '역량 이해 부족' },
        { name: '편향 검토', score: 1, maxScore: 5, comment: '편향 인식 부재' },
        { name: '실용성', score: 2, maxScore: 5, comment: '실무 활용 어려움' },
      ],
      feedback: '역량 기반 면접의 개념과 AI 프롬프트 작성법에 대한 기초 학습이 필요합니다. 면접에서 평가하고자 하는 역량을 먼저 정의하고, 이를 AI에게 명확히 전달하는 연습을 하세요.',
      strengths: ['학습 의지'],
      improvements: ['역량 기반 면접 이론 학습', '프롬프트 작성 기초 교육', 'AI 편향 인식 교육', '실무 사례 분석'],
    },
    {
      taskId: 'hr-task-3',
      taskTitle: '지원자 서류 분석',
      taskDescription: 'AI를 활용하여 지원자 이력서를 분석하고 평가하세요.',
      score: 6,
      maxScore: 20,
      gradingTime: '2026-01-15 14:27:33',
      criteria: [
        { name: '프롬프트 구조', score: 2, maxScore: 5, comment: '분석 프롬프트 미흡' },
        { name: '개인정보 처리', score: 1, maxScore: 5, comment: '심각한 개인정보 보호 위반' },
        { name: '분석 품질', score: 2, maxScore: 5, comment: '분석 방법론 부재' },
        { name: '결과 검증', score: 1, maxScore: 5, comment: '검증 개념 부재' },
      ],
      feedback: '⚠️ 개인정보 보호에 대한 심각한 인식 부족이 확인되었습니다. AI에 개인정보를 무분별하게 입력하면 법적 문제가 발생할 수 있습니다. 개인정보 보호 교육을 반드시 이수하시기 바랍니다.',
      strengths: [],
      improvements: ['개인정보 보호 교육 즉시 이수', 'AI 윤리 교육 필수', '데이터 마스킹 실습', 'AI 결과 검증 원칙 학습'],
    },
  ],
};

const DEMO_PART3_DETAILED = DEMO_PART3_DETAILED_BY_SCENARIO[CURRENT_DEMO_SCENARIO];

// 루브릭 기반 피드백 데이터 (시나리오별)
const RUBRIC_FEEDBACK_BY_SCENARIO: Record<DemoScenario, Record<string, { level: 'excellent' | 'good' | 'needs_improvement'; description: string; rubric: string[] }>> = {
  pass_high: {
    defining: { level: 'excellent', description: 'AI 개념과 용어를 완벽하게 이해하고 있습니다.', rubric: ['✓ LLM, 토큰, 환각 등 핵심 용어 완벽 이해', '✓ AI 모델의 작동 원리 심층 파악', '✓ AI 기술의 한계와 가능성 정확히 인식'] },
    prompting: { level: 'excellent', description: '프롬프트 설계 능력이 매우 우수합니다.', rubric: ['✓ 역할-맥락-지시-제약-출력 완벽 구사', '✓ 상황별 최적화된 프롬프트 설계', '✓ 반복적 개선 능력'] },
    protecting: { level: 'excellent', description: '개인정보 보호 및 보안 의식이 탁월합니다.', rubric: ['✓ 민감 정보 완벽 마스킹', '✓ 데이터 유출 위험 선제적 대응', '✓ 보안 가이드라인 철저 준수'] },
    refining: { level: 'good', description: 'AI 출력 검증 역량이 우수합니다.', rubric: ['✓ 사실 확인 절차 수립', '✓ 교차 검증 실시', '△ 출처 확인 자동화 검토'] },
    acumen: { level: 'excellent', description: '윤리적 판단력이 탁월합니다.', rubric: ['✓ 저작권 완벽 인식', '✓ AI 편향 적극적 대응', '✓ 책임 소재 명확히 판단'] },
    integrating: { level: 'excellent', description: '업무 통합 능력이 탁월합니다.', rubric: ['✓ AI 도구 최적 활용', '✓ 워크플로우 효율화 달성', '✓ 협업 도구 완벽 연계'] },
  },
  pass_normal: {
    defining: { level: 'excellent', description: 'AI 개념과 용어를 정확하게 이해하고 있습니다.', rubric: ['✓ LLM, 토큰, 환각 등 핵심 용어 이해', '✓ AI 모델의 작동 원리 파악', '✓ AI 기술의 한계와 가능성 인식'] },
    prompting: { level: 'good', description: '프롬프트 설계 능력이 양호하나 일부 개선이 필요합니다.', rubric: ['✓ 역할-맥락-지시 구조 사용', '△ 제약 조건 명시 부족', '✓ 출력 형식 지정 능력'] },
    protecting: { level: 'excellent', description: '개인정보 보호 및 보안 의식이 우수합니다.', rubric: ['✓ 민감 정보 마스킹 실천', '✓ 데이터 유출 위험 인식', '✓ 보안 가이드라인 준수'] },
    refining: { level: 'needs_improvement', description: 'AI 출력 검증 역량 강화가 필요합니다.', rubric: ['△ 사실 확인 절차 미흡', '✗ 교차 검증 부족', '△ 출처 확인 습관화 필요'] },
    acumen: { level: 'good', description: '윤리적 판단력이 양호합니다.', rubric: ['✓ 저작권 인식', '✓ AI 편향 가능성 이해', '△ 책임 소재 판단 개선 필요'] },
    integrating: { level: 'good', description: '업무 통합 능력이 양호합니다.', rubric: ['✓ AI 도구 활용 시나리오 이해', '△ 워크플로우 최적화 여지 있음', '✓ 협업 도구와의 연계 가능'] },
  },
  fail_close: {
    defining: { level: 'good', description: 'AI 기본 개념은 이해하고 있으나 심화 학습이 필요합니다.', rubric: ['✓ 기본 AI 용어 이해', '△ 작동 원리 이해 부족', '△ 기술 한계 인식 미흡'] },
    prompting: { level: 'needs_improvement', description: '프롬프트 설계 능력 향상이 필요합니다.', rubric: ['△ 기본 구조만 사용', '✗ 제약 조건 미흡', '△ 출력 형식 지정 부족'] },
    protecting: { level: 'good', description: '개인정보 보호 의식은 있으나 실천이 부족합니다.', rubric: ['△ 마스킹 일부 누락', '✓ 위험 인식은 있음', '△ 가이드라인 준수 불완전'] },
    refining: { level: 'needs_improvement', description: 'AI 출력 검증 역량이 크게 부족합니다.', rubric: ['✗ 사실 확인 미실시', '✗ 교차 검증 부재', '✗ 출처 확인 안함'] },
    acumen: { level: 'needs_improvement', description: '윤리적 판단력 향상이 필요합니다.', rubric: ['△ 저작권 인식 부족', '✗ AI 편향 미인식', '✗ 책임 소재 불명확'] },
    integrating: { level: 'good', description: '업무 통합 시도는 있으나 개선이 필요합니다.', rubric: ['△ AI 도구 기본 활용', '✗ 워크플로우 비효율', '△ 연계 미흡'] },
  },
  fail_low: {
    defining: { level: 'needs_improvement', description: 'AI 기본 개념 학습이 시급합니다.', rubric: ['✗ 핵심 용어 이해 부족', '✗ 작동 원리 미파악', '✗ 기술 한계 미인식'] },
    prompting: { level: 'needs_improvement', description: '프롬프트 설계 기초 교육이 필요합니다.', rubric: ['✗ 구조화 미흡', '✗ 제약 조건 부재', '✗ 출력 형식 미지정'] },
    protecting: { level: 'needs_improvement', description: '⚠️ 개인정보 보호 교육이 시급합니다.', rubric: ['✗ 마스킹 미실시', '✗ 위험 인식 부재', '✗ 가이드라인 무시'] },
    refining: { level: 'needs_improvement', description: 'AI 출력 검증 개념 학습이 필요합니다.', rubric: ['✗ 검증 개념 부재', '✗ 사실 확인 안함', '✗ AI 결과 맹신'] },
    acumen: { level: 'needs_improvement', description: '⚠️ AI 윤리 교육이 시급합니다.', rubric: ['✗ 저작권 무시', '✗ 편향 미인식', '✗ 책임 의식 부재'] },
    integrating: { level: 'needs_improvement', description: 'AI 업무 활용 기초 학습이 필요합니다.', rubric: ['✗ AI 도구 이해 부족', '✗ 워크플로우 미적용', '✗ 연계 개념 부재'] },
  },
};

const RUBRIC_FEEDBACK = RUBRIC_FEEDBACK_BY_SCENARIO[CURRENT_DEMO_SCENARIO];

// 직무별 피드백 데이터 (상세 버전)
const JOB_FEEDBACK: Record<string, {
  strengths: { title: string; description: string; score: number }[];
  improvements: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  recommendation: string;
  nextSteps: string[];
  industryBenchmark: { avgScore: number; topScore: number; yourRank: string };
  skillGaps: { skill: string; current: number; required: number }[];
}> = {
  HR: {
    strengths: [
      { title: '채용 공고 작성', description: 'AI를 활용하여 전문적이고 매력적인 채용 공고를 효과적으로 작성합니다. 직무 요건과 회사 문화를 잘 반영합니다.', score: 92 },
      { title: '면접 질문 설계', description: '역량 기반 면접 질문을 체계적으로 생성하며, 평가 기준과의 연계성이 우수합니다.', score: 85 },
      { title: '개인정보 보호 의식', description: '채용 과정에서 지원자 개인정보 보호의 중요성을 잘 인식하고 있습니다.', score: 88 },
    ],
    improvements: [
      { title: 'AI 편향 검토 강화', description: 'AI가 생성한 평가 기준이나 질문에 무의식적 편향이 포함될 수 있습니다. 다양성과 포용성 관점에서 최종 검토가 필요합니다.', priority: 'high' },
      { title: '교차 검증 절차 수립', description: 'AI 분석 결과를 그대로 수용하지 않고, 인간 판단과 교차 검증하는 체계적인 절차를 마련하세요.', priority: 'high' },
      { title: '데이터 마스킹 습관화', description: '지원자 정보를 AI에 입력하기 전 민감 정보 마스킹을 습관화하세요.', priority: 'medium' },
    ],
    recommendation: 'HR 업무에서 AI를 효과적으로 활용할 준비가 되어 있습니다. 특히 채용 공고 작성과 면접 질문 생성에서 높은 역량을 보여주셨습니다. 다만, AI 도구가 채용 의사결정에 미치는 영향을 고려할 때, 편향 검토와 개인정보 보호에 더욱 주의를 기울여야 합니다. AI는 보조 도구로 활용하고, 최종 판단은 반드시 인간이 내려야 합니다.',
    nextSteps: [
      '채용 AI 활용 가이드라인 수립 및 팀 내 공유',
      'AI 생성 콘텐츠의 편향 검토 체크리스트 작성',
      '개인정보 마스킹 자동화 도구 도입 검토',
      '분기별 AI 활용 사례 리뷰 및 개선점 도출',
    ],
    industryBenchmark: { avgScore: 72, topScore: 95, yourRank: '상위 15%' },
    skillGaps: [
      { skill: 'AI 편향 감지', current: 65, required: 85 },
      { skill: '데이터 프라이버시', current: 78, required: 90 },
      { skill: '결과 검증', current: 70, required: 85 },
    ],
  },
  MKT: {
    strengths: [
      { title: '콘텐츠 생성', description: 'AI를 활용하여 다양한 마케팅 콘텐츠를 효과적으로 생성합니다. 톤앤매너 조절 능력이 우수합니다.', score: 90 },
      { title: '타겟 오디언스 분석', description: '페르소나 기반 프롬프트 설계로 타겟 맞춤형 콘텐츠를 생성합니다.', score: 87 },
      { title: 'A/B 테스트 설계', description: '마케팅 실험을 위한 변형 콘텐츠 생성 능력이 우수합니다.', score: 82 },
    ],
    improvements: [
      { title: '저작권 검토 강화', description: 'AI 생성 콘텐츠의 저작권 및 원본 소스 확인이 필요합니다. 특히 이미지와 카피의 유사성 검토가 중요합니다.', priority: 'high' },
      { title: '브랜드 가이드라인 준수', description: 'AI 출력물이 브랜드 가이드라인에 부합하는지 체계적으로 검토하세요.', priority: 'medium' },
      { title: '팩트 체크 강화', description: '마케팅 메시지에 포함된 정보의 정확성을 반드시 검증하세요.', priority: 'medium' },
    ],
    recommendation: '마케팅 영역에서 AI 활용도가 매우 높습니다. 콘텐츠 생성 속도와 품질 면에서 우수한 역량을 보여주셨습니다. 다만, AI가 생성한 콘텐츠의 저작권 문제와 브랜드 일관성 유지에 더 주의를 기울여야 합니다. 생성된 콘텐츠가 법적으로 안전하고 브랜드 가치에 부합하는지 최종 검토하는 습관을 들이세요.',
    nextSteps: [
      'AI 생성 콘텐츠 저작권 검토 프로세스 수립',
      '브랜드 가이드라인 기반 검수 체크리스트 작성',
      '마케팅 팩트 체크 도구 활용 방안 검토',
      'AI 활용 마케팅 성과 측정 지표 개발',
    ],
    industryBenchmark: { avgScore: 70, topScore: 93, yourRank: '상위 20%' },
    skillGaps: [
      { skill: '저작권 이해', current: 68, required: 85 },
      { skill: '팩트 체크', current: 72, required: 88 },
      { skill: '브랜드 일관성', current: 75, required: 85 },
    ],
  },
  SALES: {
    strengths: [
      { title: '고객 응대 스크립트', description: '상황별 고객 응대 스크립트를 효과적으로 생성합니다. 자연스러운 대화 흐름 설계 능력이 우수합니다.', score: 85 },
      { title: '제안서 작성', description: 'AI를 활용하여 설득력 있는 제안서 초안을 빠르게 작성합니다.', score: 83 },
      { title: '고객 니즈 분석', description: '고객 데이터 기반 인사이트 도출에 AI를 잘 활용합니다.', score: 80 },
    ],
    improvements: [
      { title: '고객 정보 보안', description: '고객 데이터를 AI에 입력할 때 민감 정보 보호에 더 주의가 필요합니다.', priority: 'high' },
      { title: '계약/법적 검토', description: 'AI가 생성한 계약 관련 문구는 반드시 법무 검토를 거쳐야 합니다.', priority: 'high' },
      { title: '개인화 수준 점검', description: '과도한 개인화가 프라이버시 침해로 느껴지지 않도록 주의하세요.', priority: 'medium' },
    ],
    recommendation: '영업 업무에 AI를 잘 활용할 수 있는 역량을 갖추고 있습니다. 특히 고객 응대와 제안서 작성에서 효율성을 높일 수 있습니다. 다만, 고객 정보 취급 시 보안에 각별히 주의해야 하며, 계약 관련 내용은 AI 출력물을 그대로 사용하지 말고 전문가 검토를 거쳐야 합니다.',
    nextSteps: [
      '고객 데이터 AI 활용 가이드라인 수립',
      '제안서 AI 활용 템플릿 및 검토 프로세스 마련',
      '고객 응대 스크립트 품질 관리 체계 구축',
      '영업 성과와 AI 활용도 상관관계 분석',
    ],
    industryBenchmark: { avgScore: 68, topScore: 91, yourRank: '상위 25%' },
    skillGaps: [
      { skill: '정보 보안', current: 70, required: 90 },
      { skill: '법적 검토', current: 60, required: 80 },
      { skill: '결과 검증', current: 72, required: 85 },
    ],
  },
  DEV: {
    strengths: [
      { title: '코드 생성', description: 'AI를 활용한 코드 생성 및 리팩토링 능력이 우수합니다. 프롬프트로 요구사항을 명확히 전달합니다.', score: 88 },
      { title: '기술 문서 작성', description: 'API 문서, README 등 기술 문서를 효과적으로 생성합니다.', score: 85 },
      { title: '디버깅 지원', description: 'AI를 활용한 버그 분석 및 해결책 도출 능력이 양호합니다.', score: 82 },
    ],
    improvements: [
      { title: '보안 취약점 검토', description: 'AI가 생성한 코드의 보안 취약점을 반드시 검토해야 합니다. SQL 인젝션, XSS 등 일반적인 취약점 체크가 필요합니다.', priority: 'high' },
      { title: '라이선스 확인', description: '생성된 코드의 출처와 라이선스 호환성을 확인하세요.', priority: 'high' },
      { title: '테스트 커버리지', description: 'AI 생성 코드에 대한 테스트 케이스 작성을 강화하세요.', priority: 'medium' },
    ],
    recommendation: '개발 업무에서 AI를 효과적으로 활용할 준비가 되어 있습니다. 코드 생성과 문서화에서 높은 효율을 얻을 수 있습니다. 다만, AI가 생성한 코드는 반드시 보안 검토와 테스트를 거쳐야 하며, 라이선스 문제가 없는지 확인해야 합니다. AI는 초안 생성 도구로 활용하고, 최종 코드 품질에 대한 책임은 개발자에게 있습니다.',
    nextSteps: [
      'AI 생성 코드 보안 검토 체크리스트 작성',
      '코드 리뷰 시 AI 활용 가이드라인 수립',
      '라이선스 호환성 검토 프로세스 마련',
      'AI 페어 프로그래밍 베스트 프랙티스 정리',
    ],
    industryBenchmark: { avgScore: 75, topScore: 94, yourRank: '상위 18%' },
    skillGaps: [
      { skill: '보안 검토', current: 70, required: 90 },
      { skill: '라이선스 이해', current: 65, required: 85 },
      { skill: '테스트 설계', current: 75, required: 85 },
    ],
  },
  ADMIN: {
    strengths: [
      { title: '문서 작성/요약', description: '보고서, 회의록 등 다양한 문서를 효과적으로 작성하고 요약합니다.', score: 86 },
      { title: '일정 관리', description: 'AI를 활용한 일정 조율 및 알림 설정 능력이 우수합니다.', score: 82 },
      { title: '데이터 정리', description: '엑셀 수식, 데이터 정리 등에 AI를 잘 활용합니다.', score: 80 },
    ],
    improvements: [
      { title: '기밀 문서 주의', description: '기밀 등급 문서를 AI에 입력하지 않도록 주의가 필요합니다.', priority: 'high' },
      { title: '정확성 검증', description: 'AI가 요약하거나 생성한 내용의 정확성을 반드시 확인하세요.', priority: 'high' },
      { title: '자동화 범위 설정', description: '어떤 업무까지 AI 자동화가 적절한지 판단 기준을 마련하세요.', priority: 'medium' },
    ],
    recommendation: '사무행정 업무에 AI를 잘 활용할 수 있는 역량을 갖추고 있습니다. 문서 작성과 일정 관리에서 큰 효율 향상을 기대할 수 있습니다. 다만, 기밀 정보 취급 시 AI 도구 사용에 신중해야 하며, AI 출력물의 정확성을 항상 검증하는 습관이 필요합니다. 특히 숫자, 날짜, 이름 등 정확성이 중요한 정보는 반드시 이중 확인하세요.',
    nextSteps: [
      '문서 보안 등급별 AI 활용 가이드라인 수립',
      '정확성 검증 체크리스트 작성',
      '반복 업무 AI 자동화 대상 선정',
      '팀 내 AI 활용 베스트 프랙티스 공유',
    ],
    industryBenchmark: { avgScore: 65, topScore: 88, yourRank: '상위 22%' },
    skillGaps: [
      { skill: '정보 보안', current: 72, required: 88 },
      { skill: '정확성 검증', current: 70, required: 85 },
      { skill: '자동화 판단', current: 68, required: 80 },
    ],
  },
};

export const Results = () => {
  const navigate = useNavigate();
  const { answers, selectedRoles, examQuestions, userInfo } = useExam();
  const { user } = useAuth();

  const [showApiModal, setShowApiModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('aict_api_key') || '');
  const [isGrading, setIsGrading] = useState(false);
  const [gradingProgress, setGradingProgress] = useState({ completed: 0, total: 0 });
  const [part3Results, setPart3Results] = useState<Part3ScoringResult[]>(() => {
    try {
      const saved = localStorage.getItem('aict_part3_results');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [apiError, setApiError] = useState('');

  const selectedJobCode = selectedRoles[0] as JobCode;
  const part3Tasks = getJobTasks(selectedJobCode);
  const jobInfo = getJobInfo(selectedJobCode);

  const part1Qs = examQuestions.part1.length > 0 ? examQuestions.part1 : part1Questions;
  const part2Qs = examQuestions.part2.length > 0 ? examQuestions.part2 : part2Questions;

  useEffect(() => {
    if (part3Results.length > 0) {
      localStorage.setItem('aict_part3_results', JSON.stringify(part3Results));
    }
  }, [part3Results]);

  const part1CorrectIds = useMemo(() => {
    if (DEMO_MODE) {
      return DEMO_SCORES.part1Correct;
    }
    return part1Qs
      .filter(q => {
        const answer = answers.find(a => a.partId === 1 && a.questionId === q.id);
        return q.options.find(opt => opt.id === answer?.answer)?.correct;
      })
      .map(q => q.id);
  }, [part1Qs, answers]);

  const part2CorrectTypes = useMemo(() => {
    if (DEMO_MODE) {
      return DEMO_SCORES.part2Correct;
    }
    return part2Qs
      .filter(q => {
        const answer = answers.find(a => a.partId === 2 && a.questionId === q.id);
        if (q.type === 'dragdrop' || q.type === 'ordering') {
          return JSON.stringify(answer?.answer) === JSON.stringify(q.correctOrder);
        }
        if (q.type === 'highlight') {
          const correctIssues = q.issues?.filter(i => i.isCorrect).map(i => i.id) || [];
          const userSelected = Array.isArray(answer?.answer) ? answer.answer : [];
          return JSON.stringify([...correctIssues].sort()) === JSON.stringify([...userSelected].sort());
        }
        if (q.type === 'rewrite') {
          const answerText = typeof answer?.answer === 'string' ? answer.answer : '';
          const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;
          return wordCount >= (q.minWords || 50);
        }
        return false;
      })
      .map(q => q.type);
  }, [part2Qs, answers]);

  const part1Scores = useMemo(() => calculatePart1Scores(part1CorrectIds), [part1CorrectIds]);
  const part2Scores = useMemo(() => calculatePart2Scores(part2CorrectTypes), [part2CorrectTypes]);

  const part3Scores = useMemo(() => {
    if (DEMO_MODE) {
      // 데모 시나리오별 Part 3 점수
      return DEMO_SCORES.part3Scores;
    }
    if (part3Results.length > 0) {
      return calculatePart3Scores(part3Results);
    }
    return { defining: 8, prompting: 8, protecting: 8, refining: 8, acumen: 8, integrating: 8 };
  }, [part3Results]);

  const totalScores = useMemo(() => calculateTotalScores(part1Scores, part2Scores, part3Scores), [part1Scores, part2Scores, part3Scores]);
  const normalizedScores = useMemo(() => normalizeScores(totalScores), [totalScores]);
  const totalPoints = useMemo(() => calculateTotalPoints(totalScores), [totalScores]);
  const passed = isPassed(totalPoints);
  const radarData = useMemo(() => toRadarChartData(normalizedScores), [normalizedScores]);

  const part1TotalPoints = calculateTotalPoints(part1Scores);
  const part2TotalPoints = calculateTotalPoints(part2Scores);
  const part3TotalPoints = calculateTotalPoints(part3Scores);

  // 인증서 데이터 생성/복원
  useEffect(() => {
    if (passed) {
      // 기존 인증서 확인
      const savedCert = localStorage.getItem('aict_certificate');
      if (savedCert) {
        setCertificate(JSON.parse(savedCert));
      } else {
        // 새 인증서 생성
        const examDate = new Date().toISOString().split('T')[0];
        const newCert: CertificateData = {
          certificateId: generateCertificateId(),
          name: user?.name || userInfo?.name || '응시자',
          score: totalPoints,
          jobRole: jobInfo?.jobTitle || selectedJobCode || '미지정',
          examDate,
          expiryDate: calculateExpiryDate(new Date()),
          competencies: normalizedScores,
        };
        setCertificate(newCert);
        localStorage.setItem('aict_certificate', JSON.stringify(newCert));

        // 응시 이력 저장
        const history = JSON.parse(localStorage.getItem('aict_exam_history') || '[]');
        history.unshift({
          date: examDate,
          jobRole: jobInfo?.jobTitle || selectedJobCode,
          score: totalPoints,
          passed: true,
        });
        localStorage.setItem('aict_exam_history', JSON.stringify(history.slice(0, 10)));
      }
    }
  }, [passed, totalPoints, normalizedScores, user, userInfo, jobInfo, selectedJobCode]);

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    if (certificate) {
      await downloadCertificatePDF(certificate);
    }
  };

  // LinkedIn 공유 (Mock)
  const handleLinkedInShare = () => {
    alert('LinkedIn 연동은 준비 중입니다. 인증서 PDF를 다운로드하여 직접 공유해주세요.');
  };

  const handleGrading = async () => {
    if (!apiKey) {
      setApiError('API 키를 입력해주세요.');
      return;
    }
    setApiError('');
    setIsGrading(true);
    setGradingProgress({ completed: 0, total: part3Tasks.length });
    localStorage.setItem('aict_api_key', apiKey);

    // NOTE: gradeAllPart3Tasks expects tasks + Part3Response[]; normalize stored answers here for traceability.
    const now = Date.now();
    const part3Responses: Part3Response[] = part3Tasks.flatMap(task => {
      const answer = answers.find(a => a.partId === 3 && a.questionId === task.id);
      if (!answer?.answer) {
        return [];
      }
      try {
        const parsed = typeof answer.answer === 'string' ? JSON.parse(answer.answer) : answer.answer;
        return [{
          taskId: task.id,
          taskType: task.taskType,
          content: typeof parsed?.content === 'string' ? parsed.content : String(parsed?.content ?? ''),
          chatMessages: Array.isArray(parsed?.chatMessages) ? parsed.chatMessages : undefined,
          startedAt: now,
          submittedAt: now,
        }];
      } catch {
        return [{
          taskId: task.id,
          taskType: task.taskType,
          content: String(answer.answer),
          startedAt: now,
          submittedAt: now,
        }];
      }
    });

    if (part3Responses.length === 0) {
      setApiError('채점할 답안이 없습니다.');
      setIsGrading(false);
      return;
    }

    try {
      const results = await gradeAllPart3Tasks(part3Tasks, part3Responses, apiKey, (completed, total) => setGradingProgress({ completed, total }));
      setPart3Results(results);
      setShowApiModal(false);
    } catch {
      setApiError('채점 중 오류가 발생했습니다. API 키를 확인해주세요.');
    } finally {
      setIsGrading(false);
    }
  };

  const getTaskResult = (taskId: string): Part3ScoringResult | undefined => {
    return part3Results.find(r => r.taskId === taskId);
  };

  const indicatorInfo: Record<IndicatorType, { nameKo: string; description: string }> = {
    defining: { nameKo: 'AI 개념 이해', description: 'AI 기술과 용어 이해' },
    prompting: { nameKo: '프롬프트 설계', description: '효과적인 지시 작성' },
    protecting: { nameKo: '데이터 보호', description: '개인정보/보안 관리' },
    refining: { nameKo: '결과 검증', description: 'AI 출력 감수·개선' },
    acumen: { nameKo: '윤리적 판단', description: '저작권/책임 의식' },
    integrating: { nameKo: '업무 통합', description: '실무 프로세스 통합' }
  };

  const improvements = useMemo(() => {
    const sortedIndicators = (Object.keys(normalizedScores) as IndicatorType[])
      .map(key => ({ key, score: normalizedScores[key] }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    const templates: Record<IndicatorType, { title: string; action: string }> = {
      defining: { title: 'AI 개념 이해 강화', action: 'LLM, 토큰, 환각 등 핵심 AI 용어 학습' },
      prompting: { title: '프롬프트 구조화 연습', action: '역할→맥락→지시→제약→출력 순서로 프롬프트 작성' },
      protecting: { title: '개인정보 보호 강화', action: 'AI 입력 전 개인정보 마스킹 연습' },
      refining: { title: 'AI 출력 검증 역량 향상', action: 'AI 응답의 사실 확인 및 교차 검증' },
      acumen: { title: '윤리적 판단력 향상', action: '인용 시 출처 명시 및 라이선스 확인' },
      integrating: { title: '업무 통합 능력 개선', action: 'AI 도구를 실무 워크플로우에 적용' }
    };

    return sortedIndicators.map(({ key, score }) => ({
      ...templates[key],
      issue: `${indicatorInfo[key].nameKo} 역량 ${score}%`
    }));
  }, [normalizedScores]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.surface }}>
      {/* API Modal */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5" style={{ color: COLORS.gold }} />
                <h3 className="text-lg font-bold" style={{ color: COLORS.navy }}>Claude API 채점</h3>
              </div>
              <button onClick={() => setShowApiModal(false)} className="p-2 hover:bg-gray-100 rounded" disabled={isGrading}>
                <X className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.navy }}>API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                disabled={isGrading}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: COLORS.border, '--tw-ring-color': COLORS.gold } as React.CSSProperties}
              />
            </div>

            {apiError && <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: COLORS.error }}>{apiError}</div>}

            {isGrading && (
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: COLORS.goldMuted }}>
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.gold }} />
                  <span className="text-sm font-medium" style={{ color: COLORS.navy }}>채점 중... ({gradingProgress.completed}/{gradingProgress.total})</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: COLORS.border }}>
                  <div className="h-2 rounded-full" style={{ width: `${gradingProgress.total > 0 ? (gradingProgress.completed / gradingProgress.total) * 100 : 0}%`, backgroundColor: COLORS.gold }} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowApiModal(false)} disabled={isGrading} className="flex-1 px-4 py-3 border rounded-lg font-medium" style={{ borderColor: COLORS.border, color: COLORS.navy }}>취소</button>
              <button onClick={handleGrading} disabled={isGrading || !apiKey} className="flex-1 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50" style={{ backgroundColor: COLORS.navy }}>
                {isGrading ? '채점 중...' : '채점 시작'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Demo Scenario Selector */}
        {DEMO_MODE && (
          <div className="mb-8 p-4 rounded-lg" style={{ backgroundColor: '#F0F9FF', border: '1px solid #0EA5E9' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded font-bold" style={{ backgroundColor: '#0EA5E9', color: 'white' }}>DEMO</span>
                <span className="text-sm font-medium" style={{ color: '#0369A1' }}>
                  데모 시나리오: {DEMO_SCENARIOS[CURRENT_DEMO_SCENARIO].description}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(DEMO_SCENARIOS) as DemoScenario[]).map((scenario) => (
                  <button
                    key={scenario}
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('demo', scenario);
                      window.location.href = url.toString();
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      CURRENT_DEMO_SCENARIO === scenario ? 'text-white' : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: CURRENT_DEMO_SCENARIO === scenario
                        ? (scenario.startsWith('pass') ? COLORS.success : COLORS.error)
                        : 'white',
                      color: CURRENT_DEMO_SCENARIO === scenario
                        ? 'white'
                        : (scenario.startsWith('pass') ? COLORS.success : COLORS.error),
                      border: `1px solid ${scenario.startsWith('pass') ? COLORS.success : COLORS.error}`,
                    }}
                  >
                    {scenario === 'pass_high' && '고득점 합격'}
                    {scenario === 'pass_normal' && '일반 합격'}
                    {scenario === 'fail_close' && '아쉬운 불합격'}
                    {scenario === 'fail_low' && '낮은 점수'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grading Status Banner */}
        {part3Results.length === 0 && part3Tasks.length > 0 && (
          <div className="mb-8 p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: COLORS.goldMuted, border: `1px solid ${COLORS.gold}` }}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" style={{ color: COLORS.gold }} />
              <div>
                <p className="font-medium" style={{ color: COLORS.navy }}>Part 3 채점이 완료되지 않았습니다</p>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>현재 예상 점수가 표시됩니다.</p>
              </div>
            </div>
            <button onClick={() => setShowApiModal(true)} className="px-4 py-2 text-white rounded-lg font-medium" style={{ backgroundColor: COLORS.navy }}>AI 채점</button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg p-10 mb-8 border text-center" style={{ borderColor: COLORS.border }}>
          <div className="flex justify-center mb-6">
            <EssentialBadge size="large" showLabel={true} showDescription={false} />
          </div>
          <h1 className="text-3xl mb-2 font-bold" style={{ color: COLORS.navy }}>
            {passed ? '인증 완료' : '시험 완료'}
          </h1>
          <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>AI 역량 인증 시험 결과</p>
          {jobInfo && <span className="inline-block px-3 py-1 rounded text-sm" style={{ backgroundColor: COLORS.goldMuted, color: COLORS.navy }}>직무: {jobInfo.jobTitle}</span>}
        </div>

        {/* Score Summary */}
        <div className="grid lg:grid-cols-4 gap-4 mb-8">
          {/* Total Score */}
          <div className="bg-white rounded-lg p-8 border text-center" style={{ borderColor: COLORS.border, borderLeft: `4px solid ${COLORS.gold}` }}>
            <div className="text-sm mb-2 font-medium" style={{ color: COLORS.textMuted }}>총점</div>
            <div className="text-6xl font-bold mb-2" style={{ color: COLORS.navy }}>{totalPoints}</div>
            <div className="text-sm mb-4" style={{ color: COLORS.textMuted }}>/100</div>
            <div className={`inline-block px-4 py-2 rounded text-sm font-bold ${passed ? 'text-white' : ''}`} style={{ backgroundColor: passed ? COLORS.success : COLORS.border, color: passed ? 'white' : COLORS.textMuted }}>
              {passed ? 'PASS' : 'REVIEW'}
            </div>
          </div>

          {/* Part Scores */}
          {[
            { label: 'Part 1', subtitle: 'AI 리터러시', score: part1TotalPoints, max: 24, correct: part1CorrectIds.length, total: part1Qs.length },
            { label: 'Part 2', subtitle: '프롬프트', score: part2TotalPoints, max: 16, correct: part2CorrectTypes.length, total: part2Qs.length },
            { label: 'Part 3', subtitle: '직무 시나리오', score: part3TotalPoints, max: 60, note: part3Results.length > 0 ? 'AI 채점됨' : '예상' }
          ].map((part, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border" style={{ borderColor: COLORS.border }}>
              <div className="text-xs font-semibold mb-1" style={{ color: COLORS.gold }}>{part.label}</div>
              <div className="text-xs mb-3" style={{ color: COLORS.textMuted }}>{part.subtitle}</div>
              <div className="text-3xl font-bold mb-2" style={{ color: COLORS.navy }}>
                {part.score}<span className="text-lg" style={{ color: COLORS.textMuted }}>/{part.max}</span>
              </div>
              <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: COLORS.border }}>
                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (part.score / part.max) * 100)}%`, backgroundColor: COLORS.navy }} />
              </div>
              <div className="text-xs" style={{ color: COLORS.textMuted }}>
                {part.correct !== undefined ? `${part.correct}/${part.total} 정답` : part.note}
              </div>
            </div>
          ))}
        </div>

        {/* Competencies Analysis */}
        <div className="bg-white rounded-lg p-8 border mb-8" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5" style={{ color: COLORS.gold }} />
            <h2 className="text-lg font-bold" style={{ color: COLORS.navy }}>6가지 역량 분석</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="space-y-4">
              {(Object.keys(indicatorInfo) as IndicatorType[]).map((key) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: COLORS.navy }}>{indicatorInfo[key].nameKo}</span>
                    <span className="text-sm font-bold" style={{ color: COLORS.gold }}>{normalizedScores[key]}%</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ backgroundColor: COLORS.border }}>
                    <div className="h-2 rounded-full" style={{ width: `${normalizedScores[key]}%`, backgroundColor: COLORS.navy }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Radar Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke={COLORS.border} />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.navy }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: COLORS.textMuted }} stroke={COLORS.border} />
                  <Radar name="점수" dataKey="value" stroke={COLORS.navy} fill={COLORS.navy} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Part 3 Detailed Results */}
        {DEMO_MODE && (
          <div className="bg-white rounded-lg p-8 border mb-8" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5" style={{ color: COLORS.gold }} />
              <h2 className="text-lg font-bold" style={{ color: COLORS.navy }}>Part 3 상세 채점 결과</h2>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#ECFDF5', color: COLORS.success }}>AI 채점 완료</span>
            </div>

            <div className="space-y-6">
              {DEMO_PART3_DETAILED.map((task, taskIdx) => (
                <div key={task.taskId} className="border rounded-lg overflow-hidden" style={{ borderColor: COLORS.border }}>
                  {/* Task Header */}
                  <div className="p-4 flex items-center justify-between" style={{ backgroundColor: COLORS.surface }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: COLORS.navy }}>
                        {taskIdx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold" style={{ color: COLORS.navy }}>{task.taskTitle}</h4>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{task.taskDescription}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: task.score >= 16 ? COLORS.success : task.score >= 12 ? '#CA8A04' : COLORS.error }}>
                        {task.score}<span className="text-sm" style={{ color: COLORS.textMuted }}>/{task.maxScore}</span>
                      </div>
                      <div className="text-xs" style={{ color: COLORS.textMuted }}>{task.gradingTime}</div>
                    </div>
                  </div>

                  {/* Criteria Scores */}
                  <div className="p-4 border-t" style={{ borderColor: COLORS.border }}>
                    <h5 className="text-sm font-bold mb-3" style={{ color: COLORS.navy }}>채점 기준별 점수</h5>
                    <div className="grid md:grid-cols-2 gap-3">
                      {task.criteria.map((criterion, idx) => (
                        <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: COLORS.navy }}>{criterion.name}</span>
                            <span className="text-sm font-bold" style={{ color: criterion.score >= criterion.maxScore * 0.8 ? COLORS.success : criterion.score >= criterion.maxScore * 0.6 ? '#CA8A04' : COLORS.error }}>
                              {criterion.score}/{criterion.maxScore}
                            </span>
                          </div>
                          <div className="w-full rounded-full h-1.5 mb-2" style={{ backgroundColor: COLORS.border }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${(criterion.score / criterion.maxScore) * 100}%`, backgroundColor: criterion.score >= criterion.maxScore * 0.8 ? COLORS.success : criterion.score >= criterion.maxScore * 0.6 ? '#CA8A04' : COLORS.error }} />
                          </div>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{criterion.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Feedback */}
                  <div className="p-4 border-t" style={{ borderColor: COLORS.border }}>
                    <h5 className="text-sm font-bold mb-2" style={{ color: COLORS.navy }}>AI 채점 피드백</h5>
                    <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>{task.feedback}</p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#ECFDF5' }}>
                        <h6 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: COLORS.success }}>
                          <CheckCircle2 className="w-3 h-3" /> 잘한 점
                        </h6>
                        <ul className="space-y-1">
                          {task.strengths.map((s, i) => (
                            <li key={i} className="text-xs" style={{ color: COLORS.navy }}>• {s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF9C3' }}>
                        <h6 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#CA8A04' }}>
                          <AlertCircle className="w-3 h-3" /> 개선할 점
                        </h6>
                        <ul className="space-y-1">
                          {task.improvements.map((s, i) => (
                            <li key={i} className="text-xs" style={{ color: COLORS.navy }}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rubric-based Feedback */}
        {DEMO_MODE && (
          <div className="bg-white rounded-lg p-8 border mb-8" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5" style={{ color: COLORS.gold }} />
              <h2 className="text-lg font-bold" style={{ color: COLORS.navy }}>루브릭 기반 역량 평가</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {(Object.keys(RUBRIC_FEEDBACK) as IndicatorType[]).map((key) => {
                const feedback = RUBRIC_FEEDBACK[key];
                const levelColors = {
                  excellent: { bg: '#ECFDF5', border: COLORS.success, text: COLORS.success, label: '우수', icon: '★★★' },
                  good: { bg: '#FEF9C3', border: '#CA8A04', text: '#CA8A04', label: '양호', icon: '★★☆' },
                  needs_improvement: { bg: '#FEE2E2', border: COLORS.error, text: COLORS.error, label: '보완 필요', icon: '★☆☆' },
                };
                const levelStyle = levelColors[feedback.level];

                return (
                  <div key={key} className="p-4 rounded-lg border" style={{ backgroundColor: levelStyle.bg, borderColor: levelStyle.border }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: COLORS.navy }}>{indicatorInfo[key].nameKo}</span>
                        <span className="text-xs" style={{ color: levelStyle.text }}>{levelStyle.icon}</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: levelStyle.border, color: 'white' }}>
                        {levelStyle.label}
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>{feedback.description}</p>
                    <div className="space-y-1">
                      {feedback.rubric.map((item, idx) => (
                        <p key={idx} className="text-xs" style={{ color: COLORS.navy }}>{item}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Job-specific Feedback - Detailed Version */}
        {DEMO_MODE && (
          <div className="bg-white rounded-lg border mb-8 overflow-hidden" style={{ borderColor: COLORS.border }}>
            {/* Header */}
            <div className="p-6" style={{ backgroundColor: COLORS.navy }}>
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-5 h-5" style={{ color: COLORS.gold }} />
                <h2 className="text-lg font-bold text-white">직무 대비 상세 피드백</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm px-3 py-1 rounded" style={{ backgroundColor: COLORS.goldMuted, color: COLORS.navy }}>
                  {jobInfo?.jobTitle || '인사관리 (HR)'}
                </span>
                {(() => {
                  const jobFeedback = JOB_FEEDBACK[selectedJobCode] || JOB_FEEDBACK['HR'];
                  return (
                    <span className="text-sm" style={{ color: COLORS.goldLight }}>
                      업계 평균 대비 {jobFeedback.industryBenchmark.yourRank}
                    </span>
                  );
                })()}
              </div>
            </div>

            {(() => {
              const jobFeedback = JOB_FEEDBACK[selectedJobCode] || JOB_FEEDBACK['HR'];
              return (
                <div className="p-6">
                  {/* Industry Benchmark */}
                  <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: COLORS.surface }}>
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.navy }}>
                      <BarChart3 className="w-4 h-4" style={{ color: COLORS.gold }} />
                      업계 벤치마크 비교
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold" style={{ color: COLORS.textMuted }}>{jobFeedback.industryBenchmark.avgScore}</div>
                        <div className="text-xs" style={{ color: COLORS.textMuted }}>업계 평균</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold" style={{ color: COLORS.navy }}>{totalPoints}</div>
                        <div className="text-xs" style={{ color: COLORS.gold }}>내 점수</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold" style={{ color: COLORS.success }}>{jobFeedback.industryBenchmark.topScore}</div>
                        <div className="text-xs" style={{ color: COLORS.textMuted }}>상위 10%</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full rounded-full h-3" style={{ backgroundColor: COLORS.border }}>
                        <div className="h-3 rounded-full relative" style={{ width: `${(totalPoints / 100) * 100}%`, backgroundColor: COLORS.navy }}>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: COLORS.gold }} />
                        </div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs" style={{ color: COLORS.textMuted }}>
                        <span>0</span>
                        <span>평균 {jobFeedback.industryBenchmark.avgScore}</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths with Scores */}
                  <div className="mb-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.success }}>
                      <Star className="w-4 h-4" />
                      직무별 강점 분석
                    </h3>
                    <div className="space-y-3">
                      {jobFeedback.strengths.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-lg border" style={{ backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold" style={{ color: COLORS.navy }}>{item.title}</span>
                            <span className="text-sm font-bold px-2 py-1 rounded" style={{ backgroundColor: COLORS.success, color: 'white' }}>
                              {item.score}점
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: COLORS.textMuted }}>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Improvements with Priority */}
                  <div className="mb-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#CA8A04' }}>
                      <AlertCircle className="w-4 h-4" />
                      개선 필요 영역
                    </h3>
                    <div className="space-y-3">
                      {jobFeedback.improvements.map((item, idx) => {
                        const priorityColors = {
                          high: { bg: '#FEE2E2', border: COLORS.error, label: '높음', labelBg: COLORS.error },
                          medium: { bg: '#FEF9C3', border: '#CA8A04', label: '중간', labelBg: '#CA8A04' },
                          low: { bg: COLORS.surface, border: COLORS.border, label: '낮음', labelBg: COLORS.textMuted },
                        };
                        const priority = priorityColors[item.priority];
                        return (
                          <div key={idx} className="p-4 rounded-lg border" style={{ backgroundColor: priority.bg, borderColor: priority.border }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold" style={{ color: COLORS.navy }}>{item.title}</span>
                              <span className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: priority.labelBg, color: 'white' }}>
                                우선순위: {priority.label}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: COLORS.textMuted }}>{item.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skill Gaps */}
                  <div className="mb-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.navy }}>
                      <TrendingUp className="w-4 h-4" style={{ color: COLORS.gold }} />
                      역량 갭 분석
                    </h3>
                    <div className="space-y-4">
                      {jobFeedback.skillGaps.map((gap, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: COLORS.navy }}>{gap.skill}</span>
                            <span className="text-xs" style={{ color: COLORS.textMuted }}>
                              현재 {gap.current}% → 목표 {gap.required}%
                            </span>
                          </div>
                          <div className="relative w-full rounded-full h-3" style={{ backgroundColor: COLORS.border }}>
                            {/* Current Level */}
                            <div className="absolute h-3 rounded-full" style={{ width: `${gap.current}%`, backgroundColor: gap.current >= gap.required ? COLORS.success : '#CA8A04' }} />
                            {/* Target Marker */}
                            <div className="absolute top-0 h-3 w-0.5" style={{ left: `${gap.required}%`, backgroundColor: COLORS.navy }} />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs" style={{ color: gap.current >= gap.required ? COLORS.success : '#CA8A04' }}>
                              {gap.current >= gap.required ? '목표 달성!' : `${gap.required - gap.current}% 개선 필요`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: COLORS.goldMuted, border: `1px solid ${COLORS.gold}` }}>
                    <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: COLORS.navy }}>
                      <Lightbulb className="w-4 h-4" style={{ color: COLORS.gold }} />
                      종합 평가 의견
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: COLORS.navy }}>{jobFeedback.recommendation}</p>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.navy }}>
                      <BookOpen className="w-4 h-4" style={{ color: COLORS.gold }} />
                      향후 학습 로드맵
                    </h3>
                    <div className="space-y-2">
                      {jobFeedback.nextSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: COLORS.surface }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: COLORS.navy }}>
                            {idx + 1}
                          </div>
                          <span className="text-sm flex-1" style={{ color: COLORS.navy }}>{step}</span>
                          <ArrowRight className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Improvements */}
        <div className="bg-white rounded-lg p-8 border mb-8" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5" style={{ color: COLORS.gold }} />
            <h2 className="text-lg font-bold" style={{ color: COLORS.navy }}>개선 영역</h2>
          </div>

          <div className="space-y-3">
            {improvements.map((item, index) => (
              <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: COLORS.goldMuted }}>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: COLORS.gold }}>{index + 1}</div>
                  <div>
                    <h3 className="font-bold mb-1" style={{ color: COLORS.navy }}>{item.title}</h3>
                    <p className="text-sm mb-1" style={{ color: COLORS.textMuted }}>{item.issue}</p>
                    <p className="text-sm" style={{ color: COLORS.navy }}>{item.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate */}
        {passed && certificate && (
          <div className="rounded-lg p-8 mb-8" style={{ backgroundColor: COLORS.navy }}>
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-5 h-5" style={{ color: COLORS.gold }} />
              <h2 className="text-lg font-bold text-white">인증서</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="w-16 h-16 rounded-lg mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.navy }}>
                  <Award className="w-8 h-8" style={{ color: COLORS.gold }} />
                </div>
                <div className="text-xl font-bold mb-1" style={{ color: COLORS.navy }}>AICT Essential</div>
                <div className="text-sm mb-2" style={{ color: COLORS.textMuted }}>AI 역량 인증</div>
                <div className="text-xs mb-1" style={{ color: COLORS.textMuted }}>{certificate.name}</div>
                <div className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                  인증번호: {certificate.certificateId}
                </div>
                <div className="inline-block px-4 py-2 rounded text-sm font-bold text-white" style={{ backgroundColor: COLORS.success }}>
                  {totalPoints}/100 PASS
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm" style={{ color: COLORS.goldLight }}>인증을 공유하세요</p>
                <button
                  onClick={handleLinkedInShare}
                  className="w-full px-4 py-3 bg-white rounded-lg font-medium flex items-center justify-center gap-2"
                  style={{ color: COLORS.navy }}
                >
                  <Share2 className="w-4 h-4" /> LinkedIn 공유
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border"
                  style={{ borderColor: COLORS.goldLight, color: COLORS.goldLight }}
                >
                  <Download className="w-4 h-4" /> PDF 다운로드
                </button>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border"
                  style={{ borderColor: COLORS.goldLight, color: COLORS.goldLight }}
                >
                  <QrCode className="w-4 h-4" /> QR코드 보기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {passed && certificate && (
            <button
              onClick={handleDownloadPDF}
              className="flex-1 px-6 py-4 bg-white border rounded-lg font-medium flex items-center justify-center gap-2"
              style={{ borderColor: COLORS.border, color: COLORS.navy }}
            >
              <Download className="w-5 h-5" /> 인증서 다운로드
            </button>
          )}
          <button
            onClick={() => user ? navigate('/dashboard') : navigate('/')}
            className="flex-1 px-6 py-4 text-white rounded-lg font-semibold"
            style={{ backgroundColor: COLORS.navy }}
          >
            {user ? '마이페이지로' : '홈으로'}
          </button>
        </div>

        {/* QR Modal */}
        {showQRModal && certificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="font-bold text-center mb-4" style={{ color: COLORS.navy }}>인증서 QR코드</h3>
              <div className="flex justify-center mb-4">
                <CertificateQRCode certificateId={certificate.certificateId} size={200} />
              </div>
              <p className="text-xs text-center mb-4" style={{ color: COLORS.textMuted }}>
                인증번호: {certificate.certificateId}<br />
                유효기간: {certificate.examDate} ~ {certificate.expiryDate}
              </p>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-3 rounded-lg font-medium text-white"
                style={{ backgroundColor: COLORS.navy }}
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {passed ? (
          <div className="mt-8 p-6 rounded-lg border" style={{ backgroundColor: '#ECFDF5', borderColor: COLORS.success }}>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6" style={{ color: COLORS.success }} />
              <div>
                <p className="font-bold mb-1" style={{ color: COLORS.navy }}>인증을 축하합니다!</p>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>AI 도구를 안전하고 효과적으로 사용할 수 있는 역량이 검증되었습니다.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {/* 불합격 안내 */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: '#FEF2F2', borderColor: COLORS.error }}>
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 flex-shrink-0" style={{ color: COLORS.error }} />
                <div>
                  <p className="font-bold mb-1" style={{ color: COLORS.navy }}>
                    {totalPoints >= 65 ? '아쉽게 불합격입니다' : '기초 역량 강화가 필요합니다'}
                  </p>
                  <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
                    {totalPoints >= 65
                      ? `합격까지 ${70 - totalPoints}점이 부족합니다. 위의 피드백을 참고하여 부족한 영역을 보완하면 충분히 합격할 수 있습니다.`
                      : 'AI 역량의 기초부터 차근차근 학습이 필요합니다. 교재를 통해 기본 개념을 익히고 다시 도전해 주세요.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.error, color: 'white' }}>
                      현재 점수: {totalPoints}점
                    </span>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.navy, color: 'white' }}>
                      합격 기준: 70점 이상
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 재응시 안내 */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: COLORS.goldMuted, borderColor: COLORS.gold }}>
              <div className="flex items-start gap-4">
                <BookOpen className="w-6 h-6 flex-shrink-0" style={{ color: COLORS.gold }} />
                <div className="flex-1">
                  <p className="font-bold mb-3" style={{ color: COLORS.navy }}>재응시 안내</p>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-white">
                      <p className="text-xs font-bold mb-1" style={{ color: COLORS.navy }}>재응시 가능 시점</p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>불합격일로부터 7일 후</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white">
                      <p className="text-xs font-bold mb-1" style={{ color: COLORS.navy }}>추천 학습 기간</p>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>
                        {totalPoints >= 65 ? '1~2주' : '3~4주'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-bold mb-2" style={{ color: COLORS.navy }}>집중 학습 추천 영역</p>
                  <div className="flex flex-wrap gap-2">
                    {improvements.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="text-xs px-3 py-1 rounded-full bg-white" style={{ color: COLORS.navy, border: `1px solid ${COLORS.border}` }}>
                        {item.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 학습 자료 링크 */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: 'white', borderColor: COLORS.border }}>
              <p className="font-bold mb-4" style={{ color: COLORS.navy }}>추천 학습 자료</p>
              <div className="space-y-3">
                <a
                  href="https://zakedu.github.io/genai-book/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ border: `1px solid ${COLORS.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5" style={{ color: COLORS.navy }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: COLORS.navy }}>AICT 공식 교재</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>AI 역량 기초부터 실무까지</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                </a>
                <button
                  onClick={() => navigate('/practice')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ border: `1px solid ${COLORS.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5" style={{ color: COLORS.navy }} />
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: COLORS.navy }}>연습 모드</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>시험과 동일한 형식으로 연습</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
