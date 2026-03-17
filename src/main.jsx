import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { AuditProvider } from './contexts/AuditContext'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AuditProvider>
          <App />
        </AuditProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
