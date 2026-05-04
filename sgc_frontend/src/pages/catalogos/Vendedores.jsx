/**
 * PÁGINA: Vendedores
 * ARCHIVO: src/pages/catalogos/Vendedores.jsx
 *
 * Listado de vendedores con opciones de crear, editar
 * y eliminar registros usando modales.
 */

import { useState, useCallback } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import {
  getVendedores,
  createVendedor,
  updateVendedor,
  deleteVendedor,
} from '../../services/catalogo.service'
import styles from './Vendedores.module.css'
import { Icons } from '../../utils/icons'

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
// Definidas fuera del componente para referencias estables (ver Table.jsx docs).
const COLUMNS = [
  { key: 'id',       label: 'ID',       hidden: true },
  { key: 'nombre',   label: 'Nombre' },
  { key: 'cui',      label: 'CUI' },
  { key: 'nit',      label: 'NIT',      render: (val) => val ?? '—' },
  { key: 'telefono', label: 'Teléfono', render: (val) => val ?? '—' },
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
  nombre:   '',
  cui:      '',
  nit:      '',
  telefono: '',
  activo:   true,
}

// ─── Validación del formulario ────────────────────────────────────────────────
function validateForm(form) {
  if (!form.nombre.trim())        return 'El nombre es requerido.'
  if (!String(form.cui).trim())   return 'El CUI es requerido.'
  if (!/^\d+$/.test(String(form.cui).trim())) return 'El CUI debe contener solo números.'
  return null
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Vendedores() {
  // Clave para forzar re-render de la tabla tras mutaciones
  const [tableKey, setTableKey] = useState(0)

  // Modales
  const [createModal, setCreateModal] = useState(false)
  const [editModal,   setEditModal]   = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  // Registro seleccionado (para editar / eliminar)
  const [selectedRow, setSelectedRow] = useState(null)

  // Formulario compartido (crear / editar)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [formErr,   setFormErr]   = useState('')
  const [deleteErr, setDeleteErr] = useState('')

  // ── fetchFn para el Table component ───────────────────────────────────────
  const fetchFn = useCallback(
    () => getVendedores(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableKey],
  )

  // ── Acciones del menú de fila ──────────────────────────────────────────────
  const rowActions = useCallback(() => [
    {
      label: 'Editar',
      onClick: (row) => {
        setSelectedRow(row)
        setForm({
          nombre:   row.nombre   ?? '',
          cui:      row.cui      ?? '',
          nit:      row.nit      ?? '',
          telefono: row.telefono ?? '',
          activo:   row.activo   ?? true,
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const refreshTable = () => setTableKey((k) => k + 1)

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormErr('')
  }

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
      await createVendedor({
        nombre:   form.nombre.trim(),
        cui:      Number(form.cui),
        nit:      form.nit.trim()      || null,
        telefono: form.telefono.trim() || null,
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
      await updateVendedor(selectedRow.id, {
        nombre:   form.nombre.trim(),
        cui:      Number(form.cui),
        nit:      form.nit.trim()      || null,
        telefono: form.telefono.trim() || null,
        activo:   form.activo,
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
      await deleteVendedor(selectedRow.id)
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

      {/* ── PageHeader ──────────────────────────────────────────── */}
      <PageHeader
        title="Vendedores"
        subtitle="Gestión del equipo de ventas"
        breadcrumb={[
          { label: 'Catálogos', path: '/catalogos/general' },
          { label: 'Vendedores' },
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
            Nuevo vendedor
          </button>
        }
      />

      {/* ── Tabla ───────────────────────────────────────────────── */}
      <div className={styles.content}>
        <Table
          key={tableKey}
          columns={COLUMNS}
          fetchFn={fetchFn}
          rowActions={rowActions()}
          emptyText="No hay vendedores registrados."
        />
      </div>

      {/* ── Modal: Crear ────────────────────────────────────────── */}
      <Modal
        isOpen={createModal}
        onClose={closeCreate}
        onSave={handleCreate}
        title="Nuevo vendedor"
        size="base"
        saveLabel="Crear vendedor"
        loading={saving}
      >
        <VendedorForm
          form={form}
          onChange={handleFieldChange}
          error={formErr}
          onSubmit={handleCreate}
          showActivo={false}
          styles={styles}
        />
      </Modal>

      {/* ── Modal: Editar ───────────────────────────────────────── */}
      <Modal
        isOpen={editModal}
        onClose={closeEdit}
        onSave={handleEdit}
        title="Editar vendedor"
        size="base"
        saveLabel="Guardar cambios"
        loading={saving}
      >
        <VendedorForm
          form={form}
          onChange={handleFieldChange}
          error={formErr}
          onSubmit={handleEdit}
          showActivo={true}
          styles={styles}
        />
      </Modal>

      {/* ── Modal: Eliminar ─────────────────────────────────────── */}
      <Modal
        isOpen={deleteModal}
        onClose={closeDelete}
        onSave={handleDelete}
        title="Eliminar vendedor"
        size="sm"
        saveLabel="Eliminar"
        danger
        loading={saving}
      >
        <p className={styles.deleteText}>
          ¿Estás seguro que deseas eliminar a{' '}
          <strong>"{selectedRow?.nombre}"</strong>?
          Esta acción no se puede deshacer.
        </p>
        {deleteErr && <p className={styles.deleteErrMsg}>{deleteErr}</p>}
      </Modal>
    </div>
  )
}

// ─── Sub-componente: formulario ───────────────────────────────────────────────
// Extraído para reutilizarlo en los modales de crear y editar sin duplicar JSX.
function VendedorForm({ form, onChange, error, onSubmit, showActivo, styles }) {
  const handleKeyDown = (e) => { if (e.key === 'Enter') onSubmit() }

  return (
    <div className={styles.form}>

      {/* Nombre */}
      <div className={styles.formField}>
        <label className={styles.label} htmlFor="v-nombre">
          Nombre <span className={styles.required}>*</span>
        </label>
        <input
          id="v-nombre"
          className={`${styles.input} ${error && !form.nombre.trim() ? styles.inputError : ''}`}
          type="text"
          value={form.nombre}
          onChange={(e) => onChange('nombre', e.target.value)}
          placeholder="Nombre completo del vendedor"
          autoFocus
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* CUI + NIT en fila */}
      <div className={styles.row2}>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="v-cui">
            CUI <span className={styles.required}>*</span>
          </label>
          <input
            id="v-cui"
            className={`${styles.input} ${error && !form.cui ? styles.inputError : ''}`}
            type="text"
            inputMode="numeric"
            value={form.cui}
            onChange={(e) => onChange('cui', e.target.value.replace(/\D/g, ''))}
            placeholder="Ej. 2847391830101"
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.label} htmlFor="v-nit">
            NIT <span className={styles.optional}>(opcional)</span>
          </label>
          <input
            id="v-nit"
            className={styles.input}
            type="text"
            value={form.nit}
            onChange={(e) => onChange('nit', e.target.value)}
            placeholder="Ej. 1234567-8"
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Teléfono + Activo en fila */}
      <div className={styles.row2}>
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="v-telefono">
            Teléfono <span className={styles.optional}>(opcional)</span>
          </label>
          <input
            id="v-telefono"
            className={styles.input}
            type="text"
            inputMode="tel"
            value={form.telefono}
            onChange={(e) => onChange('telefono', e.target.value)}
            placeholder="Ej. 5555-0000"
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Activo solo en modo edición */}
        {showActivo && (
          <div className={styles.formField}>
            <label className={styles.label}>Estado</label>
            <button
              type="button"
              className={`${styles.toggleBtn} ${form.activo ? styles.toggleActive : styles.toggleInactive}`}
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

      {/* Error global del formulario */}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}