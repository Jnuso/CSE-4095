import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import AppLayout from '../components/layout/AppLayout'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import PracticePage from '../pages/PracticePage'
import PracticeSetupPage from '../pages/PracticeSetupPage'
import SessionSummaryPage from '../pages/SessionSummaryPage'
import PracticeStorageProvider from '../components/storage/PracticeStorageProvider'
import { PageLoadError } from '../services/PageLoadError'

const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').catch((error: unknown) => {
    throw new PageLoadError(error)
  }),
)
const StatisticsPage = lazy(() =>
  import('../pages/StatisticsPage').catch((error: unknown) => {
    throw new PageLoadError(error)
  }),
)

export default function AppRoutes() {
  return (
    <PracticeStorageProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="practice/setup" element={<PracticeSetupPage />} />
          <Route path="practice/session" element={<PracticePage />} />
          <Route path="practice/summary" element={<SessionSummaryPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </PracticeStorageProvider>
  )
}
