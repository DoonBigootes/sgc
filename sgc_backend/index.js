const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Usuario falso para probar — luego esto vendrá de la BD
const FAKE_USER = {
  id: 1,
  usuario: 'admin',
  contra: '1234',
  role: 'Administrador',
  storeName: 'Tienda Central',
}

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal'

app.post('/api/v1/auth/login', (req, res) => {
  const { usuario, contra } = req.body

  if (usuario !== FAKE_USER.usuario || contra !== FAKE_USER.contra) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos' })
  }

  const token = jwt.sign(
    {
      id: FAKE_USER.id,
      username: FAKE_USER.usuario,
      role: FAKE_USER.role,
      storeName: FAKE_USER.storeName,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  return res.json({
    token,
    user: {
      id: FAKE_USER.id,
      username: FAKE_USER.usuario,
      role: FAKE_USER.role,
      storeName: FAKE_USER.storeName,
    },
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
})