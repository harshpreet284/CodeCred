import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { Shell } from './components/CodeCred/Shell';
import { CodeCredLayout } from './components/CodeCred/CodeCredLayout';
import { EvidenceReport } from './components/CodeCred/EvidenceReport';
import { InterviewSession } from './components/CodeCred/InterviewSession';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<CodeCredLayout />}>
          <Route index element={<Shell />} />
          <Route path='projects/:analysisId' element={<EvidenceReport />} />
          <Route path='projects/:analysisId/interviews/:sessionId' element={<InterviewSession />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
