import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import styles from './AppLayout.module.css'
import Sidebar from './Sidebar'
import TopBar from './TopBar'


export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true) 

  return (
    <div className={styles.container}>
      <div className={`${styles.sidebarWrapper} ${!sidebarOpen ? styles.sidebarWrapperClosed : ''}`}>
        <Sidebar isOpen={sidebarOpen} />
      </div>
      <div className={styles.content}>
        <TopBar sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(prev => !prev)} />
        <main className={styles.main}>
            <Outlet />
        </main>
      </div>
    </div>
  )
}