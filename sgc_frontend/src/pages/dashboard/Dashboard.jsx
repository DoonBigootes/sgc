import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/layout/PageHeader'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader 
        title="Dashboard"
        subtitle="Información general y vista rápida"
        breadcrumb={[
          { label: 'Inicio' }
        ]}
      />

      <div>
        <p>Bienvenido, {user?.username}</p>
        <p>Rol: {user?.role}</p>
        <p>Tienda: {user?.storeName}</p>
      </div>
    </div>
  )
}