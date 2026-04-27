import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../utils/roles'
import styles from './Sidebar.module.css'

const menu = [
  {
    items: [
      { label: 'Dashboard', to: '/dashboard' },
    ]
  },
  {
    group: 'Facturación',
    roles: [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
    items: [
      { label: 'Facturas',         to: '/facturacion/facturas' },
      { label: 'Notas de crédito', to: '/facturacion/notas-credito' },
    ]
  },
  {
    group: 'Caja',
    roles: [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
    items: [
      { label: 'Corte de caja',      to: '/caja/corte' },
      { label: 'Apertura',           to: '/caja/apertura' },
      { label: 'Ingresos y egresos', to: '/caja/ingresos-egresos' },
    ]
  },
  {
    group: 'Inventario',
    roles: [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
    items: [
      { label: 'Stock',     to: '/inventario/stock' },
      { label: 'Traslados', to: '/inventario/traslados', roles: [ROLES.OWNER, ROLES.ADMIN] },
      { label: 'Cierre',    to: '/inventario/cierre',    roles: [ROLES.OWNER, ROLES.ADMIN] },
    ]
  },
  {
    group: 'Compras',
    roles: [ROLES.OWNER, ROLES.ADMIN],
    items: [
      { label: 'Compras',     to: '/compras' },
      { label: 'Proveedores', to: '/compras/proveedores' },
    ]
  },
  {
    group: 'Catálogos',
    roles: [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
    items: [
      { label: 'Productos',  to: '/catalogos/productos' },
      { label: 'Clientes',   to: '/catalogos/clientes' },
      { label: 'Vendedores', to: '/catalogos/vendedores', roles: [ROLES.OWNER, ROLES.ADMIN] },
      { label: 'General',    to: '/catalogos/general',    roles: [ROLES.OWNER, ROLES.ADMIN] },
    ]
  },
  {
    group: 'Reportes',
    roles: [ROLES.OWNER, ROLES.ADMIN],
    items: [
      { label: 'Ventas',     to: '/reportes/ventas' },
      { label: 'Inventario', to: '/reportes/inventario' },
      { label: 'Créditos',   to: '/reportes/creditos' },
      { label: 'Compras',    to: '/reportes/compras' },
    ]
  },
  {
    group: 'Admin',
    roles: [ROLES.OWNER],
    items: [
      { label: 'Usuarios',  to: '/admin/usuarios' },
      { label: 'Tiendas',   to: '/admin/tiendas' },
      { label: 'Auditoría', to: '/admin/auditoria' },
    ]
  },
]

function tieneAcceso(userRole, roles) {
  if (!roles || roles.length === 0) return true
  return roles.includes(userRole)
}

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>SGC</div>
      <nav className={styles.nav}>
        {menu
          .filter(section => tieneAcceso(user?.role, section.roles))
          .map((section, i) => (
            <div key={i} className={styles.section}>
              {section.group && (
                <span className={styles.groupLabel}>{section.group}</span>
              )}
              {section.items
                .filter(item => tieneAcceso(user?.role, item.roles))
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? styles.linkActive : styles.link
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
            </div>
          ))}
      </nav>
    </aside>
  )
}