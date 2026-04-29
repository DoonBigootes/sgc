const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // En producción (DigitalOcean Managed DB) habilitar SSL:
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
})

// Verificar conexión al arrancar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message)
  } else {
    release()
    console.log('✅ PostgreSQL conectado correctamente')
  }
})

module.exports = pool