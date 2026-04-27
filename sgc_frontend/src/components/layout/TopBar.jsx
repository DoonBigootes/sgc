import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import styles from './TopBar.module.css'

export default function TopBar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div className={styles.topbar}>
            <span className={styles.storeName}>
                {user?.storeName}
            </span>
            
            <div className={styles.right}>
                <span className={styles.username}>{user?.username}</span>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                Cerrar sesión
                </button>
            </div>
        </div>
    )

}