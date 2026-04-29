import { Link } from 'react-router-dom'
import styles from './PageHeader.module.css'

/**
 * Props:
 *   title      string   — required
 *   subtitle   string   — optional
 *   breadcrumb array    — [{ label, path? }]
 *   actions    node     — buttons/controls to show on the right
 */


/**
 * ========================= PageHeader Usage Guide =========================
 *
 * This component is a reusable page header for all main views.
 * It standardizes:
 *   - Page title
 *   - Subtitle (optional)
 *   - Breadcrumb navigation
 *   - Right-aligned actions (buttons / controls)
 *
 * --------------------------------------------------------------------------
 * BASIC USAGE
 * --------------------------------------------------------------------------
 *
 * <PageHeader
 *   title="Users"
 *   subtitle="Manage system users"
 *   breadcrumb={[
 *     { label: 'Home', path: '/' },
 *     { label: 'Users', path: '/users' },
 *     { label: 'Edit User' } // no path = current page (not clickable)
 *   ]}
 *   actions={
 *     <>
 *       <button onClick={handleSave}>Save</button>
 *       <button onClick={handleCancel}>Cancel</button>
 *     </>
 *   }
 * />
 *
 * --------------------------------------------------------------------------
 * PROPS
 * --------------------------------------------------------------------------
 *
 * title (string, required)
 *   Main page title (rendered as <h1>)
 *
 * subtitle (string, optional)
 *   Secondary description under the title
 *
 * breadcrumb (array, optional)
 *   Array of objects: { label: string, path?: string }
 *   - If "path" is provided → renders as clickable <Link>
 *   - If no "path" → renders as plain text (current page)
 *
 * actions (ReactNode, optional but VERY IMPORTANT)
 *   Rendered on the right side of the header.
 *   This is where ALL primary page actions should go.
 *
 * --------------------------------------------------------------------------
 * ACTIONS (IMPORTANT - READ THIS CAREFULLY)
 * --------------------------------------------------------------------------
 *
 * The "actions" prop is NOT just a button.
 * It is a flexible container that accepts ANY valid JSX.
 *
 * ✔ Correct usage:
 *
 * actions={
 *   <>
 *     <button onClick={handleCreate}>New</button>
 *     <button onClick={handleExport}>Export</button>
 *   </>
 * }
 *
 * ✔ You can pass:
 *   - Multiple buttons
 *   - Dropdowns
 *   - Filters
 *   - Custom components
 *
 * Example:
 *
 * actions={
 *   <div style={{ display: 'flex', gap: '0.5rem' }}>
 *     <FilterComponent />
 *     <button onClick={handleRefresh}>Refresh</button>
 *   </div>
 * }
 *
 * --------------------------------------------------------------------------
 * ACTIONS DESIGN RULES (IMPORTANT FOR CONSISTENCY)
 * --------------------------------------------------------------------------
 *
 * 1. ALWAYS use actions for page-level operations:
 *    - Create / Save / Delete
 *    - Export / Import
 *    - Refresh / Sync
 *
 * 2. DO NOT put actions inside the page body if they belong to the header.
 *
 * 3. Keep actions visually grouped:
 *    - Use fragments <>...</> OR a flex container
 *
 * 4. Avoid overloading:
 *    - If too many actions → group them (dropdown or menu)
 *
 * 5. Primary action should be visually clear (first or styled differently)
 *
 * --------------------------------------------------------------------------
 * COMMON MISTAKES
 * --------------------------------------------------------------------------
 *
 * ❌ Passing plain text to actions
 *    actions="Save"
 *
 * ❌ Forgetting fragment when passing multiple elements
 *    actions={
 *      <button>A</button>
 *      <button>B</button>
 *    }
 *
 * ❌ Putting business logic inside PageHeader
 *    → Keep logic in parent, pass handlers down
 *
 * --------------------------------------------------------------------------
 * MENTAL MODEL
 * --------------------------------------------------------------------------
 *
 * Think of PageHeader as:
 *
 *   LEFT SIDE → Context (where am I?)
 *   RIGHT SIDE → Actions (what can I do here?)
 *
 * --------------------------------------------------------------------------
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