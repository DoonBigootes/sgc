import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { loginService } from '../../services/auth.service'
import styles from './Login.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [contra, setContra] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [recordar, setRecordar] = useState(false)

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const data = await loginService(usuario, contra)
      login(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  // Captura Enter en cualquier input y lo detiene completamente
  // para que no se propague a ningún form padre en el árbol
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      if (!loading) handleSubmit()
    }
  }
  
  return (
    <div className={styles.root}>
      <div className={styles.gridBg} />
      <div className={styles.glow} />

      <div className={styles.left}>
        <div className={styles.brand}>
          <LogoMark />
          <span className={styles.brandText}>SGC</span>
        </div>
        <div className={styles.tagline}>
          Gestión<br />comercial<br /><strong>inteligente.</strong>
        </div>
        <div className={styles.bottomLabel}>Ciudad de Guatemala · v1.0</div>
      </div>

      <div className={styles.right}>
        <div className={styles.formWrap}>
          <h1 className={styles.heading}>Iniciar sesión</h1>
          <p className={styles.sub}>Ingresa tus credenciales para continuar</p>

          {error && (
            <div className={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sgc-usuario">Usuario</label>
            <input
              className={styles.input}
              id="sgc-usuario"
              type="text"
              placeholder="usuario"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sgc-contra">Contraseña</label>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                id="sgc-contra"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                value={contra}
                onChange={(e) => setContra(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className={styles.meta}>
            <button
              type="button"
              className={styles.checkWrap}
              onClick={() => setRecordar((v) => !v)}
            >
              <span className={`${styles.check} ${recordar ? styles.checkActive : ''}`}>
                {recordar && <CheckMark />}
              </span>
              <span className={styles.checkLabel}>Recordar sesión</span>
            </button>
          </div>

          <button
            type="button"
            className={`${styles.submitBtn} ${loading ? styles.submitLoading : ''}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit() }}
            disabled={loading}
          >
            {loading ? <Spinner /> : 'Ingresar'}
          </button>

          <div className={styles.divider} />
          <p className={styles.version}>sistema de gestión comercial · 2026</p>
        </div>
      </div>
    </div>
  )
}

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill="#1e1e1e" />
      <rect x="7" y="7" width="8" height="8" rx="1.5" fill="#d4a017" />
      <rect x="17" y="7" width="8" height="8" rx="1.5" fill="#2a2a2a" />
      <rect x="7" y="17" width="8" height="8" rx="1.5" fill="#2a2a2a" />
      <rect x="17" y="17" width="8" height="8" rx="1.5" fill="#d4a017" opacity="0.4" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function CheckMark() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
      stroke="#0e0e0e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'sgc-spin 0.7s linear infinite', display: 'block' }}>
      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.4" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}