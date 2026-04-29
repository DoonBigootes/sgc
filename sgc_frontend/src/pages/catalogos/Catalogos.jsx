/**
 * PÁGINA: Catálogos Generales
 * ARCHIVO: src/pages/catalogos/Catalogos.jsx
 *
 * Muestra un listado lateral de catálogos disponibles.
 * Al seleccionar uno, carga su grid con opciones de crear,
 * editar y eliminar registros usando modales.
 */

import { useState, useCallback } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import { getCatalogo, createCatalogo, updateCatalogo, deleteCatalogo } from '../../services/catalogo.service'
import styles from './Catalogos.module.css'

// ─── Definición de catálogos disponibles ──────────────────────────────────────
// slug: coincide con el segmento de la URL del backend (/api/v1/:slug)
const CATALOGOS = [
  { slug: 'marcas',               label: 'Marcas' },
  { slug: 'tipos-cliente',        label: 'Tipos de Cliente' },
  { slug: 'tipos-producto',       label: 'Tipos de Producto' },
  { slug: 'clasificaciones',      label: 'Clasificaciones' },
  { slug: 'unidades-medida',      label: 'Unidades de Medida' },
  { slug: 'bancos',               label: 'Bancos' },
  { slug: 'tipos-pago',           label: 'Tipos de Pago' },
  { slug: 'tipos-factura',        label: 'Tipos de Factura' },
  { slug: 'tipos-nota-credito',   label: 'Tipos de Nota de Crédito' },
  { slug: 'tipos-traslado',       label: 'Tipos de Traslado' },
  { slug: 'tipos-compra',         label: 'Tipos de Compra' },
]

// ─── Columnas de la tabla (estables, fuera del componente) ────────────────────
const COLUMNS = [
  { key: 'id',     label: 'ID',     hidden: true },
  { key: 'nombre', label: 'Nombre' },
]

// ─── Estado inicial del formulario ────────────────────────────────────────────
const EMPTY_FORM = { nombre: '' }

export default function Catalogos() {
  // Catálogo activo
  const [activeCatalog, setActiveCatalog] = useState(CATALOGOS[0])

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
  // Se recrea sólo cuando cambia el catálogo activo o tableKey,
  // lo que dispara un re-fetch automático en la tabla.
  const fetchFn = useCallback(
    () => getCatalogo(activeCatalog.slug),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCatalog.slug, tableKey],
  )

  // ── Acciones del menú de fila ──────────────────────────────────────────────
  // Definidas dentro del componente porque necesitan acceso al state de modales.
  // Se recalculan sólo cuando cambian las dependencias del useCallback.
  const rowActions = useCallback(() => [
    {
      label: 'Editar',
      onClick: (row) => {
        setSelectedRow(row)
        setForm({ nombre: row.nombre ?? '' })
        setFormErr('')
        setEditModal(true)
      },
    },
    {
      label: 'Eliminar',
      danger: true,
      onClick: (row) => {
        setSelectedRow(row)
        setDeleteModal(true)
      },
    },
  ], [])

  // ── Cambio de catálogo ─────────────────────────────────────────────────────
  const handleSelectCatalog = (cat) => {
    if (cat.slug === activeCatalog.slug) return
    setActiveCatalog(cat)
    setSelectedRow(null)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
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
    if (!form.nombre.trim()) {
      setFormErr('El nombre es requerido.')
      return
    }
    setSaving(true)
    setFormErr('')
    try {
      await createCatalogo(activeCatalog.slug, { nombre: form.nombre.trim() })
      closeCreate()
      refreshTable()
    } catch (err) {
      setFormErr(err?.response?.data?.message ?? 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Editar ────────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!form.nombre.trim()) {
      setFormErr('El nombre es requerido.')
      return
    }
    setSaving(true)
    setFormErr('')
    try {
      await updateCatalogo(activeCatalog.slug, selectedRow.id, { nombre: form.nombre.trim() })
      closeEdit()
      refreshTable()
    } catch (err) {
      setFormErr(err?.response?.data?.message ?? 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true)
    setDeleteErr('')
    try {
      await deleteCatalogo(activeCatalog.slug, selectedRow.id)
      closeDelete()
      refreshTable()
    } catch (err) {
      setDeleteErr(err?.response?.data?.message ?? 'Error al eliminar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── PageHeader ──────────────────────────────────────────── */}
      <PageHeader
        title={activeCatalog.label}
        subtitle="Administración de catálogos generales del sistema"
        breadcrumb={[
          { label: 'Catálogos', path: '/catalogos/general' },
          { label: activeCatalog.label },
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
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
            Nuevo registro
          </button>
        }
      />

      {/* ── Layout: lista de catálogos + tabla ──────────────────── */}
      <div className={styles.layout}>

        {/* Nav lateral */}
        <nav className={styles.catalogNav} aria-label="Catálogos disponibles">
          <p className={styles.navLabel}>Catálogos</p>
          <ul className={styles.navList}>
            {CATALOGOS.map((cat) => (
              <li key={cat.slug}>
                <button
                  className={`${styles.navItem} ${
                    activeCatalog.slug === cat.slug ? styles.navItemActive : ''
                  }`}
                  onClick={() => handleSelectCatalog(cat)}
                >
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Área de tabla */}
        <div className={styles.tableArea}>
          <Table
            key={`${activeCatalog.slug}-${tableKey}`}
            columns={COLUMNS}
            fetchFn={fetchFn}
            rowActions={rowActions()}
            emptyText={`No hay registros en ${activeCatalog.label}.`}
          />
        </div>
      </div>

      {/* ── Modal: Crear ────────────────────────────────────────── */}
      <Modal
        isOpen={createModal}
        onClose={closeCreate}
        onSave={handleCreate}
        title={`Nuevo — ${activeCatalog.label}`}
        size="sm"
        saveLabel="Crear"
        loading={saving}
      >
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="create-nombre">
            Nombre <span className={styles.required}>*</span>
          </label>
          <input
            id="create-nombre"
            className={`${styles.input} ${formErr ? styles.inputError : ''}`}
            type="text"
            value={form.nombre}
            onChange={(e) => { setForm({ nombre: e.target.value }); setFormErr('') }}
            placeholder={`Nombre del registro…`}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
          />
          {formErr && <p className={styles.errorMsg}>{formErr}</p>}
        </div>
      </Modal>

      {/* ── Modal: Editar ───────────────────────────────────────── */}
      <Modal
        isOpen={editModal}
        onClose={closeEdit}
        onSave={handleEdit}
        title="Editar registro"
        size="sm"
        saveLabel="Guardar cambios"
        loading={saving}
      >
        <div className={styles.formField}>
          <label className={styles.label} htmlFor="edit-nombre">
            Nombre <span className={styles.required}>*</span>
          </label>
          <input
            id="edit-nombre"
            className={`${styles.input} ${formErr ? styles.inputError : ''}`}
            type="text"
            value={form.nombre}
            onChange={(e) => { setForm({ nombre: e.target.value }); setFormErr('') }}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleEdit() }}
          />
          {formErr && <p className={styles.errorMsg}>{formErr}</p>}
        </div>
      </Modal>

      {/* ── Modal: Eliminar ─────────────────────────────────────── */}
      <Modal
        isOpen={deleteModal}
        onClose={closeDelete}
        onSave={handleDelete}
        title="Eliminar registro"
        size="sm"
        saveLabel="Eliminar"
        danger
        loading={saving}
      >
        <p className={styles.deleteText}>
          ¿Estás seguro que deseas eliminar{' '}
          <strong>"{selectedRow?.nombre}"</strong>?
          Esta acción no se puede deshacer.
        </p>
        {deleteErr && <p className={styles.deleteErrMsg}>{deleteErr}</p>}
      </Modal>
    </div>
  )
}