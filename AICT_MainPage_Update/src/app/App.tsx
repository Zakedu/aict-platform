import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ExamProvider } from './context/ExamContext';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { RulesConsent } from './pages/RulesConsent';
import { Practice } from './pages/Practice';
import { Part1 } from './pages/Part1';
import { Part2 } from './pages/Part2';
import { Part3 } from './pages/Part3';
import { Results } from './pages/Results';

export default function App() {
  // GitHub Pages 배포를 위한 basename 설정
  const basename = import.meta.env.BASE_URL || '/';
  
  return (
    <ExamProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/rules" element={<RulesConsent />} />
          <Route path="/part1" element={<Part1 />} />
          <Route path="/part2" element={<Part2 />} />
          <Route path="/part3" element={<Part3 />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ExamProvider>
  );
}
