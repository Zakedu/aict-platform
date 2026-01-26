# AICT Main Page Development Brief

## 📅 Last Updated: 2026-01-26

---

## ✅ Completed Steps

### Step 1: Project Structure Analysis
- Confirmed existing pages: Landing, RulesConsent, Practice, Part1, Part2, Part3, Results
- Identified routing in App.tsx

### Step 2: Home.tsx Created (683 lines)
- Location: `/home/claude/mvp2/src/app/pages/Home.tsx`
- Components:
  - GNB (Glassmorphism style)
  - HeroSection (centered, Apple-style)
  - StatsSection (88% vs 5%)
  - CompetenciesSection (6 competencies bento grid)
  - ExamStructureSection (Part 1/2/3)
  - FAQSection (5 items, accordion)
  - Footer (minimal)

### Step 3: App.tsx Updated
- Added Home import
- Changed `/` route to Home
- Added `/landing` route for old Landing page
- Added basename for GitHub Pages

### Step 4: Build Test
- TypeScript syntax verified
- Ready for npm build

---

## 🎨 Design System

### Colors
```
Slate (Primary):
- 900: #0f172a (main background)
- 800: #1e293b (section background)
- 700: #334155 (borders)
- 400: #94a3b8 (secondary text)
- 200: #e2e8f0 (light text)

Green (Accent):
- 600: #059669 (dark accent)
- 500: #10b981 (primary accent)
- 400: #34d399 (hover state)
```

### GNB Style
- Glassmorphism: `rgba(15, 23, 42, 0.7)` + `backdrop-filter: blur(12px)`
- Fixed position, z-50
- Menu: 시험 응시 | 교재 (external) | 결과 조회

---

## 📁 File Changes

| File | Action | Status |
|------|--------|--------|
| `/src/app/pages/Home.tsx` | Created | ✅ |
| `/src/app/App.tsx` | Modified | ✅ |

---

## 🔜 Next Steps

### Pending
1. Build and deploy to GitHub Pages
2. Test all navigation links
3. Verify responsive design
4. Test glassmorphism on different browsers

### Optional Enhancements
- Add smooth scroll animations
- Add loading states
- Add mobile hamburger menu
- Add dark/light mode toggle

---

## 📋 Page Structure

```
/                 → Home (NEW)
/landing          → Landing (시험 소개)
/practice         → Practice
/rules            → RulesConsent
/part1            → Part1
/part2            → Part2
/part3            → Part3
/results          → Results
```

---

## 🔗 External Links

- 교재: https://zakedu.github.io/genai-book/ (새 탭)

---

## 📊 Content Reference (from Figma)

### Stats
- 88% AI 사용률
- 5% 실제 임팩트
- 12% 체계적 AI 교육
- Source: EY Survey, 29개국 15,000명+

### 6 Competencies
1. Defining (문제 정의)
2. Prompting (프롬프트 설계)
3. Refining (결과 검증)
4. Protecting (데이터 보호)
5. Acumen (비즈니스 판단)
6. Integrating (업무 통합)

### Exam Structure (Essential)
- Part 1: 15분, 10문항, AI 리터러시
- Part 2: 20분, 5문항, 프롬프트 문해력
- Part 3: 40분, 4문항, 직무 시나리오
- Total: 75분, 19문항

---

## 🚀 Deployment

Target: https://zakedu.github.io/aict-platform/

Build command: `npm run build`
Output: `dist/`
