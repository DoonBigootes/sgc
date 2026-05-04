import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Table      from '../../components/ui/Table'
import { getInventario }  from '../../services/inventario.service'
import { getTiendas }     from '../../services/admin.service'
import styles from './Existencia.module.css'
import { Icons } from '../../utils/icons'

// ─── Columnas ─────────────────────────────────────────────────────────────────
// Definidas fuera del componente → referencias estables, no se recrean en cada render.
const COLUMNS = [
  { key: 'id_producto',  label: 'ID Producto', hidden: true },
  { key: 'id_tienda',    label: 'ID Tienda',   hidden: true },
  { key: 'codigo',       label: 'Código',
    render: (val) => <span className={styles.mono}>{val ?? '—'}</span> },
  { key: 'descripcion',  label: 'Producto',
    render: (val) => val ?? '—' },
  { key: 'nombre_tienda', label: 'Tienda',
    render: (val) => val ?? '—' },
  {
    key: 'cantidad',
    label: 'Existencia',
    render: (val) => {
      const qty = Number(val ?? 0)
      const formatted = qty.toLocaleString('es-GT', { minimumFractionDigits: 2 })

      if (qty === 0) {
        return <span className={styles.badgeAgotado}>Agotado</span>
      }
      if (qty <= 5) {
        return (
          <span className={styles.stockCell}>
            <span className={styles.badgeBajo}>{formatted}</span>
          </span>
        )
      }
      return (
        <span className={styles.stockCell}>
          <span className={styles.badgeOk}>{formatted}</span>
        </span>
      )
    },
  },
]

// ─── Formulario vacío de filtros ───────────────────────────────────────────────
const EMPTY_FILTERS = { search: '', tiendaId: '' }

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Existencia() {
  // ── Catálogos ──────────────────────────────────────────────────────────────
  const [tiendas,    setTiendas]    = useState([])

  // ── Datos del inventario ───────────────────────────────────────────────────
  const [allRows,    setAllRows]    = useState([])
  const [loadingInv, setLoadingInv] = useState(true)

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [filters,    setFilters]    = useState(EMPTY_FILTERS)

  // tableKey fuerza re-fetch manual cuando sea necesario (ej: botón Actualizar)
  const [tableKey,   setTableKey]   = useState(0)
  const refreshTable = () => setTableKey(k => k + 1)

  // ── Cargar tiendas (catálogo) ──────────────────────────────────────────────
  useEffect(() => {
    getTiendas()
      .then(data => setTiendas(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => setTiendas([]))
  }, [])

  // ── Cargar inventario ──────────────────────────────────────────────────────
  // Se re-ejecuta cuando cambia el filtro de tienda o se llama refreshTable().
  // La búsqueda de texto es client-side (filteredRows) para evitar un fetch
  // por cada tecla presionada.
  useEffect(() => {
    setLoadingInv(true)

    const params = {}
    if (filters.tiendaId) params.id_tienda = filters.tiendaId

    getInventario(params)
      .then(data => setAllRows(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => setAllRows([]))
      .finally(() => setLoadingInv(false))
  }, [filters.tiendaId, tableKey])

  // ── Filtrado client-side por texto ─────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter(r =>
      r.codigo?.toLowerCase().includes(q) ||
      r.descripcion?.toLowerCase().includes(q),
    )
  }, [allRows, filters.search])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS)
  }

  const hasActiveFilters = filters.search || filters.tiendaId

  // ── Resumen de totales ─────────────────────────────────────────────────────
  const summary = useMemo(() => ({
    total:    filteredRows.length,
    agotados: filteredRows.filter(r => Number(r.cantidad ?? 0) === 0).length,
    bajos:    filteredRows.filter(r => { const q = Number(r.cantidad ?? 0); return q > 0 && q <= 5 }).length,
  }), [filteredRows])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <PageHeader
        title="Existencia"
        subtitle="Consulta la existencia actual de productos por tienda"
        breadcrumb={[
          { label: 'Inventario', path: '/inventario' },
          { label: 'Existencia' },
        ]}
        actions={
          <button className={styles.btnSecondary} onClick={refreshTable}>
            <Icons.refresh size={16} strokeWidth={2} />
            Actualizar
          </button>
        }
      />

      <div className={styles.content}>

        {/* ── Barra de filtros ────────────────────────────────────────────── */}
        <div className={styles.filterBar}>
          {/* Búsqueda por producto */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel} htmlFor="search">
              Producto
            </label>
            <div className={styles.searchWrapper}>
              <div className={styles.searchIcon}>
                <Icons.search size={15} strokeWidth={1.6} />
              </div>
              <input
                id="search"
                type="text"
                className={styles.searchInput}
                placeholder="Código o descripción…"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Filtro por tienda */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel} htmlFor="tiendaId">
              Tienda
            </label>
            <select
              id="tiendaId"
              className={styles.filterSelect}
              value={filters.tiendaId}
              onChange={e => handleFilterChange('tiendaId', e.target.value)}
            >
              <option value="">Todas las tiendas</option>
              {tiendas.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <button className={styles.btnClear} onClick={handleClearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ── Tarjetas de resumen ──────────────────────────────────────────── */}
        <div className={styles.summaryBar}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{summary.total}</span>
            <span className={styles.summaryLabel}>Registros</span>
          </div>
          <div className={`${styles.summaryCard} ${styles.summaryCardRed}`}>
            <span className={styles.summaryValue}>{summary.agotados}</span>
            <span className={styles.summaryLabel}>Agotados</span>
          </div>
          <div className={`${styles.summaryCard} ${styles.summaryCardAmber}`}>
            <span className={styles.summaryValue}>{summary.bajos}</span>
            <span className={styles.summaryLabel}>Stock bajo (≤ 5)</span>
          </div>
        </div>

        {/* ── Tabla ────────────────────────────────────────────────────────── */}
        <Table
          columns={COLUMNS}
          data={filteredRows}
          loading={loadingInv}
          emptyText={
            hasActiveFilters
              ? 'No se encontraron productos con los filtros aplicados.'
              : 'No hay registros de existencia.'
          }
        />

      </div>
    </div>
  )
}