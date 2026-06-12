import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { JoinPage } from './pages/JoinPage'
import { FestivalPage } from './pages/FestivalPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/:code" element={<FestivalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
