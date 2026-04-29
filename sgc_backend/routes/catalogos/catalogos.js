// ============================================================
// ARCHIVO: routes/catalogos.js
// Router genérico para todos los catálogos simples del SGC.
// Maneja: GET (listar), POST (crear), PUT (editar), DELETE (eliminar)
// ============================================================
//
// Catálogos soportados (slug → tabla en BD):
//   marcas              → marca
//   tipos-cliente       → tipo_cliente
//   tipos-producto      → tipo_producto
//   clasificaciones     → clasificacion_producto
//   unidades-medida     → unidad_medida
//   bancos              → banco
//   tipos-pago          → tipo_pago
//   tipos-factura       → tipo_factura
//   tipos-nota-credito  → tipo_nota_credito
//   tipos-traslado      → tipo_traslado
//   tipos-compra        → tipo_compra
//
// Todos comparten la misma estructura: id (PK), nombre (VARCHAR)
// ============================================================

const express = require('express')
const router  = express.Router()
const pool    = require('../../db')

// ── Mapa: slug de URL → nombre real de la tabla en PostgreSQL ────────────────
const CATALOG_TABLE_MAP = {
  'marcas':              'marca',
  'tipos-cliente':       'tipo_cliente',
  'tipos-producto':      'tipo_producto',
  'clasificaciones':     'clasificacion_producto',
  'unidades-medida':     'unidad_medida',
  'bancos':              'banco',
  'tipos-pago':          'tipo_pago',
  'tipos-factura':       'tipo_factura',
  'tipos-nota-credito':  'tipo_nota_credito',
  'tipos-traslado':      'tipo_traslado',
  'tipos-compra':        'tipo_compra',
}

// ── Middleware: valida que el slug sea un catálogo conocido ──────────────────
function resolveCatalog(req, res, next) {
  const tabla = CATALOG_TABLE_MAP[req.params.catalogo]
  if (!tabla) {
    return res.status(404).json({ message: `Catálogo "${req.params.catalogo}" no existe.` })
  }
  req.tabla = tabla   // disponible en los handlers
  next()
}

// ── GET /api/v1/:catalogo — Listar todos ─────────────────────────────────────
router.get('/:catalogo', resolveCatalog, async (req, res) => {
  try {
    // pg no permite pasar el nombre de tabla como parámetro ($1),
    // por eso usamos interpolación directa — es seguro aquí porque
    // la tabla viene del mapa controlado CATALOG_TABLE_MAP, no del usuario.
    const { rows } = await pool.query(
      `SELECT id, nombre FROM ${req.tabla} ORDER BY nombre ASC`
    )
    res.json(rows)
  } catch (err) {
    console.error(`[GET /${req.params.catalogo}]`, err.message)
    res.status(500).json({ message: 'Error al obtener los registros.' })
  }
})

// ── POST /api/v1/:catalogo — Crear ───────────────────────────────────────────
router.post('/:catalogo', resolveCatalog, async (req, res) => {
  const { nombre } = req.body

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ message: 'El campo "nombre" es requerido.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO ${req.tabla} (nombre) VALUES ($1) RETURNING id, nombre`,
      [nombre.trim()]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(`[POST /${req.params.catalogo}]`, err.message)
    // Detectar violación de UNIQUE si la tabla la tuviera
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un registro con ese nombre.' })
    }
    res.status(500).json({ message: 'Error al crear el registro.' })
  }
})

// ── PUT /api/v1/:catalogo/:id — Editar ───────────────────────────────────────
router.put('/:catalogo/:id', resolveCatalog, async (req, res) => {
  const id      = parseInt(req.params.id, 10)
  const { nombre } = req.body

  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido.' })
  }
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ message: 'El campo "nombre" es requerido.' })
  }

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE ${req.tabla}
          SET nombre               = $1,
              fecha_modificacion   = NOW()
        WHERE id = $2
       RETURNING id, nombre`,
      [nombre.trim(), id]
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Registro no encontrado.' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(`[PUT /${req.params.catalogo}/${id}]`, err.message)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un registro con ese nombre.' })
    }
    res.status(500).json({ message: 'Error al actualizar el registro.' })
  }
})

// ── DELETE /api/v1/:catalogo/:id — Eliminar ──────────────────────────────────
router.delete('/:catalogo/:id', resolveCatalog, async (req, res) => {
  const id = parseInt(req.params.id, 10)

  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido.' })
  }

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM ${req.tabla} WHERE id = $1`,
      [id]
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Registro no encontrado.' })
    }

    res.status(200).json({ message: 'Registro eliminado correctamente.' })
  } catch (err) {
    console.error(`[DELETE /${req.params.catalogo}/${id}]`, err.message)
    // FK violation: el registro está siendo usado en otra tabla
    if (err.code === '23503') {
      return res.status(409).json({
        message: 'No se puede eliminar: este registro está siendo usado en otros registros del sistema.',
      })
    }
    res.status(500).json({ message: 'Error al eliminar el registro.' })
  }
})

module.exports = router