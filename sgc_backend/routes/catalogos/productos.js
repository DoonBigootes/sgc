// ============================================================
// ARCHIVO: routes/catalogos/productos.js
// Módulo de productos del SGC.
//
// Endpoints:
//   GET    /api/v1/productos                     → Listar (filtros: ?activo, ?tipo, ?clasificacion, ?marca)
//   GET    /api/v1/productos/:id                 → Obtener uno por ID (incluye costo vigente)
//   POST   /api/v1/productos                     → Crear
//   PUT    /api/v1/productos/:id                 → Editar
//   PATCH  /api/v1/productos/:id/estado          → Activar / desactivar
//   GET    /api/v1/productos/:id/historial-costo → Historial de costos
//
// Tabla: producto
//   id               SERIAL PK
//   codigo           VARCHAR(50)   NOT NULL UNIQUE
//   descripcion      VARCHAR(255)  NOT NULL
//   id_marca         INT           FK → marca(id)              (nullable)
//   id_tipo_producto INT           NOT NULL FK → tipo_producto(id)
//   id_clasificacion INT           NOT NULL FK → clasificacion_producto(id)
//   id_unidad_medida INT           FK → unidad_medida(id)      (nullable)
//   precio_venta     DECIMAL(12,2) NOT NULL
//   activo           BOOLEAN       NOT NULL DEFAULT true
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
  if (!body.codigo || !String(body.codigo).trim()) {
    return 'El campo "codigo" es requerido.'
  }
  if (!body.descripcion || !String(body.descripcion).trim()) {
    return 'El campo "descripcion" es requerido.'
  }
  if (!body.id_tipo_producto) {
    return 'El campo "id_tipo_producto" es requerido.'
  }
  if (!body.id_clasificacion) {
    return 'El campo "id_clasificacion" es requerido.'
  }
  if (body.precio_venta === undefined || body.precio_venta === null || body.precio_venta === '') {
    return 'El campo "precio_venta" es requerido.'
  }
  if (isNaN(Number(body.precio_venta)) || Number(body.precio_venta) < 0) {
    return 'El campo "precio_venta" debe ser un número válido mayor o igual a cero.'
  }
  return null
}

// ── SELECT base (reutilizado en GET / y GET /:id) ─────────────────────────────
const BASE_SELECT = `
  SELECT
    p.id,
    p.codigo,
    p.descripcion,
    p.id_marca,
    m.nombre         AS marca,
    p.id_tipo_producto,
    tp.nombre        AS tipo_producto,
    p.id_clasificacion,
    cp.nombre        AS clasificacion,
    p.id_unidad_medida,
    um.nombre        AS unidad_medida,
    p.precio_venta,
    p.activo
  FROM producto p
  LEFT JOIN marca                  m  ON m.id  = p.id_marca
  INNER JOIN tipo_producto         tp ON tp.id = p.id_tipo_producto
  INNER JOIN clasificacion_producto cp ON cp.id = p.id_clasificacion
  LEFT JOIN unidad_medida          um ON um.id  = p.id_unidad_medida
`

// ── GET /api/v1/productos ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { activo, tipo, clasificacion, marca } = req.query
    const conditions = []
    const values     = []

    if (activo !== undefined) {
      conditions.push(`p.activo = $${values.length + 1}`)
      values.push(activo === 'true')
    }

    if (tipo !== undefined) {
      const v = parseInt(tipo, 10)
      if (isNaN(v)) return res.status(400).json({ message: 'El parámetro "tipo" debe ser un ID numérico.' })
      conditions.push(`p.id_tipo_producto = $${values.length + 1}`)
      values.push(v)
    }

    if (clasificacion !== undefined) {
      const v = parseInt(clasificacion, 10)
      if (isNaN(v)) return res.status(400).json({ message: 'El parámetro "clasificacion" debe ser un ID numérico.' })
      conditions.push(`p.id_clasificacion = $${values.length + 1}`)
      values.push(v)
    }

    if (marca !== undefined) {
      const v = parseInt(marca, 10)
      if (isNaN(v)) return res.status(400).json({ message: 'El parámetro "marca" debe ser un ID numérico.' })
      conditions.push(`p.id_marca = $${values.length + 1}`)
      values.push(v)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const { rows } = await pool.query(
      `${BASE_SELECT} ${where} ORDER BY p.descripcion ASC`,
      values
    )

    res.json(rows)
  } catch (err) {
    console.error('[GET /productos]', err.message)
    res.status(500).json({ message: 'Error al obtener los productos.' })
  }
})

// ── GET /api/v1/productos/:id ─────────────────────────────────────────────────
// Incluye el costo vigente desde historial_de_costo.
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  try {
    const { rows } = await pool.query(
      `${BASE_SELECT},
        (
          SELECT h.costo
          FROM   historial_de_costo h
          WHERE  h.id_producto = p.id
            AND  h.fecha_inicio_vigencia <= CURRENT_DATE
            AND  (h.fecha_fin_vigencia IS NULL OR h.fecha_fin_vigencia >= CURRENT_DATE)
          ORDER BY h.fecha_inicio_vigencia DESC
          LIMIT 1
        ) AS costo_vigente
       WHERE p.id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[GET /productos/${req.params.id}]`, err.message)
    res.status(500).json({ message: 'Error al obtener el producto.' })
  }
})

// ── POST /api/v1/productos ────────────────────────────────────────────────────
// Body requerido : { codigo, descripcion, id_tipo_producto, id_clasificacion, precio_venta }
// Body opcional  : { id_marca, id_unidad_medida }
router.post('/', async (req, res) => {
  const err = validateBody(req.body)
  if (err) return res.status(400).json({ message: err })

  const codigo           = String(req.body.codigo).trim()
  const descripcion      = String(req.body.descripcion).trim()
  const id_tipo_producto = parseInt(req.body.id_tipo_producto, 10)
  const id_clasificacion = parseInt(req.body.id_clasificacion, 10)
  const precio_venta     = Number(req.body.precio_venta)
  const id_marca         = req.body.id_marca         ? parseInt(req.body.id_marca, 10)         : null
  const id_unidad_medida = req.body.id_unidad_medida ? parseInt(req.body.id_unidad_medida, 10) : null

  try {
    const { rows } = await pool.query(
      `INSERT INTO producto
         (codigo, descripcion, id_tipo_producto, id_clasificacion, precio_venta, id_marca, id_unidad_medida)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, codigo, descripcion, id_tipo_producto, id_clasificacion,
                 precio_venta, id_marca, id_unidad_medida, activo`,
      [codigo, descripcion, id_tipo_producto, id_clasificacion, precio_venta, id_marca, id_unidad_medida]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    console.error('[POST /productos]', err.message)

    if (err.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un producto registrado con ese código.' })
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Uno de los catálogos seleccionados (tipo, clasificación, marca o unidad) no existe.' })
    }

    res.status(500).json({ message: 'Error al crear el producto.' })
  }
})

// ── PUT /api/v1/productos/:id ─────────────────────────────────────────────────
// Body requerido : { codigo, descripcion, id_tipo_producto, id_clasificacion, precio_venta }
// Body opcional  : { id_marca, id_unidad_medida, activo }
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  const err = validateBody(req.body)
  if (err) return res.status(400).json({ message: err })

  const codigo           = String(req.body.codigo).trim()
  const descripcion      = String(req.body.descripcion).trim()
  const id_tipo_producto = parseInt(req.body.id_tipo_producto, 10)
  const id_clasificacion = parseInt(req.body.id_clasificacion, 10)
  const precio_venta     = Number(req.body.precio_venta)
  const id_marca         = req.body.id_marca         ? parseInt(req.body.id_marca, 10)         : null
  const id_unidad_medida = req.body.id_unidad_medida ? parseInt(req.body.id_unidad_medida, 10) : null
  const activo           = req.body.activo !== undefined ? Boolean(req.body.activo) : undefined

  try {
    const activoClause = activo !== undefined ? ', activo = $9' : ''
    const values = activo !== undefined
      ? [codigo, descripcion, id_tipo_producto, id_clasificacion, precio_venta, id_marca, id_unidad_medida, activo, id]
      : [codigo, descripcion, id_tipo_producto, id_clasificacion, precio_venta, id_marca, id_unidad_medida, id]

    const idParam = `$${values.length}`

    const { rows, rowCount } = await pool.query(
      `UPDATE producto
          SET codigo             = $1,
              descripcion        = $2,
              id_tipo_producto   = $3,
              id_clasificacion   = $4,
              precio_venta       = $5,
              id_marca           = $6,
              id_unidad_medida   = $7,
              fecha_modificacion = NOW()
              ${activoClause}
        WHERE id = ${idParam}
       RETURNING id, codigo, descripcion, id_tipo_producto, id_clasificacion,
                 precio_venta, id_marca, id_unidad_medida, activo`,
      values
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[PUT /productos/${id}]`, err.message)

    if (err.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un producto registrado con ese código.' })
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Uno de los catálogos seleccionados (tipo, clasificación, marca o unidad) no existe.' })
    }

    res.status(500).json({ message: 'Error al actualizar el producto.' })
  }
})

// ── PATCH /api/v1/productos/:id/estado ───────────────────────────────────────
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
      `UPDATE producto
          SET activo             = $1,
              fecha_modificacion = NOW()
        WHERE id = $2
       RETURNING id, codigo, descripcion, activo`,
      [activo, id]
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[PATCH /productos/${id}/estado]`, err.message)
    res.status(500).json({ message: 'Error al actualizar el estado del producto.' })
  }
})

// ── GET /api/v1/productos/:id/historial-costo ─────────────────────────────────
router.get('/:id/historial-costo', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  try {
    // Verificar que el producto existe
    const { rowCount } = await pool.query(
      'SELECT id FROM producto WHERE id = $1',
      [id]
    )
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' })
    }

    const { rows } = await pool.query(
      `SELECT
         id,
         id_producto,
         fecha_inicio_vigencia,
         fecha_fin_vigencia,
         costo
       FROM historial_de_costo
       WHERE id_producto = $1
       ORDER BY fecha_inicio_vigencia DESC`,
      [id]
    )

    res.json(rows)
  } catch (err) {
    console.error(`[GET /productos/${req.params.id}/historial-costo]`, err.message)
    res.status(500).json({ message: 'Error al obtener el historial de costos.' })
  }
})

module.exports = router