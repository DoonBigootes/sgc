import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import styles from './TopBar.module.css'
import { Icons } from '../../utils/icons'
import { Icon } from 'lucide-react'

export default function TopBar({ sidebarOpen, onToggle }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div className={styles.topbar}>
            <div className={styles.left}>
                <button className={styles.menuBtn} onClick={onToggle} title='Menú'>
                    {sidebarOpen ? <Icons.equis size={16} strokeWidth={2} /> : <Icons.menu size={16} strokeWidth={2} />}
                </button>
                <span className={styles.storeName}>
                    {user?.storeName}
                </span>
            </div>
            
            <div className={styles.right}>
                <span className={styles.username}>{user?.username}</span>
                <button className={styles.logoutBtn} onClick={handleLogout} title='Cerrar Sesión'>
                <Icons.logout size={16} strokeWidth={2}/>
                </button>
            </div>
        </div>
    )

}