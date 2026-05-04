// =============================================================
// ARCHIVO: middleware/auth.js
// Middleware de autenticación JWT para el SGC.
// =============================================================
// Uso:
//   const verifyToken = require('../middleware/auth')
//   router.get('/', verifyToken, handler)
//
// O aplicado globalmente en index.js (recomendado):
//   app.use('/api/v1', verifyToken)    ← protege TODAS las rutas de una vez
// =============================================================

const jwt        = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token      = authHeader?.split(' ')[1]   // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token requerido.' })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)   // { id, username, role, storeName }
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado.' })
  }
}

module.exports = verifyToken