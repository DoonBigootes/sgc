import { Link } from 'react-router-dom'
import styles from './PageHeader.module.css'

/**
 * Props:
 *   title      string   — required
 *   subtitle   string   — optional
 *   breadcrumb array    — [{ label, path? }]
 *   actions    node     — buttons/controls to show on the right
 */
const PageHeader = ({ title, subtitle, breadcrumb, actions }) => (
  <div className={styles.header}>
    {breadcrumb && breadcrumb.length > 0 && (
      <nav className={styles.breadcrumb}>
        {breadcrumb.map((crumb, i) => (
          <span key={i} className={styles.crumbItem}>
            {i > 0 && <span className={styles.sep}>/</span>}
            {crumb.path
              ? <Link to={crumb.path} className={styles.crumbLink}>{crumb.label}</Link>
              : <span className={styles.crumbCurrent}>{crumb.label}</span>
            }
          </span>
        ))}
      </nav>
    )}
    <div className={styles.row}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  </div>
)

export default PageHeader