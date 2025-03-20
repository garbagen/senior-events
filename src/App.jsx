import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import EventList from './components/EventList'
import AdminPanel from './components/AdminPanel'
import Header from './components/Header'
import Hero from './components/Hero'
import HelpPage from './components/HelpPage'
import MonthCalendar from './components/MonthCalendar'
import Information from './components/Information'

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Header />
        <Hero />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/eventos" element={<MonthCalendar />} />
            <Route path="/ayuda" element={<HelpPage />} />
            <Route path="/informacion" element={<Information />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App