export const ROLES = {
  OWNER:    'Administrador',
  ADMIN:    'Gerente',
  STORE:    'Usuario Tienda',
  SALESMAN: 'Vendedor',
}

export const PERMISSIONS = {
  facturacion:  [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
  caja:         [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
  inventario:   [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
  traslados:    [ROLES.OWNER, ROLES.ADMIN],
  compras:      [ROLES.OWNER, ROLES.ADMIN],
  reportes:     [ROLES.OWNER, ROLES.ADMIN],
  catalogos:    [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE],
  clientes:     [ROLES.OWNER, ROLES.ADMIN, ROLES.STORE, ROLES.SALESMAN],
  admin:        [ROLES.OWNER],
}