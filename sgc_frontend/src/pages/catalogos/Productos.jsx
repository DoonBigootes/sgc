/**
 * PÁGINA: Productos
 * ARCHIVO: src/pages/catalogos/Productos.jsx
 *
 * Reglas del formulario:
 *  - codigo          → requerido, manual, mayúsculas
 *  - descripcion     → requerido, mayúsculas
 *  - id_tipo_producto → requerido (select)
 *  - id_clasificacion → requerido (select)
 *  - precio_venta    → requerido, decimal ≥ 0
 *  - id_marca        → opcional (select)
 *  - id_unidad_medida → opcional (select)
 *  - activo          → toggle, solo visible al editar
 */

import { useState, useCallback, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import {
  getProductos,
  createProducto,
  updateProducto,
  getTiposProducto,
  getClasificaciones,
  getMarcas,
  getUnidadesMedida,
} from '../../services/catalogo.service'
import styles from './Productos.module.css'
import { Icons } from '../../utils/icons'

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id',            label: 'ID',            hidden: true },
  { key: 'codigo',        label: 'Código' },
  { key: 'descripcion',   label: 'Descripción' },
  { key: 'tipo_producto', label: 'Tipo',          render: (val) => val ?? '—' },
  { key: 'clasificacion', label: 'Clasificación', render: (val) => val ?? '—' },
  {
    key: 'precio_venta',
    label: 'Precio venta',
    render: (val) =>
      val != null
        ? `Q ${Number(val).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
        : '—',
  },
  {
    key: 'activo',
    label: 'Estado',
    render: (val) => (
      <span className={val ? styles.badgeActive : styles.badgeInactive}>
        {val ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
]

// ─── Estado inicial del formulario ────────────────────────────────────────────
const EMPTY_FORM = {
  codigo:            '',
  descripcion:       '',
  id_tipo_producto:  '',
  id_clasificacion:  '',
  precio_venta:      '',
  id_marca:          '',
  id_unidad_medida:  '',
  activo:            true,
}

// ─── Validación ───────────────────────────────────────────────────────────────
function validateForm(form) {
  if (!form.codigo.trim())                    return 'El código es requerido.'
  if (!form.descripcion.trim())               return 'La descripción es requerida.'
  if (!form.id_tipo_producto)                 return 'El tipo de producto es requerido.'
  if (!form.id_clasificacion)                 return 'La clasificación es requerida.'
  if (form.precio_venta === '' || form.precio_venta === null)
                                              return 'El precio de venta es requerido.'
  if (isNaN(Number(form.precio_venta)) || Number(form.precio_venta) < 0)
                                              return 'El precio de venta debe ser un número válido.'
  return null
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Productos() {
  const [tableKey,    setTableKey]    = useState(0)

  const [createModal, setCreateModal] = useState(false)
  const [editModal,   setEditModal]   = useState(false)

  const [selectedRow, setSelectedRow] = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [formErr,     setFormErr]     = useState('')

  // Catálogos dependientes
  const [tiposProducto,   setTiposProducto]   = useState([])
  const [clasificaciones, setClasificaciones] = useState([])
  const [marcas,          setMarcas]          = useState([])
  const [unidades,        setUnidades]        = useState([])

  useEffect(() => {
    getTiposProducto()
      .then((d) => setTiposProducto(d ?? []))
      .catch(() => setTiposProducto([]))

    getClasificaciones()
      .then((d) => setClasificaciones(d ?? []))
      .catch(() => setClasificaciones([]))

    getMarcas()
      .then((d) => setMarcas(d ?? []))
      .catch(() => setMarcas([]))

    getUnidadesMedida()
      .then((d) => setUnidades(d ?? []))
      .catch(() => setUnidades([]))
  }, [])

  // ── fetchFn ───────────────────────────────────────────────────────────────
  const fetchFn = useCallback(
    () => getProductos(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableKey],
  )

  // ── Acciones de fila ──────────────────────────────────────────────────────
  const rowActions = useCallback(() => [
    {
      label: 'Editar',
      onClick: (row) => {
        setSelectedRow(row)
        setForm({
          codigo:           row.codigo            ?? '',
          descripcion:      row.descripcion       ?? '',
          id_tipo_producto: row.id_tipo_producto  ?? '',
          id_clasificacion: row.id_clasificacion  ?? '',
          precio_venta:     row.precio_venta      != null ? String(row.precio_venta) : '',
          id_marca:         row.id_marca          ?? '',
          id_unidad_medida: row.id_unidad_medida  ?? '',
          activo:           row.activo            ?? true,
        })
        setFormErr('')
        setEditModal(true)
      },
    },
  ], [])

  // ── handleFieldChange ─────────────────────────────────────────────────────
  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormErr('')
  }

  // ── Helpers de cierre ─────────────────────────────────────────────────────
  const refreshTable = () => setTableKey((k) => k + 1)

  const closeCreate = () => {
    if (saving) return
    setCreateModal(false)
    setForm(EMPTY_FORM)
    setFormErr('')
  }

  const closeEdit = () => {
    if (saving) return
    setEditModal(false)
    setSelectedRow(null)
    setForm(EMPTY_FORM)
    setFormErr('')
  }

  // ── Crear ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const err = validateForm(form)
    if (err) { setFormErr(err); return }

    setSaving(true)
    setFormErr('')
    try {
      await createProducto({
        codigo:           form.codigo.trim(),
        descripcion:      form.descripcion.trim(),
        id_tipo_producto: Number(form.id_tipo_producto),
        id_clasificacion: Number(form.id_clasificacion),
        precio_venta:     Number(form.precio_venta),
        id_marca:         form.id_marca          ? Number(form.id_marca)         : null,
        id_unidad_medida: form.id_unidad_medida  ? Number(form.id_unidad_medida) : null,
      })
      closeCreate()
      refreshTable()
    } catch (e) {
      setFormErr(e?.response?.data?.message ?? 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Editar ────────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    const err = validateForm(form)
    if (err) { setFormErr(err); return }

    setSaving(true)
    setFormErr('')
    try {
      await updateProducto(selectedRow.id, {
        codigo:           form.codigo.trim(),
        descripcion:      form.descripcion.trim(),
        id_tipo_producto: Number(form.id_tipo_producto),
        id_clasificacion: Number(form.id_clasificacion),
        precio_venta:     Number(form.precio_venta),
        id_marca:         form.id_marca          ? Number(form.id_marca)         : null,
        id_unidad_medida: form.id_unidad_medida  ? Number(form.id_unidad_medida) : null,
        activo:           form.activo,
      })
      closeEdit()
      refreshTable()
    } catch (e) {
      setFormErr(e?.response?.data?.message ?? 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const catalogos = { tiposProducto, clasificaciones, marcas, unidades }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Productos"
        subtitle="Catálogo de productos del sistema"
        breadcrumb={[
          { label: 'Catálogos', path: '/catalogos/general' },
          { label: 'Productos' },
        ]}
        actions={
          <button
            className={styles.btnPrimary}
            onClick={() => {
              setForm(EMPTY_FORM)
              setFormErr('')
              setCreateModal(true)
            }}
          >
            <Icons.plus /> Nuevo producto
          </button>
        }
      />

      <div className={styles.content}>
        <Table
          columns={COLUMNS}
          fetchFn={fetchFn}
          rowActions={rowActions()}
          emptyText="No hay productos registrados."
        />
      </div>

      {/* Modal: Crear */}
      <Modal
        isOpen={createModal}
        onClose={closeCreate}
        onSave={handleCreate}
        title="Nuevo producto"
        size="lg"
        saveLabel="Crear producto"
        loading={saving}
      >
        <ProductoForm
          form={form}
          onChange={handleFieldChange}
          error={formErr}
          onSubmit={handleCreate}
          showActivo={false}
          catalogos={catalogos}
          styles={styles}
        />
      </Modal>

      {/* Modal: Editar */}
      <Modal
        isOpen={editModal}
        onClose={closeEdit}
        onSave={handleEdit}
        title="Editar producto"
        size="lg"
        saveLabel="Guardar cambios"
        loading={saving}
      >
        <ProductoForm
          form={form}
          onChange={handleFieldChange}
          error={formErr}
          onSubmit={handleEdit}
          showActivo={true}
          catalogos={catalogos}
          styles={styles}
        />
      </Modal>
    </div>
  )
}

// ─── Sub-componente: formulario ───────────────────────────────────────────────
function ProductoForm({ form, onChange, error, onSubmit, showActivo, catalogos, styles }) {
  const { tiposProducto, clasificaciones, marcas, unidades } = catalogos
  const handleKeyDown = (e) => { if (e.key === 'Enter') onSubmit() }

  const codigoErr      = error && !form.codigo.trim()
  const descripcionErr = error && !form.descripcion.trim()
  const tipoErr        = error && !form.id_tipo_producto
  const clasifErr      = error && !form.id_clasificacion
  const precioErr      = error && (
    form.precio_venta === '' ||
    isNaN(Number(form.precio_venta)) ||
    Number(form.precio_venta) < 0
  )

  return (
    <div className={styles.form}>

      {/* Código + Descripción */}
      <div className={styles.row2}>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="p-codigo">
            Código <span className={styles.required}>*</span>
          </label>
          <input
            id="p-codigo"
            className={`${styles.input} ${codigoErr ? styles.inputError : ''}`}
            type="text"
            value={form.codigo}
            onChange={(e) => onChange('codigo', e.target.value.toUpperCase().replace(/\s/g, ''))}
            placeholder="EJ. PERF-001"
            autoFocus
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.label} htmlFor="p-descripcion">
            Descripción <span className={styles.required}>*</span>
          </label>
          <input
            id="p-descripcion"
            className={`${styles.input} ${descripcionErr ? styles.inputError : ''}`}
            type="text"
            value={form.descripcion}
            onChange={(e) => onChange('descripcion', e.target.value.toUpperCase())}
            placeholder="NOMBRE O DESCRIPCIÓN DEL PRODUCTO"
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Tipo de producto + Clasificación */}
      <div className={styles.row2}>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="p-tipo">
            Tipo de producto <span className={styles.required}>*</span>
          </label>
          <select
            id="p-tipo"
            className={`${styles.select} ${tipoErr ? styles.inputError : ''}`}
            value={form.id_tipo_producto}
            onChange={(e) => onChange('id_tipo_producto', e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {tiposProducto.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label className={styles.label} htmlFor="p-clasif">
            Clasificación <span className={styles.required}>*</span>
          </label>
          <select
            id="p-clasif"
            className={`${styles.select} ${clasifErr ? styles.inputError : ''}`}
            value={form.id_clasificacion}
            onChange={(e) => onChange('id_clasificacion', e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {clasificaciones.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Precio de venta */}
      <div className={styles.formField}>
        <label className={styles.label} htmlFor="p-precio">
          Precio de venta <span className={styles.required}>*</span>
        </label>
        <div className={`${styles.inputPrefix} ${precioErr ? styles.inputError : ''}`}>
          <span className={styles.prefix}>Q</span>
          <input
            id="p-precio"
            className={`${styles.input} ${styles.inputWithPrefix}`}
            type="text"
            inputMode="decimal"
            value={form.precio_venta}
            onChange={(e) => onChange('precio_venta', e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Marca + Unidad de medida */}
      <div className={styles.row2}>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="p-marca">
            Marca <span className={styles.optional}>(opcional)</span>
          </label>
          <select
            id="p-marca"
            className={styles.select}
            value={form.id_marca}
            onChange={(e) => onChange('id_marca', e.target.value)}
          >
            <option value="">— Sin marca —</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label className={styles.label} htmlFor="p-unidad">
            Unidad de medida <span className={styles.optional}>(opcional)</span>
          </label>
          <select
            id="p-unidad"
            className={styles.select}
            value={form.id_unidad_medida}
            onChange={(e) => onChange('id_unidad_medida', e.target.value)}
          >
            <option value="">— Sin unidad —</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estado — solo en edición */}
      {showActivo && (
        <div className={styles.formField}>
          <label className={styles.label}>Estado</label>
          <button
            type="button"
            className={`${styles.toggleBtn} ${
              form.activo ? styles.toggleActive : styles.toggleInactive
            }`}
            onClick={() => onChange('activo', !form.activo)}
            aria-pressed={form.activo}
          >
            <span className={styles.toggleKnob} />
            <span className={styles.toggleLabel}>
              {form.activo ? 'Activo' : 'Inactivo'}
            </span>
          </button>
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}