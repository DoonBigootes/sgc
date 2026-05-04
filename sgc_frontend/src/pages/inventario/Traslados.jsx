// ============================================================
// PÁGINA: Traslados
// ARCHIVO: src/pages/inventario/Traslados.jsx
// PROYECTO: SGC — Sistema de Gestión Comercial
// ============================================================

import { useState, useCallback, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Table      from '../../components/ui/Table'
import Modal      from '../../components/ui/Modal'
import { getTraslados, createTraslado } from '../../services/inventario.service'
import { getTiendas }    from '../../services/admin.service'
import { getProductos }  from '../../services/catalogo.service'
import styles from './Traslados.module.css'

// ── Icono ────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const IconArrow = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1.75 3.5h10.5M5.25 3.5V2.5a.5.5 0 0 1 .5-.5h2.5a.5.5 0 0 1 .5.5v1M11.5 3.5l-.583 7a1 1 0 0 1-.997.917H4.08a1 1 0 0 1-.997-.917L2.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Estado vacío del formulario ──────────────────────────────
const EMPTY_FORM = {
  id_tipo_traslado:  '',
  id_tienda_origen:  '',
  id_tienda_destino: '',
  descripcion:       '',
}

// ── Tipos de traslado (seed del sistema) ────────────────────
const TIPOS_TRASLADO = [
  { id: 1, nombre: 'Traslado'       },
  { id: 2, nombre: 'Ajuste Entrada' },
  { id: 3, nombre: 'Ajuste Salida'  },
]

// ── Columnas de la tabla principal ──────────────────────────
// Definidas FUERA del componente (regla del proyecto)
const COLUMNS = [
  { key: 'id',              label: 'ID',          hidden: true },
  { key: 'correlativo',     label: '#',           render: (v) => v ?? '—' },
  {
    key: 'tipo_traslado',
    label: 'Tipo',
    render: (v) => {
      const map = {
        'Traslado':       'badgeNeutral',
        'Ajuste Entrada': 'badgeActive',
        'Ajuste Salida':  'badgeWarning',
      }
      const cls = map[v] ?? 'badgeNeutral'
      return <span className={styles[cls]}>{v ?? '—'}</span>
    },
  },
  {
    key: 'tienda_origen',
    label: 'Origen',
    render: (v) => v ?? <span className={styles.muted}>—</span>,
  },
  {
    key: 'tienda_destino',
    label: 'Destino',
    render: (v) => v ?? <span className={styles.muted}>—</span>,
  },
  { key: 'descripcion', label: 'Descripción', render: (v) => v ?? '—' },
  {
    key: 'fecha_creacion',
    label: 'Fecha',
    render: (v) =>
      v
        ? new Date(v).toLocaleDateString('es-GT', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })
        : '—',
  },
  {
    key: 'total_productos',
    label: 'Productos',
    render: (v) => (
      <span className={styles.badgeNeutral}>{v ?? 0} ítem{v !== 1 ? 's' : ''}</span>
    ),
  },
]

// ── Columnas tabla de detalle (modal Ver) ────────────────────
const DETAIL_COLUMNS = [
  { key: 'codigo',      label: 'Código'    },
  { key: 'descripcion', label: 'Producto'  },
  {
    key: 'cantidad',
    label: 'Cantidad',
    render: (v) =>
      Number(v).toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 4 }),
  },
]

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Traslados() {
  // ── Estado de tablas ──────────────────────────────────────
  const [tableKey,     setTableKey]     = useState(0)
  const refreshTable = () => setTableKey(k => k + 1)

  // ── Catálogos cargados una vez ───────────────────────────
  const [tiendas,   setTiendas]   = useState([])
  const [productos, setProductos] = useState([])

  // ── Filtros ───────────────────────────────────────────────
  const [filtros, setFiltros] = useState({
    id_tienda_origen:  '',
    id_tienda_destino: '',
    fecha_desde:       '',
    fecha_hasta:       '',
  })

  // ── Modales ───────────────────────────────────────────────
  const [createModal,  setCreateModal]  = useState(false)
  const [viewModal,    setViewModal]    = useState(false)
  const [productModal, setProductModal] = useState(false)

  // ── Formulario de creación ───────────────────────────────
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [detalle,  setDetalle]  = useState([])   // [{id_producto, codigo, descripcion, cantidad}]
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState('')

  // ── Selector de producto ─────────────────────────────────
  const [prodSearch,   setProdSearch]   = useState('')
  const [selectedProd, setSelectedProd] = useState(null)
  const [prodCantidad, setProdCantidad] = useState('')

  // ── Fila seleccionada (ver detalle) ─────────────────────
  const [selectedRow, setSelectedRow] = useState(null)

  // ── Cargar catálogos al montar ───────────────────────────
  useEffect(() => {
    getTiendas()
      .then(r => setTiendas(r?.data ?? []))
      .catch(() => {})

    getProductos()
      .then(r => setProductos(r?.data ?? []))
      .catch(() => {})
  }, [])

  // ── fetchFn con filtros ──────────────────────────────────
  const fetchFn = useCallback(
    () => getTraslados(filtros),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableKey, filtros.id_tienda_origen, filtros.id_tienda_destino, filtros.fecha_desde, filtros.fecha_hasta]
  )

  // ── Acciones de fila ─────────────────────────────────────
  const rowActions = useCallback(() => [
    {
      label: 'Ver detalle',
      onClick: (row) => {
        setSelectedRow(row)
        setViewModal(true)
      },
    },
  ], [])

  // ── Filtros ───────────────────────────────────────────────
  const handleFiltro = (field, value) => {
    setFiltros(prev => ({ ...prev, [field]: value }))
  }

  const clearFiltros = () => {
    setFiltros({ id_tienda_origen: '', id_tienda_destino: '', fecha_desde: '', fecha_hasta: '' })
    refreshTable()
  }

  const applyFiltros = () => refreshTable()

  // ── Formulario de creación ───────────────────────────────
  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setFormErr('')
  }

  const closeCreate = () => {
    if (saving) return
    setCreateModal(false)
    setForm(EMPTY_FORM)
    setDetalle([])
    setFormErr('')
  }

  const validateForm = () => {
    if (!form.id_tipo_traslado)               return 'El tipo de traslado es requerido.'
    const tipo = TIPOS_TRASLADO.find(t => t.id === Number(form.id_tipo_traslado))
    if (tipo?.nombre === 'Traslado') {
      if (!form.id_tienda_origen)             return 'La tienda de origen es requerida.'
      if (!form.id_tienda_destino)            return 'La tienda de destino es requerida.'
      if (form.id_tienda_origen === form.id_tienda_destino)
                                              return 'Origen y destino no pueden ser la misma tienda.'
    } else if (tipo?.nombre === 'Ajuste Entrada') {
      if (!form.id_tienda_destino)            return 'La tienda de destino es requerida.'
    } else if (tipo?.nombre === 'Ajuste Salida') {
      if (!form.id_tienda_origen)             return 'La tienda de origen es requerida.'
    }
    if (!form.descripcion.trim())             return 'La descripción es requerida.'
    if (detalle.length === 0)                 return 'Debe agregar al menos un producto.'
    return null
  }

  const handleCreate = async () => {
    const err = validateForm()
    if (err) { setFormErr(err); return }
    setSaving(true)
    try {
      await createTraslado({
        id_tipo_traslado:  Number(form.id_tipo_traslado),
        id_tienda_origen:  form.id_tienda_origen  ? Number(form.id_tienda_origen)  : null,
        id_tienda_destino: form.id_tienda_destino ? Number(form.id_tienda_destino) : null,
        descripcion:       form.descripcion.trim(),
        detalle: detalle.map(d => ({
          id_producto: d.id_producto,
          cantidad:    Number(d.cantidad),
        })),
      })
      closeCreate()
      refreshTable()
    } catch (e) {
      setFormErr(e?.response?.data?.message ?? 'Error al registrar el traslado.')
    } finally {
      setSaving(false)
    }
  }

  // ── Lógica del selector de producto ─────────────────────
  const prodsFiltrados = productos.filter(p => {
    const q = prodSearch.toLowerCase()
    return (
      p.codigo?.toLowerCase().includes(q) ||
      p.descripcion?.toLowerCase().includes(q)
    )
  })

  const openProductModal = () => {
    setSelectedProd(null)
    setProdSearch('')
    setProdCantidad('')
    setProductModal(true)
  }

  const closeProductModal = () => {
    setProductModal(false)
    setSelectedProd(null)
    setProdSearch('')
    setProdCantidad('')
  }

  const handleAgregarProducto = () => {
    if (!selectedProd || !prodCantidad || Number(prodCantidad) <= 0) return
    // Evitar duplicados
    if (detalle.some(d => d.id_producto === selectedProd.id)) {
      setDetalle(prev =>
        prev.map(d =>
          d.id_producto === selectedProd.id
            ? { ...d, cantidad: String(Number(d.cantidad) + Number(prodCantidad)) }
            : d
        )
      )
    } else {
      setDetalle(prev => [
        ...prev,
        {
          id_producto:  selectedProd.id,
          codigo:       selectedProd.codigo,
          descripcion:  selectedProd.descripcion,
          cantidad:     prodCantidad,
        },
      ])
    }
    closeProductModal()
  }

  const removeProducto = (id_producto) => {
    setDetalle(prev => prev.filter(d => d.id_producto !== id_producto))
  }

  // ── Tipo seleccionado (para mostrar/ocultar campos) ──────
  const tipoSeleccionado = TIPOS_TRASLADO.find(t => t.id === Number(form.id_tipo_traslado))
  const mostrarOrigen    = !tipoSeleccionado || tipoSeleccionado.nombre !== 'Ajuste Entrada'
  const mostrarDestino   = !tipoSeleccionado || tipoSeleccionado.nombre !== 'Ajuste Salida'

  // ── Render ────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── PageHeader ── */}
      <PageHeader
        title="Traslados"
        subtitle="Registro de traslados y ajustes de inventario"
        breadcrumb={[
          { label: 'Inventario', path: '/inventario' },
          { label: 'Traslados' },
        ]}
        actions={
          <button
            className={styles.btnPrimary}
            onClick={() => { setForm(EMPTY_FORM); setDetalle([]); setFormErr(''); setCreateModal(true) }}
          >
            <IconPlus />
            Realizar traslado
          </button>
        }
      />

      {/* ── Contenido ── */}
      <div className={styles.content}>

        {/* ── Filtros ── */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tienda origen</label>
            <select
              className={styles.select}
              value={filtros.id_tienda_origen}
              onChange={e => handleFiltro('id_tienda_origen', e.target.value)}
            >
              <option value="">Todas</option>
              {tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tienda destino</label>
            <select
              className={styles.select}
              value={filtros.id_tienda_destino}
              onChange={e => handleFiltro('id_tienda_destino', e.target.value)}
            >
              <option value="">Todas</option>
              {tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Desde</label>
            <input
              type="date"
              className={styles.inputDate}
              value={filtros.fecha_desde}
              onChange={e => handleFiltro('fecha_desde', e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Hasta</label>
            <input
              type="date"
              className={styles.inputDate}
              value={filtros.fecha_hasta}
              onChange={e => handleFiltro('fecha_hasta', e.target.value)}
            />
          </div>

          <div className={styles.filterActions}>
            <button className={styles.btnPrimary} onClick={applyFiltros}>
              Filtrar
            </button>
            <button className={styles.btnSecondary} onClick={clearFiltros}>
              Limpiar
            </button>
          </div>
        </div>

        {/* ── Tabla principal ── */}
        <Table
          columns={COLUMNS}
          fetchFn={fetchFn}
          rowActions={rowActions()}
          emptyText="No hay traslados registrados con los filtros seleccionados."
        />
      </div>

      {/* ══════════════════════════════════════════════
          MODAL — VER DETALLE (solo lectura)
      ══════════════════════════════════════════════ */}
      <Modal
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
        title={`Traslado #${selectedRow?.correlativo ?? '—'}`}
        size="lg"
        hideFooter
      >
        {selectedRow && (
          <div className={styles.viewContainer}>
            {/* Cabecera del traslado */}
            <div className={styles.viewMeta}>
              <div className={styles.viewMetaItem}>
                <span className={styles.viewMetaLabel}>Tipo</span>
                <span className={styles.viewMetaValue}>
                  <span className={styles.badgeNeutral}>{selectedRow.tipo_traslado ?? '—'}</span>
                </span>
              </div>
              <div className={styles.viewMetaItem}>
                <span className={styles.viewMetaLabel}>Fecha</span>
                <span className={styles.viewMetaValue}>
                  {selectedRow.fecha_creacion
                    ? new Date(selectedRow.fecha_creacion).toLocaleDateString('es-GT', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
              <div className={styles.viewMetaItem}>
                <span className={styles.viewMetaLabel}>Descripción</span>
                <span className={styles.viewMetaValue}>{selectedRow.descripcion ?? '—'}</span>
              </div>
            </div>

            {/* Ruta origen → destino */}
            <div className={styles.viewRoute}>
              <div className={styles.viewRouteBox}>
                <span className={styles.viewRouteLabel}>Origen</span>
                <span className={styles.viewRouteName}>
                  {selectedRow.tienda_origen ?? <em className={styles.muted}>N/A</em>}
                </span>
              </div>
              <span className={styles.viewRouteArrow}><IconArrow /></span>
              <div className={styles.viewRouteBox}>
                <span className={styles.viewRouteLabel}>Destino</span>
                <span className={styles.viewRouteName}>
                  {selectedRow.tienda_destino ?? <em className={styles.muted}>N/A</em>}
                </span>
              </div>
            </div>

            {/* Tabla de detalle */}
            <div className={styles.viewDetailHeader}>
              <span className={styles.viewDetailTitle}>Productos trasladados</span>
              <span className={styles.badgeNeutral}>
                {(selectedRow.detalle ?? []).length} ítem{selectedRow.detalle?.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Table
              columns={DETAIL_COLUMNS}
              data={selectedRow.detalle ?? []}
              emptyText="Sin detalle disponible."
            />
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL — CREAR TRASLADO
      ══════════════════════════════════════════════ */}
      <Modal
        isOpen={createModal}
        onClose={closeCreate}
        onSave={handleCreate}
        title="Realizar traslado"
        size="lg"
        saveLabel="Registrar traslado"
        loading={saving}
        saveDisabled={detalle.length === 0}
      >
        <div className={styles.form}>

          {/* Tipo de traslado */}
          <div className={styles.formField}>
            <label className={styles.label} htmlFor="f-tipo">
              Tipo de traslado <span className={styles.required}>*</span>
            </label>
            <select
              id="f-tipo"
              className={styles.select}
              value={form.id_tipo_traslado}
              onChange={e => handleFieldChange('id_tipo_traslado', e.target.value)}
              autoFocus
            >
              <option value="">— Seleccionar tipo —</option>
              {TIPOS_TRASLADO.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          {/* Tiendas: origen / destino — layout dinámico según tipo */}
          <div className={mostrarOrigen && mostrarDestino ? styles.row2 : styles.row1}>
            {mostrarOrigen && (
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="f-origen">
                  Tienda origen{' '}
                  {tipoSeleccionado?.nombre === 'Traslado'
                    ? <span className={styles.required}>*</span>
                    : <span className={styles.optional}>(opcional)</span>}
                </label>
                <select
                  id="f-origen"
                  className={styles.select}
                  value={form.id_tienda_origen}
                  onChange={e => handleFieldChange('id_tienda_origen', e.target.value)}
                >
                  <option value="">— Seleccionar tienda —</option>
                  {tiendas.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {mostrarDestino && (
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="f-destino">
                  Tienda destino{' '}
                  {tipoSeleccionado?.nombre === 'Ajuste Salida'
                    ? <span className={styles.optional}>(opcional)</span>
                    : <span className={styles.required}>*</span>}
                </label>
                <select
                  id="f-destino"
                  className={styles.select}
                  value={form.id_tienda_destino}
                  onChange={e => handleFieldChange('id_tienda_destino', e.target.value)}
                >
                  <option value="">— Seleccionar tienda —</option>
                  {tiendas.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className={styles.formField}>
            <label className={styles.label} htmlFor="f-descripcion">
              Descripción <span className={styles.required}>*</span>
            </label>
            <input
              id="f-descripcion"
              className={styles.input}
              value={form.descripcion}
              onChange={e => handleFieldChange('descripcion', e.target.value.toUpperCase())}
              placeholder="Ej. TRASLADO MENSUAL BODEGA A TIENDA 1"
            />
          </div>

          {/* Sección de productos */}
          <div className={styles.sectionDivider}>
            <span className={styles.sectionLabel}>Productos a trasladar</span>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={openProductModal}
            >
              <IconPlus />
              Agregar producto
            </button>
          </div>

          {/* Tabla de productos del traslado */}
          {detalle.length === 0 ? (
            <div className={styles.emptyDetalle}>
              <p>No hay productos agregados. Usa el botón de arriba para agregar.</p>
            </div>
          ) : (
            <div className={styles.detalleTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th className={styles.thRight}>Cantidad</th>
                    <th className={styles.thCenter}></th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.map(d => (
                    <tr key={d.id_producto}>
                      <td className={styles.tdCode}>{d.codigo}</td>
                      <td>{d.descripcion}</td>
                      <td className={styles.tdRight}>
                        <input
                          type="number"
                          min="0.0001"
                          step="any"
                          className={styles.inputQty}
                          value={d.cantidad}
                          onChange={e =>
                            setDetalle(prev =>
                              prev.map(p =>
                                p.id_producto === d.id_producto
                                  ? { ...p, cantidad: e.target.value }
                                  : p
                              )
                            )
                          }
                        />
                      </td>
                      <td className={styles.tdCenter}>
                        <button
                          type="button"
                          className={styles.btnRemove}
                          onClick={() => removeProducto(d.id_producto)}
                          aria-label="Eliminar producto"
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Error general */}
          {formErr && <p className={styles.errorMsg}>{formErr}</p>}
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL — SELECTOR DE PRODUCTO (pequeño)
      ══════════════════════════════════════════════ */}
      <Modal
        isOpen={productModal}
        onClose={closeProductModal}
        onSave={handleAgregarProducto}
        title="Agregar producto"
        size="base"
        saveLabel="Agregar"
        saveDisabled={!selectedProd || !prodCantidad || Number(prodCantidad) <= 0}
      >
        <div className={styles.form}>
          {/* Búsqueda */}
          <div className={styles.formField}>
            <label className={styles.label}>Buscar producto</label>
            <input
              className={styles.input}
              placeholder="Código o descripción..."
              value={prodSearch}
              onChange={e => setProdSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Lista de productos filtrados */}
          <div className={styles.prodList}>
            {prodsFiltrados.length === 0 ? (
              <p className={styles.prodEmpty}>Sin resultados.</p>
            ) : (
              prodsFiltrados.slice(0, 50).map(p => (
                <button
                  type="button"
                  key={p.id}
                  className={`${styles.prodItem} ${selectedProd?.id === p.id ? styles.prodItemSelected : ''}`}
                  onClick={() => setSelectedProd(p)}
                >
                  <span className={styles.prodCode}>{p.codigo}</span>
                  <span className={styles.prodDesc}>{p.descripcion}</span>
                </button>
              ))
            )}
          </div>

          {/* Cantidad */}
          {selectedProd && (
            <div className={styles.formField}>
              <label className={styles.label}>
                Cantidad <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                min="0.0001"
                step="any"
                className={styles.input}
                placeholder="0"
                value={prodCantidad}
                onChange={e => setProdCantidad(e.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>

    </div>
  )
}