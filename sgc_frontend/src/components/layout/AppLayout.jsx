import { Outlet } from 'react-router-dom'
import styles from './AppLayout.module.css'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.content}>
        <TopBar />
        <main className={styles.main}>
            <Outlet />
        </main>
      </div>
    </div>
  )
}