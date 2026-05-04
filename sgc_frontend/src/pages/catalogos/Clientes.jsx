/**
 * PÁGINA: Clientes
 * ARCHIVO: src/pages/catalogos/Clientes.jsx
 *
 * Reglas del formulario:
 *  - codigo   → readonly, calculado automáticamente: NIT-INICIALES
 *               Ej: nit="113422115" + nombre="SA MER AR MUFS" → "113422115-SAAM"
 *  - nit      → solo alfanumérico y guión, mayúsculas
 *  - nombre   → requerido, mayúsculas
 *  - todos los campos de texto → forzado a mayúsculas
 */

import { useState, useCallback, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getTiposCliente,
} from '../../services/catalogo.service'
import styles from './Clientes.module.css'
import { Icons } from '../../utils/icons'

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id',             label: 'ID',             hidden: true },
  { key: 'codigo',         label: 'Código' },
  { key: 'nit',            label: 'NIT' },
  { key: 'nombre',         label: 'Nombre',         render: (val) => val ?? '—' },
  { key: 'telefono',       label: 'Teléfono',       render: (val) => val ?? '—' },
  { key: 'direccion',      label: 'Dirección',      render: (val) => val ?? '—' },
  {
    key: 'limite_credito',
    label: 'Límite crédito',
    render: (val) =>
      val != null
        ? `Q ${Number(val).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
        : '—',
  },
  { key: 'tipo_cliente', label: 'Tipo', render: (val) => val ?? '—' },
  {
    key: 'solo_contado',
    label: 'Solo contado',
    render: (val) => (
      <span className={val ? styles.badgeWarning : styles.badgeNeutral}>
        {val ? 'Sí' : 'No'}
      </span>
    ),
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
  codigo:          '',   // readonly — calculado automáticamente
  nit:             '',
  nombre:          '',
  direccion:       'CIUDAD',
  telefono:        '',
  solo_contado:    false,
  limite_credito:  '', 
  id_tipo_cliente: '1',
  activo:          true,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcula el código a partir del NIT y el nombre.
 * Toma la primera letra de cada palabra del nombre.
 */
function computeCodigo(nit, nombre) {
  const nitPart    = nit.trim()
  const initials   = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join('')

  if (!nitPart && !initials) return ''
  if (!initials)             return nitPart
  return `${nitPart}-${initials}`
}

// ─── Validación ───────────────────────────────────────────────────────────────
function validateForm(form) {
  if (!form.nit.trim())    return 'El NIT es requerido.'
  if (!form.nombre.trim()) return 'El nombre es requerido.'
  if (
    form.limite_credito !== '' &&
    form.limite_credito !== null &&
    isNaN(Number(form.limite_credito))
  ) return 'El límite de crédito debe ser un número válido.'
  return null
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Clientes() {
  const [tableKey, setTableKey] = useState(0)

  const [createModal, setCreateModal] = useState(false)
  const [editModal,   setEditModal]   = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  const [selectedRow, setSelectedRow] = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [formErr,     setFormErr]     = useState('')
  const [deleteErr,   setDeleteErr]   = useState('')

  const [tiposCliente, setTiposCliente] = useState([])

  useEffect(() => {
    getTiposCliente()
      .then((data) => setTiposCliente(data ?? []))
      .catch(() => setTiposCliente([]))
  }, [])

  // ── fetchFn ───────────────────────────────────────────────────────────────
  const fetchFn = useCallback(
    () => getClientes(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableKey],
  )

  // ── Acciones de fila ──────────────────────────────────────────────────────
  const rowActions = useCallback(() => [
    {
      label: 'Editar',
      onClick: (row) => {
        setSelectedRow(row)
        const nit    = row.nit    ?? ''
        const nombre = row.nombre ?? ''
        setForm({
          codigo:          computeCodigo(nit, nombre),
          nit,
          nombre,
          direccion:       row.direccion       ?? '',
          telefono:        row.telefono        != null ? String(row.telefono) : '',
          solo_contado:    row.solo_contado    ?? false,
          limite_credito:  row.limite_credito  != null ? String(row.limite_credito) : '',
          id_tipo_cliente: row.id_tipo_cliente ?? '',
          activo:          row.activo          ?? true,
        })
        setFormErr('')
        setEditModal(true)
      },
    },
    {
      label:  'Eliminar',
      danger: true,
      onClick: (row) => {
        setSelectedRow(row)
        setDeleteErr('')
        setDeleteModal(true)
      },
    },
  ], [])

  // ── handleFieldChange — recalcula codigo cuando cambia nit o nombre ───────
  const handleFieldChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === 'nit' || field === 'nombre') {
        const nit    = field === 'nit'    ? value : prev.nit
        const nombre = field === 'nombre' ? value : prev.nombre
        updated.codigo = computeCodigo(nit, nombre)
      }
      return updated
    })
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

  const closeDelete = () => {
    if (saving) return
    setDeleteModal(false)
    setSelectedRow(null)
    setDeleteErr('')
  }

  // ── Crear ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const err = validateForm(form)
    if (err) { setFormErr(err); return }

    setSaving(true)
    setFormErr('')
    try {
      await createCliente({
        codigo:          form.codigo,
        nit:             form.nit.trim(),
        nombre:          form.nombre.trim(),
        direccion:       form.direccion.trim()      || null,
        telefono:        form.telefono !== ''       ? Number(form.telefono) : null,
        solo_contado:    form.solo_contado,
        limite_credito:  form.limite_credito !== '' ? Number(form.limite_credito) : null,
        id_tipo_cliente: form.id_tipo_cliente       || null,
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
      await updateCliente(selectedRow.id, {
        codigo:          form.codigo,
        nit:             form.nit.trim(),
        nombre:          form.nombre.trim(),
        direccion:       form.direccion.trim()      || null,
        telefono:        form.telefono !== ''       ? Number(form.telefono) : null,
        solo_contado:    form.solo_contado,
        limite_credito:  form.limite_credito !== '' ? Number(form.limite_credito) : null,
        id_tipo_cliente: form.id_tipo_cliente       || null,
        activo:          form.activo,
      })
      closeEdit()
      refreshTable()
    } catch (e) {
      setFormErr(e?.response?.data?.message ?? 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true)
    setDeleteErr('')
    try {
      await deleteCliente(selectedRow.id)
      closeDelete()
      refreshTable()
    } catch (e) {
      setDeleteErr(e?.response?.data?.message ?? 'Error al eliminar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      <PageHeader
        title="Clientes"
        subtitle="Gestión de clientes"
        breadcrumb={[
          { label: 'Catálogos', path: '/catalogos/general' },
          { label: 'Clientes' },
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
            <Icons.plus />
            Nuevo cliente
          </button>
        }
      />

      <div className={styles.content}>
        <Table
          key={tableKey}
          columns={COLUMNS}
          fetchFn={fetchFn}
          rowActions={rowActions()}
          emptyText="No hay clientes registrados."
        />
      </div>

      {/* Modal: Crear */}
      <Modal
        isOpen={createModal}
        onClose={closeCreate}
        onSave={handleCreate}
        title="Nuevo cliente"
        size="lg"
        saveLabel="Crear cliente"
        loading={saving}
      >
        <ClienteForm
          form={form}
          onChange={handleFieldChange}
          error={formErr}
          onSubmit={handleCreate}
          showActivo={false}
          tiposCliente={tiposCliente}
          styles={styles}
        />
      </Modal>

      {/* Modal: Editar */}
      <Modal
        isOpen={editModal}
        onClose={closeEdit}
        onSave={handleEdit}
        title="Editar cliente"
        size="lg"
        saveLabel="Guardar cambios"
        loading={saving}
      >
        <ClienteForm
          form={form}
          onChange={handleFieldChange}
          error={formErr}
          onSubmit={handleEdit}
          showActivo={true}
          tiposCliente={tiposCliente}
          styles={styles}
        />
      </Modal>

      {/* Modal: Eliminar */}
      <Modal
        isOpen={deleteModal}
        onClose={closeDelete}
        onSave={handleDelete}
        title="Eliminar cliente"
        size="sm"
        saveLabel="Eliminar"
        danger
        loading={saving}
      >
        <p className={styles.deleteText}>
          ¿Estás seguro que deseas eliminar a{' '}
          <strong>"{selectedRow?.nombre ?? selectedRow?.codigo}"</strong>?
          Esta acción no se puede deshacer.
        </p>
        {deleteErr && <p className={styles.deleteErrMsg}>{deleteErr}</p>}
      </Modal>
    </div>
  )
}

// ─── Sub-componente: formulario ───────────────────────────────────────────────
function ClienteForm({ form, onChange, error, onSubmit, showActivo, tiposCliente, styles }) {
  const handleKeyDown = (e) => { if (e.key === 'Enter') onSubmit() }

  return (
    <div className={styles.form}>

      {/* NIT + Código (readonly) */}
      <div className={styles.row2}>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="c-nit">
            NIT <span className={styles.required}>*</span>
          </label>
          <input
            id="c-nit"
            className={`${styles.input} ${error && !form.nit.trim() ? styles.inputError : ''}`}
            type="text"
            value={form.nit}
            onChange={(e) =>
              // Solo alfanumérico y guión, forzado a mayúsculas
              onChange('nit', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))
            }
            placeholder="EJ. 1234567-8 / CF"
            autoFocus
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.label} htmlFor="c-codigo">
            Código
            <span className={styles.readonlyBadge}>auto</span>
          </label>
          <input
            id="c-codigo"
            className={`${styles.input} ${styles.inputReadonly}`}
            type="text"
            value={form.codigo}
            readOnly
            tabIndex={-1}
            placeholder="Se calcula automáticamente"
          />
        </div>
      </div>

      {/* Nombre */}
      <div className={styles.formField}>
        <label className={styles.label} htmlFor="c-nombre">
          Nombre <span className={styles.required}>*</span>
        </label>
        <input
          id="c-nombre"
          className={`${styles.input} ${error && !form.nombre.trim() ? styles.inputError : ''}`}
          type="text"
          value={form.nombre}
          onChange={(e) => onChange('nombre', e.target.value.toUpperCase())}
          placeholder="NOMBRE O RAZÓN SOCIAL DEL CLIENTE"
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Dirección */}
      <div className={styles.formField}>
        <label className={styles.label} htmlFor="c-direccion">
          Dirección <span className={styles.optional}>(opcional)</span>
        </label>
        <input
          id="c-direccion"
          className={styles.input}
          type="text"
          value={form.direccion}
          onChange={(e) => onChange('direccion', e.target.value.toUpperCase())}
          placeholder="DIRECCIÓN DEL CLIENTE"
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Teléfono + Tipo cliente */}
      <div className={styles.row2}>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="c-telefono">
            Teléfono <span className={styles.optional}>(opcional)</span>
          </label>
          <input
            id="c-telefono"
            className={styles.input}
            type="text"
            inputMode="numeric"
            value={form.telefono}
            onChange={(e) => onChange('telefono', e.target.value.replace(/\D/g, ''))}
            placeholder="EJ. 55550000"
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.label} htmlFor="c-tipo">
            Tipo de cliente <span className={styles.optional}>(opcional)</span>
          </label>
          <select
            id="c-tipo"
            className={styles.select}
            value={form.id_tipo_cliente}
            onChange={(e) => onChange('id_tipo_cliente', e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {tiposCliente.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Límite de crédito */}
      <div className={styles.formField}>
        <label className={styles.label} htmlFor="c-limite">
          Límite de crédito <span className={styles.optional}>(opcional)</span>
        </label>
        <div className={styles.inputPrefix}>
          <span className={styles.prefix}>Q</span>
          <input
            id="c-limite"
            className={`${styles.input} ${styles.inputWithPrefix} ${
              error &&
              form.limite_credito !== '' &&
              isNaN(Number(form.limite_credito))
                ? styles.inputError
                : ''
            }`}
            type="text"
            inputMode="decimal"
            value={form.limite_credito}
            onChange={(e) =>
              onChange('limite_credito', e.target.value.replace(/[^0-9.]/g, ''))
            }
            placeholder="0.00"
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Solo contado + Activo */}
      <div className={styles.row2}>
        <div className={styles.formField}>
          <label className={styles.label}>Solo contado</label>
          <button
            type="button"
            className={`${styles.toggleBtn} ${
              form.solo_contado ? styles.toggleWarning : styles.toggleNeutral
            }`}
            onClick={() => onChange('solo_contado', !form.solo_contado)}
            aria-pressed={form.solo_contado}
          >
            <span className={styles.toggleKnob} />
            <span className={styles.toggleLabel}>
              {form.solo_contado ? 'Sí — solo contado' : 'No — permite crédito'}
            </span>
          </button>
        </div>

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
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}