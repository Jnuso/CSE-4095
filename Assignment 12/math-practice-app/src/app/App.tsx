import { BrowserRouter } from 'react-router'
import AppRoutes from './AppRoutes'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
