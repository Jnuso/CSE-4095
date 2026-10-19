import { BrowserRouter, HashRouter } from 'react-router'
import AppRoutes from './AppRoutes'
import './App.css'

export default function App() {
  const Router = import.meta.env.VITE_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}
