import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router'
import AppRoutes from './AppRoutes'
import './App.css'

const createRouter =
  import.meta.env.VITE_ROUTER_MODE === 'hash' ? createHashRouter : createBrowserRouter
const router = createRouter([{ path: '*', element: <AppRoutes /> }])

export default function App() {
  return <RouterProvider router={router} />
}
