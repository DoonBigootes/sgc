// ============================================================
// ARCHIVO: routes/admin/tiendas.js
// Módulo de tiendas del SGC.
//
// Endpoints:
//   GET   /api/v1/tiendas       → Listar todas
//   GET   /api/v1/tiendas/:id   → Obtener una por ID
//   POST  /api/v1/tiendas       → Crear
//   PUT   /api/v1/tiendas/:id   → Editar
//   PATCH /api/v1/tiendas/:id/estado → Activar / desactivar
//
// Tabla: tienda
//   id             SERIAL PK
//   nombre         VARCHAR(100) NOT NULL
//   activo         BOOLEAN NOT NULL DEFAULT true
//   bodega_central BOOLEAN NOT NULL DEFAULT false
//   + columnas de auditoría
// ============================================================

const express = require('express')
const router  = express.Router()
const pool    = require('../../db')

function parseId(param) {
  const id = parseInt(param, 10)
  return isNaN(id) ? null : id
}

// ── GET /api/v1/tiendas ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { activo } = req.query
    const conditions = []
    const values     = []

    if (activo !== undefined) {
      conditions.push(`activo = $${values.length + 1}`)
      values.push(activo === 'true')
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const { rows } = await pool.query(
      `SELECT id, nombre, activo, bodega_central
       FROM tienda
       ${where}
       ORDER BY nombre ASC`,
      values
    )

    res.json(rows)
  } catch (err) {
    console.error('[GET /tiendas]', err.message)
    res.status(500).json({ message: 'Error al obtener las tiendas.' })
  }
})

// ── GET /api/v1/tiendas/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, activo, bodega_central FROM tienda WHERE id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tienda no encontrada.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[GET /tiendas/${req.params.id}]`, err.message)
    res.status(500).json({ message: 'Error al obtener la tienda.' })
  }
})

// ── POST /api/v1/tiendas ──────────────────────────────────────────────────────
// Body requerido : { nombre }
// Body opcional  : { bodega_central }
router.post('/', async (req, res) => {
  const { nombre, bodega_central } = req.body

  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ message: 'El campo "nombre" es requerido.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO tienda (nombre, bodega_central)
       VALUES ($1, $2)
       RETURNING id, nombre, activo, bodega_central`,
      [String(nombre).trim(), Boolean(bodega_central)]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    console.error('[POST /tiendas]', err.message)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Ya existe una tienda con ese nombre.' })
    }
    res.status(500).json({ message: 'Error al crear la tienda.' })
  }
})

// ── PUT /api/v1/tiendas/:id ───────────────────────────────────────────────────
// Body requerido : { nombre }
// Body opcional  : { bodega_central }
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  const { nombre, bodega_central } = req.body

  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ message: 'El campo "nombre" es requerido.' })
  }

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE tienda
          SET nombre               = $1,
              bodega_central       = $2,
              fecha_modificacion   = NOW()
        WHERE id = $3
       RETURNING id, nombre, activo, bodega_central`,
      [String(nombre).trim(), Boolean(bodega_central), id]
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Tienda no encontrada.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[PUT /tiendas/${id}]`, err.message)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Ya existe una tienda con ese nombre.' })
    }
    res.status(500).json({ message: 'Error al actualizar la tienda.' })
  }
})

// ── PATCH /api/v1/tiendas/:id/estado ─────────────────────────────────────────
// Body requerido: { activo: boolean }
router.patch('/:id/estado', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  if (req.body.activo === undefined || req.body.activo === null) {
    return res.status(400).json({ message: 'El campo "activo" es requerido.' })
  }

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE tienda
          SET activo             = $1,
              fecha_modificacion = NOW()
        WHERE id = $2
       RETURNING id, nombre, activo, bodega_central`,
      [Boolean(req.body.activo), id]
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Tienda no encontrada.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[PATCH /tiendas/${id}/estado]`, err.message)
    res.status(500).json({ message: 'Error al actualizar el estado de la tienda.' })
  }
})

module.exports = router