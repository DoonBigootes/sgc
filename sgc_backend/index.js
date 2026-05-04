const express = require('express')
const jwt     = require('jsonwebtoken')
const cors    = require('cors')
require('dotenv').config()

const catalogosRouter  = require('./routes/catalogos/catalogos')
const vendedoresRouter = require('./routes/catalogos/vendedores')
const clientesRouter = require('./routes/catalogos/clientes')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// 🔍 DEBUG TEMPORAL — quitar antes de producción
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`)
  next()
})

// ─── Usuario temporal (quemado) para testing de auth ────────────────────────
// TODO: reemplazar por consulta real a la tabla `usuario` de PostgreSQL
const FAKE_USER = {
  id: 1,
  usuario: 'admin',
  contra: '1234',
  role: 'Administrador',
  storeName: 'Tienda Central',
}

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal'

// ─── AUTH ────────────────────────────────────────────────────────────────────
app.post('/api/v1/auth/login', (req, res) => {
  const { usuario, contra } = req.body

  if (usuario !== FAKE_USER.usuario || contra !== FAKE_USER.contra) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos' })
  }

  const token = jwt.sign(
    {
      id:        FAKE_USER.id,
      username:  FAKE_USER.usuario,
      role:      FAKE_USER.role,
      storeName: FAKE_USER.storeName,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  return res.json({
    token,
    user: {
      id:        FAKE_USER.id,
      username:  FAKE_USER.usuario,
      role:      FAKE_USER.role,
      storeName: FAKE_USER.storeName,
    },
  })
})


// Catalogos
app.use('/api/v1/clientes', clientesRouter)
app.use('/api/v1/vendedores', vendedoresRouter)
app.use('/api/v1', catalogosRouter)

// ─── 404 genérico ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Ruta ${req.method} ${req.path} no encontrada.` })
})

// ─── Error handler global ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err)
  res.status(500).json({ message: 'Error interno del servidor.' })
})

// ─── Arranque ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
})