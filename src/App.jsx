import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import RecordPage from './pages/RecordPage'
import EditorPage from './pages/EditorPage'
import AnimationEditorPage from './pages/AnimationEditorPage'
import BookPage from './pages/BookPage'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<RecordPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/editor/:id" element={<AnimationEditorPage />} />
          <Route path="/books" element={<BookPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
