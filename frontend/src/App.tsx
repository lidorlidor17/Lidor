import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { SitePlanPage } from './pages/SitePlanPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/site/:id" element={<SitePlanPage />} />
      </Routes>
    </BrowserRouter>
  )
}
