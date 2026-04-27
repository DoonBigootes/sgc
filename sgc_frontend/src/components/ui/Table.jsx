import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Icons } from '../../utils/icons';
import styles from './Table.module.css';

/**
 * ============================================================
 * COMPONENTE: Table — SGC Sistema de Gestión Comercial
 * Archivo   : src/components/ui/Table.jsx
 * ============================================================
 *
 * Tabla reutilizable que maneja fetch, loading, error y vacío.
 * NO llama a `api` directamente — recibe una función de servicio.
 *
 * ── PROPS ───────────────────────────────────────────────────
 *
 * fetchFn     {Function}  OBLIGATORIO (o `data`).
 *                         Función sin argumentos que retorna una Promise.
 *                         Debe venir envuelta en useCallback en el padre.
 *                         Acepta que el servicio retorne: Array | { data: Array }
 *
 * data        {Array}     Alternativa a fetchFn para datos estáticos.
 *
 * columns     {Array}     OBLIGATORIO. Definir FUERA del componente (nivel módulo).
 *   Cada objeto:
 *     key     {string}    Nombre del campo en el objeto de datos.
 *     label   {string}    Texto del encabezado de columna.
 *     hidden  {boolean}   Si true, la columna no se renderiza. (ej: id)
 *     render  {Function}  Opcional. (value, row) => ReactNode
 *
 * rowActions  {Array}     Opcional. Agrega columna de menú (ícono ⋮) al final.
 *                         Definir FUERA del componente (nivel módulo).
 *   Cada objeto:
 *     label   {string}    Texto del ítem de menú.
 *     onClick {Function}  (row) => void — recibe el objeto completo de la fila.
 *     danger  {boolean}   Opcional. Si true, el ítem se renderiza en rojo.
 *
 * emptyText   {string}    Mensaje cuando no hay filas. Default: 'Sin resultados.'
 * onRowClick  {Function}  (row) => void — click en fila. No interfiere con rowActions.
 * loading     {boolean}   Fuerza estado de carga desde el padre.
 * className   {string}    Clase CSS adicional para el contenedor.
 *
 * ── REGLA CRÍTICA: useCallback ──────────────────────────────
 *
 * fetchFn SIEMPRE debe definirse con useCallback en el componente padre.
 * Si se pasa una función anónima directamente en JSX, React crea una nueva
 * referencia en cada render y la tabla entra en un loop infinito de fetches.
 *
 *   ✅ CORRECTO:
 *   const fetchClientes = useCallback(
 *     () => getClientes({ activo: true }),
 *     []
 *   )
 *   <Table fetchFn={fetchClientes} ... />
 *
 *   ❌ INCORRECTO — loop infinito:
 *   <Table fetchFn={() => getClientes({ activo: true })} ... />
 *
 * ── REFETCH AUTOMÁTICO POR FILTROS ──────────────────────────
 *
 * Para que la tabla recargue al cambiar filtros, incluir el filtro
 * como dependencia del useCallback. Cuando el valor cambia, fetchFn
 * obtiene una nueva referencia y la tabla re-ejecuta el fetch.
 *
 *   const [tiendaId, setTiendaId] = useState(1)
 *   const fetchFacturas = useCallback(
 *     () => getFacturas({ id_tienda: tiendaId }),
 *     [tiendaId]   // ← re-fetch automático al cambiar tiendaId
 *   )
 *
 * ── PATRÓN COMPLETO DE USO ───────────────────────────────────
 *
 *   // 1. En el servicio (services/catalogo.service.js):
 *   export async function getClientes(params) {
 *     const res = await api.get('/clientes', { params })
 *     return res.data
 *   }
 *
 *   // 2. En la página:
 *   import { useCallback, useState } from 'react'
 *   import { getClientes } from '../../services/catalogo.service'
 *   import Table from '../../components/ui/Table'
 *
 *   // Columnas y acciones: SIEMPRE fuera del componente (referencias estables)
 *   const COLUMNS = [
 *     { key: 'id',      label: 'ID',      hidden: true },
 *     { key: 'codigo',  label: 'Código' },
 *     { key: 'nombre',  label: 'Nombre' },
 *     { key: 'activo',  label: 'Estado',
 *       render: (val) => <Badge active={val} /> },
 *   ]
 *
 *   const ROW_ACTIONS = [
 *     { label: 'Editar',   onClick: (row) => { ... } },
 *     { label: 'Eliminar', onClick: (row) => { ... }, danger: true },
 *   ]
 *
 *   export default function Clientes() {
 *     const [soloActivos, setSoloActivos] = useState(true)
 *
 *     const fetchClientes = useCallback(
 *       () => getClientes({ activo: soloActivos }),
 *       [soloActivos]
 *     )
 *
 *     return (
 *       <Table
 *         columns={COLUMNS}
 *         fetchFn={fetchClientes}
 *         rowActions={ROW_ACTIONS}
 *         emptyText="No hay clientes registrados."
 *       />
 *     )
 *   }
 *
 * ── VARIANTE SIN rowActions ──────────────────────────────────
 *
 *   // Si la página no necesita menú de opciones, omitir rowActions.
 *   <Table columns={COLUMNS} fetchFn={fetchProductos} />
 *
 * ── VARIANTE CON onRowClick ──────────────────────────────────
 *
 *   // Para navegar al detalle al hacer click en una fila:
 *   <Table
 *     columns={COLUMNS}
 *     fetchFn={fetchFacturas}
 *     onRowClick={(row) => navigate(`/facturacion/facturas/${row.id}`)}
 *   />
 *
 * ── VARIANTE CON DATOS ESTÁTICOS ────────────────────────────
 *
 *   // Para tablas cuya data ya fue obtenida por el padre:
 *   <Table columns={COLUMNS} data={misRegistros} />
 * ============================================================
 */

/**
 * SGC — Componente Table reutilizable
 *
 * Props:
 *   columns     {Array}    Definición de columnas. Cada objeto:
 *                            key     {string}    Campo del objeto de datos
 *                            label   {string}    Encabezado visible
 *                            hidden  {boolean}   Si true, la columna no se muestra
 *                            render  {Function}  (value, row) => ReactNode
 *
 *   fetchFn     {Function} Función de servicio que retorna los datos.
 *                          No recibe argumentos — el padre es responsable de
 *                          encapsular los parámetros con useCallback.
 *                          Debe retornar: un Array, o un objeto con { data: Array }.
 *
 *   data        {Array}    Datos estáticos. Alternativa a fetchFn.
 *
 *   rowActions  {Array}    Acciones del menú de opciones. Cada objeto:
 *                            label   {string}    Texto del ítem
 *                            onClick {Function}  (row) => void
 *                            danger  {boolean}   Si true, el ítem se pinta en rojo
 *
 *   emptyText   {string}   Mensaje cuando no hay datos.
 *   onRowClick  {Function} (row) => void
 *   loading     {boolean}  Fuerza el estado de carga desde fuera.
 *   className   {string}   Clase extra para el contenedor.
 *
 * ─────────────────────────────────────────────────────────────
 * PATRÓN DE USO CON SERVICIO:
 *
 *   // En el servicio (catalogo.service.js):
 *   export async function getClientes(params) {
 *     const res = await api.get('/clientes', { params })
 *     return res.data
 *   }
 *
 *   // En la página:
 *   const fetchClientes = useCallback(
 *     () => getClientes({ activo: true, id_tienda: selectedTienda }),
 *     [selectedTienda]           // ← re-fetch automático al cambiar filtros
 *   )
 *
 *   <Table fetchFn={fetchClientes} columns={COLUMNS} rowActions={ROW_ACTIONS} />
 *
 * ─────────────────────────────────────────────────────────────
 * ¿POR QUÉ useCallback EN EL PADRE?
 *
 *   Si pasas una función anónima como fetchFn directamente en el JSX
 *   (ej. fetchFn={() => getClientes({ activo: true })}),
 *   React crea una nueva referencia en cada render y el Table entraría
 *   en un loop infinito de fetches.
 *   useCallback garantiza que la referencia solo cambia cuando cambian
 *   sus dependencias, lo cual además dispara el re-fetch correctamente.
 */
export default function Table({
  columns = [],
  fetchFn,
  data: staticData,
  rowActions,
  emptyText = 'Sin resultados.',
  onRowClick,
  loading: externalLoading,
  className = '',
}) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(!!fetchFn);
  const [error, setError]       = useState(null);
  const [openMenu, setOpenMenu] = useState(null); // { rowId, top, right }

  const menuRef = useRef(null);

  const visibleColumns = useMemo(
    () => columns.filter((col) => !col.hidden),
    [columns],
  );

  const hasActions = Array.isArray(rowActions) && rowActions.length > 0;
  const totalCols  = visibleColumns.length + (hasActions ? 1 : 0);

  // ── Data fetching ─────────────────────────────────────────────
  // fetchData is stable as long as fetchFn doesn't change.
  // fetchFn changes only when the parent's useCallback deps change → correct.
  const fetchData = useCallback(async () => {
    if (!fetchFn) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      // Accept both a plain array and { data: [...] } shaped responses
      setRows(Array.isArray(result) ? result : (result?.data ?? []));
    } catch (err) {
      // axios errors expose err.response; plain errors expose err.message
      setError(err?.response?.data?.message ?? err?.message ?? 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (fetchFn) {
      fetchData();
    } else if (staticData) {
      setRows(staticData);
      setLoading(false);
    }
  }, [fetchData, fetchFn, staticData]);

  // ── Close menu on outside click or Escape ─────────────────────
  useEffect(() => {
    if (!openMenu) return;

    const onMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  // ── Ellipsis click ────────────────────────────────────────────
  const handleEllipsisClick = (e, rowId) => {
    e.stopPropagation(); // prevent onRowClick from firing

    if (openMenu?.rowId === rowId) {
      setOpenMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu({
      rowId,
      top:   rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  };

  const handleActionClick = (action, row) => {
    setOpenMenu(null);
    action.onClick(row);
  };

  const isLoading = externalLoading ?? loading;

  return (
    <>
      <div className={`${styles.wrapper} ${className}`}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.key} className={styles.th}>
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th
                  className={`${styles.th} ${styles.thActions}`}
                  aria-label="Acciones"
                />
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={styles.skeletonRow}>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className={styles.td}>
                      <span className={styles.skeleton} />
                    </td>
                  ))}
                  {hasActions && <td className={styles.td} />}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={totalCols} className={styles.stateCell}>
                  <span className={styles.errorState}>{error}</span>
                  <button className={styles.retryBtn} onClick={fetchData}>
                    Reintentar
                  </button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className={styles.stateCell}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => {
                const rowId = row.id ?? rowIdx;
                return (
                  <tr
                    key={rowId}
                    className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {visibleColumns.map((col) => (
                      <td key={col.key} className={styles.td}>
                        {col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? '—')}
                      </td>
                    ))}

                    {hasActions && (
                      <td className={`${styles.td} ${styles.tdActions}`}>
                        <button
                          className={`${styles.ellipsisBtn} ${
                            openMenu?.rowId === rowId ? styles.ellipsisBtnActive : ''
                          }`}
                          onClick={(e) => handleEllipsisClick(e, rowId)}
                          aria-label="Opciones"
                          aria-haspopup="true"
                          aria-expanded={openMenu?.rowId === rowId}
                        >
                          <Icons.ellipsis />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dropdown — fixed position escapes the table's overflow:hidden */}
      {openMenu && (
        <ul
          ref={menuRef}
          className={styles.dropdown}
          role="menu"
          style={{
            position: 'fixed',
            top:      openMenu.top,
            right:    openMenu.right,
          }}
        >
          {rowActions.map((action, i) => {
            const activeRow = rows.find((r, idx) => (r.id ?? idx) === openMenu.rowId);
            return (
              <li key={i} role="none">
                <button
                  role="menuitem"
                  className={`${styles.dropdownItem} ${
                    action.danger ? styles.dropdownItemDanger : ''
                  }`}
                  onClick={() => handleActionClick(action, activeRow)}
                >
                  {action.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}