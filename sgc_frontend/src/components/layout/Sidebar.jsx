import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../utils/roles'
import styles from './Sidebar.module.css'
import { Icons } from '../../utils/icons'

const menu = [
  {
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: Icons.dashboard},
    ]
  },
  {
    group: 'Facturación',
    roles: [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
    items: [
      { label: 'Facturas',         to: '/facturacion/facturas', icon: Icons.factura },
      { label: 'Notas de crédito', to: '/facturacion/notas-credito', icon: Icons.credito },
    ]
  },
  {
    group: 'Caja',
    roles: [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
    items: [
      { label: 'Corte de caja',      to: '/caja/corte', icon: Icons.cierreCaja },
      { label: 'Apertura',           to: '/caja/apertura', icon: Icons.aperturaCaja },
    ]
  },
  {
    group: 'Inventario',
    roles: [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
    items: [
      { label: 'Existencia',  to: '/inventario/existencia', icon: Icons.inventario },
      { label: 'Traslados', to: '/inventario/traslados', roles: [ROLES.OWNER, ROLES.ADMIN], icon: Icons.traslado },
      { label: 'Cierre',    to: '/inventario/cierre',    roles: [ROLES.OWNER, ROLES.ADMIN], icon: Icons.cierreInventario },
    ]
  },
  {
    group: 'Compras',
    roles: [ROLES.OWNER, ROLES.ADMIN],
    items: [
      { label: 'Compras',     to: '/compras', icon: Icons.compras },
      { label: 'Cuentas por Pagar', to: '/compras/cuentas_por_pagar', icon: Icons.cxp },
    ]
  },
  {
    group: 'Catálogos',
    roles: [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
    items: [
      { label: 'Productos',  to: '/catalogos/productos', icon: Icons.productos },
      { label: 'Clientes',   to: '/catalogos/clientes', icon: Icons.clientes },
      { label: 'Vendedores', to: '/catalogos/vendedores', roles: [ROLES.OWNER, ROLES.ADMIN], icon: Icons.vendedores },
      { label: 'General',    to: '/catalogos/general',    roles: [ROLES.OWNER, ROLES.ADMIN], icon: Icons.catalogo },
    ]
  },
  {
    group: 'Reportes',
    roles: [ROLES.OWNER, ROLES.ADMIN],
    items: [
      { label: 'Ventas',     to: '/reportes/ventas', icon: Icons.reporte },
      { label: 'Inventario', to: '/reportes/inventario', icon: Icons.reporte },
      { label: 'Créditos',   to: '/reportes/creditos', icon: Icons.reporte },
      { label: 'Compras',    to: '/reportes/compras', icon: Icons.reporte },
    ]
  },
  {
    group: 'Admin',
    roles: [ROLES.OWNER],
    items: [
      { label: 'Usuarios',  to: '/admin/usuarios', icon: Icons.usuario },
      { label: 'Tiendas',   to: '/admin/tiendas', icon: Icons.tienda },
      { label: 'Auditoría', to: '/admin/auditoria', icon: Icons.audit },
    ]
  },
]

function tieneAcceso(userRole, roles) {
  if (!roles || roles.length === 0) return true
  return roles.includes(userRole)
}

const groupNames = menu.filter(s => s.group).map(s => s.group)

// Inicializa todos los grupos como abiertos
function buildInitialState() {
  return menu.reduce((acc, section) => {
    if (section.group) acc[section.group] = true
    return acc
  }, {})
}


export default function Sidebar({ isOpen }) {
  const { user } = useAuth()
  const [openGroups, setOpenGroups] = useState(buildInitialState)
 
  function toggleGroup(groupName) {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))
  }

    function collapseAll() {
    setOpenGroups(groupNames.reduce((acc, name) => ({ ...acc, [name]: false }), {}))
  }
 
  function expandAll() {
    setOpenGroups(groupNames.reduce((acc, name) => ({ ...acc, [name]: true }), {}))
  }


    return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.hidden : ''}`}>
      <div className={styles.logo}>SGC
        <div className={styles.logoActions}>
          <button
            className={styles.logoBtn}
            onClick={collapseAll}
            title="Colapsar todo"
          >
            <Icons.collapse size={15} strokeWidth={2} />
          </button>
          <button
            className={styles.logoBtn}
            onClick={expandAll}
            title="Expandir todo"
          >
            <Icons.expand size={15} strokeWidth={2} />
          </button>
        </div>

      </div>

      <nav className={styles.nav}>
        {menu
          .filter(section => tieneAcceso(user?.role, section.roles))
          .map((section, i) => {
            const isOpen = section.group ? openGroups[section.group] : true
 
            return (
              <div key={i} className={styles.section}>
                {section.group && (
                  <button
                    className={styles.groupLabel}
                    onClick={() => toggleGroup(section.group)}
                    aria-expanded={isOpen}
                  >
                    <span>{section.group}</span>
                    <Icons.flechaDerecha
                      size={14}
                      strokeWidth={2.5}
                      className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    />
                  </button>
                )}
 
                {isOpen && section.items
                  .filter(item => tieneAcceso(user?.role, item.roles))
                  .map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          isActive ? styles.linkActive : styles.link
                        }
                      >
                        {Icon && <Icon size={18} strokeWidth={2} />}
                        {item.label}
                      </NavLink>
                    )
                  })}
              </div>
            )
          })}
      </nav>
    </aside>
  )

}