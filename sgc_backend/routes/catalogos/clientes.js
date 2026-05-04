// ============================================================
// ARCHIVO: routes/clientes.js
// Módulo de clientes del SGC.
//
// Endpoints:
//   GET    /api/v1/clientes             → Listar (filtros: ?activo=true/false, ?tipo=<id>)
//   GET    /api/v1/clientes/:id         → Obtener uno por ID
//   POST   /api/v1/clientes             → Crear
//   PUT    /api/v1/clientes/:id         → Editar
//   PATCH  /api/v1/clientes/:id/estado  → Activar / desactivar
//   DELETE /api/v1/clientes/:id         → Eliminar (verifica FK antes de borrar)
//
// Tabla: cliente
//   id               SERIAL PK
//   codigo           VARCHAR(50)   NOT NULL UNIQUE
//   nit              VARCHAR(20)   NOT NULL
//   nombre           VARCHAR(150)
//   direccion        VARCHAR(255)
//   solo_contado     BOOLEAN       DEFAULT false
//   limite_credito   NUMERIC(12,2)
//   id_tipo_cliente  INT           FK → tipo_cliente(id)
//   activo           BOOLEAN       DEFAULT true
//   telefono         INTEGER
//   + columnas de auditoría
// ============================================================

const express = require('express')
const router  = express.Router()
const pool    = require('../../db')

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseId(param) {
  const id = parseInt(param, 10)
  return isNaN(id) ? null : id
}

function validateBody(body) {
  const { codigo, nit } = body

  if (!codigo || !String(codigo).trim()) {
    return 'El campo "codigo" es requerido.'
  }
  if (!nit || !String(nit).trim()) {
    return 'El campo "nit" es requerido.'
  }
  if (
    body.limite_credito !== undefined &&
    body.limite_credito !== null &&
    body.limite_credito !== '' &&
    isNaN(Number(body.limite_credito))
  ) {
    return 'El campo "limite_credito" debe ser un número válido.'
  }
  return null
}

// ── GET /api/v1/clientes ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { activo, tipo } = req.query
    const conditions       = []
    const values           = []

    if (activo !== undefined) {
      conditions.push(`c.activo = $${values.length + 1}`)
      values.push(activo === 'true')
    }

    if (tipo !== undefined) {
      const tipoId = parseInt(tipo, 10)
      if (isNaN(tipoId)) {
        return res.status(400).json({ message: 'El parámetro "tipo" debe ser un ID numérico.' })
      }
      conditions.push(`c.id_tipo_cliente = $${values.length + 1}`)
      values.push(tipoId)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const { rows } = await pool.query(
      `SELECT
         c.id,
         c.codigo,
         c.nit,
         c.nombre,
         c.direccion,
         c.telefono,
         c.solo_contado,
         c.limite_credito,
         c.id_tipo_cliente,
         tc.nombre AS tipo_cliente,
         c.activo
       FROM cliente c
       LEFT JOIN tipo_cliente tc ON tc.id = c.id_tipo_cliente
       ${where}
       ORDER BY c.nombre ASC NULLS LAST, c.codigo ASC`,
      values
    )

    res.json(rows)
  } catch (err) {
    console.error('[GET /clientes]', err.message)
    res.status(500).json({ message: 'Error al obtener los clientes.' })
  }
})

// ── GET /api/v1/clientes/:id ──────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  try {
    const { rows } = await pool.query(
      `SELECT
         c.id,
         c.codigo,
         c.nit,
         c.nombre,
         c.direccion,
         c.telefono,
         c.solo_contado,
         c.limite_credito,
         c.id_tipo_cliente,
         tc.nombre AS tipo_cliente,
         c.activo
       FROM cliente c
       LEFT JOIN tipo_cliente tc ON tc.id = c.id_tipo_cliente
       WHERE c.id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[GET /clientes/${req.params.id}]`, err.message)
    res.status(500).json({ message: 'Error al obtener el cliente.' })
  }
})

// ── POST /api/v1/clientes ─────────────────────────────────────────────────────
// Body requerido : { codigo, nit }
// Body opcional  : { nombre, direccion, telefono, solo_contado, limite_credito, id_tipo_cliente }
router.post('/', async (req, res) => {
  const validationError = validateBody(req.body)
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const codigo          = String(req.body.codigo).trim()
  const nit             = String(req.body.nit).trim()
  const nombre          = req.body.nombre    ? String(req.body.nombre).trim()    : null
  const direccion       = req.body.direccion ? String(req.body.direccion).trim() : null
  const telefono        = req.body.telefono  != null && req.body.telefono !== ''
    ? parseInt(req.body.telefono, 10)
    : null
  const solo_contado    = Boolean(req.body.solo_contado)
  const limite_credito  = req.body.limite_credito != null && req.body.limite_credito !== ''
    ? Number(req.body.limite_credito)
    : null
  const id_tipo_cliente = req.body.id_tipo_cliente
    ? parseInt(req.body.id_tipo_cliente, 10)
    : null

  try {
    const { rows } = await pool.query(
      `INSERT INTO cliente
         (codigo, nit, nombre, direccion, telefono, solo_contado, limite_credito, id_tipo_cliente)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING
         id, codigo, nit, nombre, direccion, telefono,
         solo_contado, limite_credito, id_tipo_cliente, activo`,
      [codigo, nit, nombre, direccion, telefono, solo_contado, limite_credito, id_tipo_cliente]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    console.error('[POST /clientes]', err.message)

    if (err.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un cliente registrado con ese código.' })
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'El tipo de cliente seleccionado no existe.' })
    }

    res.status(500).json({ message: 'Error al crear el cliente.' })
  }
})

// ── PUT /api/v1/clientes/:id ──────────────────────────────────────────────────
// Body requerido : { codigo, nit }
// Body opcional  : { nombre, direccion, telefono, solo_contado, limite_credito, id_tipo_cliente, activo }
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  const validationError = validateBody(req.body)
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const codigo          = String(req.body.codigo).trim()
  const nit             = String(req.body.nit).trim()
  const nombre          = req.body.nombre    ? String(req.body.nombre).trim()    : null
  const direccion       = req.body.direccion ? String(req.body.direccion).trim() : null
  const telefono        = req.body.telefono  != null && req.body.telefono !== ''
    ? parseInt(req.body.telefono, 10)
    : null
  const solo_contado    = Boolean(req.body.solo_contado)
  const limite_credito  = req.body.limite_credito != null && req.body.limite_credito !== ''
    ? Number(req.body.limite_credito)
    : null
  const id_tipo_cliente = req.body.id_tipo_cliente
    ? parseInt(req.body.id_tipo_cliente, 10)
    : null
  // activo: si no viene en el body lo dejamos intacto
  const activo          = req.body.activo !== undefined
    ? Boolean(req.body.activo)
    : undefined

  try {
    // $1…$8 siempre presentes; $9 (activo) solo si viene en el body
    const activoClause = activo !== undefined ? ', activo = $9' : ''

    const values = activo !== undefined
      ? [codigo, nit, nombre, direccion, telefono, solo_contado, limite_credito, id_tipo_cliente, activo, id]
      : [codigo, nit, nombre, direccion, telefono, solo_contado, limite_credito, id_tipo_cliente, id]

    // id siempre es el último parámetro
    const idParam = `$${values.length}`

    const { rows, rowCount } = await pool.query(
      `UPDATE cliente
          SET codigo             = $1,
              nit                = $2,
              nombre             = $3,
              direccion          = $4,
              telefono           = $5,
              solo_contado       = $6,
              limite_credito     = $7,
              id_tipo_cliente    = $8,
              fecha_modificacion = NOW()
              ${activoClause}
        WHERE id = ${idParam}
       RETURNING
         id, codigo, nit, nombre, direccion, telefono,
         solo_contado, limite_credito, id_tipo_cliente, activo`,
      values
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[PUT /clientes/${id}]`, err.message)

    if (err.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un cliente registrado con ese código.' })
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'El tipo de cliente seleccionado no existe.' })
    }

    res.status(500).json({ message: 'Error al actualizar el cliente.' })
  }
})

// ── PATCH /api/v1/clientes/:id/estado ────────────────────────────────────────
// Activa o desactiva un cliente sin modificar el resto de sus datos.
// Body requerido: { activo: boolean }
router.patch('/:id/estado', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  if (req.body.activo === undefined || req.body.activo === null) {
    return res.status(400).json({ message: 'El campo "activo" es requerido.' })
  }

  const activo = Boolean(req.body.activo)

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE cliente
          SET activo             = $1,
              fecha_modificacion = NOW()
        WHERE id = $2
       RETURNING id, codigo, nit, nombre, activo`,
      [activo, id]
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[PATCH /clientes/${id}/estado]`, err.message)
    res.status(500).json({ message: 'Error al actualizar el estado del cliente.' })
  }
})

// ── DELETE /api/v1/clientes/:id ───────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM cliente WHERE id = $1`,
      [id]
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' })
    }

    res.json({ message: 'Cliente eliminado correctamente.' })
  } catch (err) {
    console.error(`[DELETE /clientes/${id}]`, err.message)

    if (err.code === '23503') {
      return res.status(409).json({
        message: 'No se puede eliminar: este cliente tiene facturas u otros registros asociados.',
      })
    }

    res.status(500).json({ message: 'Error al eliminar el cliente.' })
  }
})

module.exports = router