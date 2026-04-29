// ============================================================
// ARCHIVO: routes/vendedores.js
// Módulo de vendedores del SGC.
//
// Endpoints:
//   GET    /api/v1/vendedores        → Listar (filtro opcional: ?activo=true/false)
//   GET    /api/v1/vendedores/:id    → Obtener uno por ID
//   POST   /api/v1/vendedores        → Crear
//   PUT    /api/v1/vendedores/:id    → Editar
//   DELETE /api/v1/vendedores/:id    → Eliminar (verifica FK antes de borrar)
//
// Tabla: vendedor
//   id        SERIAL PK
//   nombre    VARCHAR(150) NOT NULL
//   cui       BIGINT       NOT NULL UNIQUE
//   nit       VARCHAR(20)
//   telefono  VARCHAR(20)
//   activo    BOOLEAN      DEFAULT true
//   + columnas de auditoría (fecha_creacion, id_usuario_creacion, ...)
// ============================================================

const express = require('express')
const router  = express.Router()
const pool    = require('../../db')

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Valida y parsea un ID de ruta.
 * Retorna el entero o null si es inválido.
 */
function parseId(param) {
  const id = parseInt(param, 10)
  return isNaN(id) ? null : id
}

/**
 * Valida los campos requeridos del body para crear / editar.
 * Retorna un string de error o null si todo está bien.
 */
function validateBody(body) {
  const { nombre, cui } = body

  if (!nombre || !String(nombre).trim()) {
    return 'El campo "nombre" es requerido.'
  }
  if (cui === undefined || cui === null || String(cui).trim() === '') {
    return 'El campo "cui" es requerido.'
  }
  if (!/^\d+$/.test(String(cui).trim())) {
    return 'El campo "cui" debe contener solo números.'
  }
  return null
}

// ── GET /api/v1/vendedores ────────────────────────────────────────────────────
// Retorna todos los vendedores.
// Query param opcional: ?activo=true  o  ?activo=false
router.get('/', async (req, res) => {
  try {
    // Filtro por activo si se envía el query param
    const { activo } = req.query
    const conditions = []
    const values     = []

    if (activo !== undefined) {
      // Acepta 'true'/'false' como string desde la URL
      conditions.push(`activo = $${values.length + 1}`)
      values.push(activo === 'true')
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const { rows } = await pool.query(
      `SELECT
         id,
         nombre,
         cui,
         nit,
         telefono,
         activo
       FROM vendedor
       ${where}
       ORDER BY nombre ASC`,
      values
    )

    res.json(rows)
  } catch (err) {
    console.error('[GET /vendedores]', err.message)
    res.status(500).json({ message: 'Error al obtener los vendedores.' })
  }
})

// ── GET /api/v1/vendedores/:id ────────────────────────────────────────────────
// Retorna un vendedor por ID.
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         nombre,
         cui,
         nit,
         telefono,
         activo
       FROM vendedor
       WHERE id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vendedor no encontrado.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[GET /vendedores/${req.params.id}]`, err.message)
    res.status(500).json({ message: 'Error al obtener el vendedor.' })
  }
})

// ── POST /api/v1/vendedores ───────────────────────────────────────────────────
// Crea un nuevo vendedor.
// Body requerido : { nombre, cui }
// Body opcional  : { nit, telefono }
router.post('/', async (req, res) => {
  const validationError = validateBody(req.body)
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const nombre   = String(req.body.nombre).trim()
  const cui      = BigInt(String(req.body.cui).trim())   // bigint en PostgreSQL
  const nit      = req.body.nit      ? String(req.body.nit).trim()      : null
  const telefono = req.body.telefono ? String(req.body.telefono).trim() : null

  try {
    const { rows } = await pool.query(
      `INSERT INTO vendedor (nombre, cui, nit, telefono)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, cui, nit, telefono, activo`,
      [nombre, cui.toString(), nit, telefono]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    console.error('[POST /vendedores]', err.message)

    if (err.code === '23505') {
      // Violación de UNIQUE — casi siempre es el CUI duplicado
      return res.status(409).json({
        message: 'Ya existe un vendedor registrado con ese CUI.',
      })
    }

    res.status(500).json({ message: 'Error al crear el vendedor.' })
  }
})

// ── PUT /api/v1/vendedores/:id ────────────────────────────────────────────────
// Actualiza todos los campos editables de un vendedor.
// Body requerido : { nombre, cui }
// Body opcional  : { nit, telefono, activo }
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  const validationError = validateBody(req.body)
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const nombre   = String(req.body.nombre).trim()
  const cui      = BigInt(String(req.body.cui).trim())
  const nit      = req.body.nit      ? String(req.body.nit).trim()      : null
  const telefono = req.body.telefono ? String(req.body.telefono).trim() : null
  // activo: si no viene en el body, mantiene el valor actual (no lo toca)
  const activo   = req.body.activo !== undefined ? Boolean(req.body.activo) : undefined

  try {
    // Si activo viene en el body, lo actualizamos; si no, lo dejamos intacto
    const activoClause = activo !== undefined
      ? ', activo = $6'
      : ''

    const values = activo !== undefined
      ? [nombre, cui.toString(), nit, telefono, id, activo]
      : [nombre, cui.toString(), nit, telefono, id]

    const { rows, rowCount } = await pool.query(
      `UPDATE vendedor
          SET nombre               = $1,
              cui                  = $2,
              nit                  = $3,
              telefono             = $4,
              fecha_modificacion   = NOW()
              ${activoClause}
        WHERE id = $5
       RETURNING id, nombre, cui, nit, telefono, activo`,
      values
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Vendedor no encontrado.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[PUT /vendedores/${id}]`, err.message)

    if (err.code === '23505') {
      return res.status(409).json({
        message: 'Ya existe un vendedor registrado con ese CUI.',
      })
    }

    res.status(500).json({ message: 'Error al actualizar el vendedor.' })
  }
})

// ── DELETE /api/v1/vendedores/:id ─────────────────────────────────────────────
// Elimina un vendedor permanentemente.
// Si el vendedor tiene facturas asociadas, PostgreSQL lanzará un error FK (23503)
// y se retorna 409 con un mensaje amigable.
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM vendedor WHERE id = $1`,
      [id]
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Vendedor no encontrado.' })
    }

    res.json({ message: 'Vendedor eliminado correctamente.' })
  } catch (err) {
    console.error(`[DELETE /vendedores/${id}]`, err.message)

    if (err.code === '23503') {
      // El vendedor tiene facturas u otros registros referenciándolo
      return res.status(409).json({
        message:
          'No se puede eliminar: este vendedor tiene facturas asociadas en el sistema.',
      })
    }

    res.status(500).json({ message: 'Error al eliminar el vendedor.' })
  }
})

module.exports = router