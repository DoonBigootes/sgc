// ============================================================
// ARCHIVO: routes/inventario/traslados.js
// Módulo de traslados e ajustes de inventario del SGC.
//
// Endpoints:
//   GET  /api/v1/traslados      → Listar (filtros opcionales)
//   GET  /api/v1/traslados/:id  → Obtener uno con su detalle
//   POST /api/v1/traslados      → Crear traslado + detalle + actualizar inventario
//                                 (todo en una sola transacción)
//
// Query params (GET /):
//   id_tienda_origen   {number}  — filtra por tienda origen
//   id_tienda_destino  {number}  — filtra por tienda destino
//   fecha_desde        {date}    — filtra desde esta fecha (YYYY-MM-DD)
//   fecha_hasta        {date}    — filtra hasta esta fecha (YYYY-MM-DD)
//
// Tipos de traslado (seed):
//   1 → Traslado        (requiere origen Y destino)
//   2 → Ajuste Entrada  (solo destino — suma stock)
//   3 → Ajuste Salida   (solo origen  — resta stock)
//
// Tabla: traslado
//   id                SERIAL PK
//   id_tipo_traslado  INT NOT NULL FK → tipo_traslado(id)
//   id_tienda_origen  INT          FK → tienda(id)   (nullable para Ajuste Entrada)
//   id_tienda_destino INT          FK → tienda(id)   (nullable para Ajuste Salida)
//   descripcion       VARCHAR(255) NOT NULL
//
// Tabla: traslado_detalle
//   id           SERIAL PK
//   id_traslado  INT NOT NULL FK → traslado(id)
//   id_producto  INT NOT NULL FK → producto(id)
//   cantidad     DECIMAL(12,4) NOT NULL
// ============================================================

const express = require('express')
const router  = express.Router()
const pool    = require('../../db')

function parseId(param) {
  const id = parseInt(param, 10)
  return isNaN(id) ? null : id
}

// ── GET /api/v1/traslados ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { id_tienda_origen, id_tienda_destino, fecha_desde, fecha_hasta } = req.query
    const conditions = []
    const values     = []

    if (id_tienda_origen && id_tienda_origen !== '') {
      values.push(parseInt(id_tienda_origen, 10))
      conditions.push(`t.id_tienda_origen = $${values.length}`)
    }

    if (id_tienda_destino && id_tienda_destino !== '') {
      values.push(parseInt(id_tienda_destino, 10))
      conditions.push(`t.id_tienda_destino = $${values.length}`)
    }

    if (fecha_desde && fecha_desde !== '') {
      values.push(fecha_desde)
      conditions.push(`t.fecha_creacion >= $${values.length}::date`)
    }

    if (fecha_hasta && fecha_hasta !== '') {
      values.push(fecha_hasta)
      conditions.push(`t.fecha_creacion < ($${values.length}::date + INTERVAL '1 day')`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const { rows } = await pool.query(
      `SELECT
         t.id,
         t.id_tipo_traslado,
         tt.nombre                                  AS tipo_traslado,
         t.id_tienda_origen,
         to_.nombre                                 AS tienda_origen,
         t.id_tienda_destino,
         td_.nombre                                 AS tienda_destino,
         t.descripcion,
         t.fecha_creacion,
         COUNT(det.id)::int                         AS total_productos
       FROM traslado t
       JOIN tipo_traslado tt  ON tt.id  = t.id_tipo_traslado
       LEFT JOIN tienda to_   ON to_.id = t.id_tienda_origen
       LEFT JOIN tienda td_   ON td_.id = t.id_tienda_destino
       LEFT JOIN traslado_detalle det ON det.id_traslado = t.id
       ${where}
       GROUP BY t.id, tt.nombre, to_.nombre, td_.nombre
       ORDER BY t.fecha_creacion DESC`,
      values
    )

    res.json(rows)
  } catch (err) {
    console.error('[GET /traslados]', err.message)
    res.status(500).json({ message: 'Error al obtener los traslados.' })
  }
})

// ── GET /api/v1/traslados/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID inválido.' })

  try {
    // Cabecera del traslado
    const { rows: header } = await pool.query(
      `SELECT
         t.id,
         t.id_tipo_traslado,
         tt.nombre        AS tipo_traslado,
         t.id_tienda_origen,
         to_.nombre       AS tienda_origen,
         t.id_tienda_destino,
         td_.nombre       AS tienda_destino,
         t.descripcion,
         t.fecha_creacion
       FROM traslado t
       JOIN tipo_traslado tt ON tt.id  = t.id_tipo_traslado
       LEFT JOIN tienda to_  ON to_.id = t.id_tienda_origen
       LEFT JOIN tienda td_  ON td_.id = t.id_tienda_destino
       WHERE t.id = $1`,
      [id]
    )

    if (header.length === 0) {
      return res.status(404).json({ message: 'Traslado no encontrado.' })
    }

    // Detalle del traslado
    const { rows: detalle } = await pool.query(
      `SELECT
         det.id,
         det.id_producto,
         p.codigo,
         p.descripcion,
         det.cantidad
       FROM traslado_detalle det
       JOIN producto p ON p.id = det.id_producto
       WHERE det.id_traslado = $1
       ORDER BY p.descripcion ASC`,
      [id]
    )

    res.json({ ...header[0], detalle })
  } catch (err) {
    console.error(`[GET /traslados/${req.params.id}]`, err.message)
    res.status(500).json({ message: 'Error al obtener el traslado.' })
  }
})

// ── POST /api/v1/traslados ────────────────────────────────────────────────────
// Body:
//   {
//     id_tipo_traslado:  number,             — requerido
//     id_tienda_origen:  number | null,
//     id_tienda_destino: number | null,
//     descripcion:       string,             — requerido
//     detalle: [                             — requerido, mínimo 1 ítem
//       { id_producto: number, cantidad: number }
//     ]
//   }
//
// Lógica de inventario por tipo:
//   Traslado       → resta de origen, suma a destino
//   Ajuste Entrada → suma a destino
//   Ajuste Salida  → resta de origen
//
// Si un registro de inventario (id_producto, id_tienda) no existe
// al hacer INSERT en inventario lo crea con la cantidad indicada (ON CONFLICT DO UPDATE).
// ============================================================
router.post('/', async (req, res) => {
  const {
    id_tipo_traslado,
    id_tienda_origen,
    id_tienda_destino,
    descripcion,
    detalle,
  } = req.body

  // ── Validaciones básicas ──────────────────────────────────
  if (!id_tipo_traslado) {
    return res.status(400).json({ message: 'El campo "id_tipo_traslado" es requerido.' })
  }
  if (!descripcion || !String(descripcion).trim()) {
    return res.status(400).json({ message: 'El campo "descripcion" es requerido.' })
  }
  if (!Array.isArray(detalle) || detalle.length === 0) {
    return res.status(400).json({ message: 'Debe incluir al menos un producto en el detalle.' })
  }
  for (const item of detalle) {
    if (!item.id_producto || !item.cantidad || Number(item.cantidad) <= 0) {
      return res.status(400).json({
        message: 'Cada ítem del detalle debe tener "id_producto" y "cantidad" mayor a cero.',
      })
    }
  }

  // Determinar tipo para lógica de inventario (1=Traslado, 2=Ajuste Entrada, 3=Ajuste Salida)
  const tipo       = parseInt(id_tipo_traslado, 10)
  const origenId   = id_tienda_origen  ? parseInt(id_tienda_origen, 10)  : null
  const destinoId  = id_tienda_destino ? parseInt(id_tienda_destino, 10) : null

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Insertar cabecera del traslado
    const { rows: [traslado] } = await client.query(
      `INSERT INTO traslado (id_tipo_traslado, id_tienda_origen, id_tienda_destino, descripcion)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [tipo, origenId, destinoId, String(descripcion).trim()]
    )

    const id_traslado = traslado.id

    // 2. Insertar detalle y actualizar inventario por cada producto
    for (const item of detalle) {
      const idProducto = parseInt(item.id_producto, 10)
      const cantidad   = Number(item.cantidad)

      // 2a. Insertar fila de detalle
      await client.query(
        `INSERT INTO traslado_detalle (id_traslado, id_producto, cantidad)
         VALUES ($1, $2, $3)`,
        [id_traslado, idProducto, cantidad]
      )

      // 2b. Actualizar inventario según tipo de traslado
      //   tipo 1 (Traslado) y tipo 3 (Ajuste Salida) → restar de origen
      if ((tipo === 1 || tipo === 3) && origenId) {
        await client.query(
          `INSERT INTO inventario (id_producto, id_tienda, cantidad)
           VALUES ($1, $2, $3 * -1)
           ON CONFLICT (id_producto, id_tienda)
           DO UPDATE SET cantidad = inventario.cantidad - $3,
                         fecha_modificacion = NOW()`,
          [idProducto, origenId, cantidad]
        )
      }

      //   tipo 1 (Traslado) y tipo 2 (Ajuste Entrada) → sumar a destino
      if ((tipo === 1 || tipo === 2) && destinoId) {
        await client.query(
          `INSERT INTO inventario (id_producto, id_tienda, cantidad)
           VALUES ($1, $2, $3)
           ON CONFLICT (id_producto, id_tienda)
           DO UPDATE SET cantidad = inventario.cantidad + $3,
                         fecha_modificacion = NOW()`,
          [idProducto, destinoId, cantidad]
        )
      }
    }

    await client.query('COMMIT')

    // 3. Retornar el traslado creado con su detalle
    const { rows: [resultado] } = await pool.query(
      `SELECT
         t.id,
         t.id_tipo_traslado,
         tt.nombre   AS tipo_traslado,
         t.id_tienda_origen,
         to_.nombre  AS tienda_origen,
         t.id_tienda_destino,
         td_.nombre  AS tienda_destino,
         t.descripcion,
         t.fecha_creacion
       FROM traslado t
       JOIN tipo_traslado tt ON tt.id  = t.id_tipo_traslado
       LEFT JOIN tienda to_  ON to_.id = t.id_tienda_origen
       LEFT JOIN tienda td_  ON td_.id = t.id_tienda_destino
       WHERE t.id = $1`,
      [id_traslado]
    )

    const { rows: detalleResult } = await pool.query(
      `SELECT det.id, det.id_producto, p.codigo, p.descripcion, det.cantidad
       FROM traslado_detalle det
       JOIN producto p ON p.id = det.id_producto
       WHERE det.id_traslado = $1`,
      [id_traslado]
    )

    res.status(201).json({ ...resultado, detalle: detalleResult })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[POST /traslados]', err.message)

    if (err.code === '23503') {
      return res.status(400).json({
        message: 'Uno de los productos, tiendas o tipos indicados no existe en el sistema.',
      })
    }

    res.status(500).json({ message: 'Error al registrar el traslado.' })
  } finally {
    client.release()
  }
})

module.exports = router