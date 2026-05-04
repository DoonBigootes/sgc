// =============================================================
// RUTA: GET /api/v1/inventario
// Módulo: Inventario — Existencia
// =============================================================
// Autenticación: manejada globalmente en index.js (verifyToken).
// req.user contiene: { id, username, role, storeName }
//
// Query params opcionales:
//   id_tienda  {number}  — filtra por tienda específica
//   producto   {string}  — busca por código o descripción (ILIKE)
// =============================================================

const express = require('express')
const router  = express.Router()
const db      = require('../../db')

// =============================================================
// GET /api/v1/inventario
// Lista el stock actual de todos los productos por tienda.
// Roles permitidos: Administrador, Administradora, Usuario Tienda
// =============================================================
router.get('/', async (req, res) => {
  try {
    const { id_tienda, producto } = req.query

    // ── Construcción dinámica de la query ─────────────────────
    const conditions = [
      'p.activo = true',
      't.activo = true',
    ]
    const params = []

    if (id_tienda) {
      params.push(Number(id_tienda))
      conditions.push(`t.id = $${params.length}`)
    }

    if (producto && producto.trim() !== '') {
      params.push(`%${producto.trim()}%`)
      const idx = params.length
      conditions.push(`(p.codigo ILIKE $${idx} OR p.descripcion ILIKE $${idx})`)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    const query = `
      SELECT
        i.id_producto,
        i.id_tienda,
        p.codigo,
        p.descripcion,
        t.nombre        AS nombre_tienda,
        i.cantidad
      FROM inventario i
      JOIN producto p ON p.id = i.id_producto
      JOIN tienda   t ON t.id = i.id_tienda
      ${whereClause}
      ORDER BY t.nombre ASC, p.descripcion ASC
    `

    const result = await db.query(query, params)

    return res.json(result.rows)

  } catch (err) {
    console.error('[GET /inventario] Error:', err.message)
    return res.status(500).json({ message: 'Error al obtener la existencia.' })
  }
})

module.exports = router