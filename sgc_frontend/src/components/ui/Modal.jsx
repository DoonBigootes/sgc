// ============================================================
// COMPONENTE: Modal
// ARCHIVO:    src/components/ui/Modal.jsx
// PROYECTO:   SGC — Sistema de Gestión Comercial
// ============================================================
//
// Componente base para todas las modales del sistema.
// Maneja overlay, tamaño, header, body, footer y comportamiento
// (Escape, clic en overlay, scroll lock). Solo recibe contenido
// como children — la lógica interna de cada modal va en el padre.
//
// ------------------------------------------------------------
// IMPORTACIÓN
// ------------------------------------------------------------
//
//   import Modal from '@/components/ui/Modal';
//   // o con ruta relativa:
//   import Modal from '../ui/Modal';
//
// ------------------------------------------------------------
// PROPS
// ------------------------------------------------------------
//
//   isOpen        boolean              REQUERIDO. Controla si la modal está visible.
//   onClose       () => void           REQUERIDO. Se ejecuta al cerrar (X, Escape, overlay).
//   title         string               REQUERIDO. Texto que aparece en el header.
//   onSave        () => void           Opcional.  Callback del botón primario.
//                                                 Si se omite, el botón guardar NO se renderiza.
//   size          'sm'|'base'|'lg'     Opcional.  Ancho máximo del panel. Default: 'base'.
//                                                 sm=400px | base=560px | lg=800px
//   saveLabel     string               Opcional.  Etiqueta del botón primario.   Default: 'Guardar'
//   closeLabel    string               Opcional.  Etiqueta del botón secundario. Default: 'Cancelar'
//   saveDisabled  boolean              Opcional.  Deshabilita el botón guardar.  Default: false
//   loading       boolean              Opcional.  Muestra spinner en guardar y bloquea cierre. Default: false
//   danger        boolean              Opcional.  Botón guardar en rojo. Usar para acciones destructivas. Default: false
//   hideFooter    boolean              Opcional.  Oculta el footer completo. Usar para vistas de solo lectura. Default: false
//   children      ReactNode            REQUERIDO. Contenido del body de la modal.
//
// ------------------------------------------------------------
// COMPORTAMIENTO INCLUIDO (no hay que implementarlo en el padre)
// ------------------------------------------------------------
//
//   - Cierra con la tecla Escape.
//   - Cierra al hacer clic en el overlay oscuro.
//   - Bloquea document.body scroll mientras está abierta.
//   - Animación de entrada en overlay y panel.
//   - Scroll interno en el body si el contenido es largo.
//   - Accesibilidad: role="dialog", aria-modal, aria-labelledby.
//
// ------------------------------------------------------------
// EJEMPLOS DE USO
// ------------------------------------------------------------
//
// — PATRÓN BASE (estado local en el padre) —————————————————
//
//   const [open, setOpen] = useState(false);
//   const handleSave = () => { /* lógica */ setOpen(false); };
//
//   <Modal
//     isOpen={open}
//     onClose={() => setOpen(false)}
//     onSave={handleSave}
//     title="Nuevo cliente"
//   >
//     <input ... />
//   </Modal>
//
// — TAMAÑO sm · Catálogo simple (ej: nuevo banco, nueva marca) ——
//
//   <Modal isOpen={open} onClose={close} onSave={save}
//     title="Nuevo Banco" size="sm">
//     <div className={styles.field}>
//       <label>Nombre</label>
//       <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} />
//     </div>
//   </Modal>
//
// — TAMAÑO base · Formulario estándar (ej: nuevo producto) ———
//
//   <Modal isOpen={open} onClose={close} onSave={save}
//     title="Nuevo Producto" size="base"
//     saveDisabled={!form.codigo || !form.descripcion}
//     loading={guardando}>
//     {/* grid de campos */}
//   </Modal>
//
// — TAMAÑO lg · Vista detalle (ej: detalle de factura) ————————
//
//   <Modal isOpen={open} onClose={close} onSave={imprimir}
//     title={`Factura #${factura.correlativo}`} size="lg"
//     saveLabel="Imprimir" closeLabel="Cerrar">
//     {/* tabla de detalle */}
//   </Modal>
//
// — DANGER · Acción destructiva (ej: anular factura) ——————————
//
//   <Modal isOpen={open} onClose={close} onSave={anular}
//     title="Anular factura" size="sm"
//     danger saveLabel="Anular factura" loading={anulando}>
//     <p>¿Seguro que deseas anular la factura #{id}? Esta acción no se puede deshacer.</p>
//   </Modal>
//
// — SIN FOOTER · Solo lectura (ej: registro de auditoría) ————
//
//   <Modal isOpen={open} onClose={close}
//     title="Registro de auditoría" hideFooter>
//     {/* datos del registro */}
//   </Modal>
//
// — SIN BOTÓN GUARDAR · Solo botón cerrar ————————————————————
//
//   <Modal isOpen={open} onClose={close}
//     title="Información" closeLabel="Entendido">
//     {/* onSave omitido → solo aparece el botón cerrar */}
//   </Modal>
//
// ============================================================

import { useEffect, useRef, useState } from 'react';
import styles from './Modal.module.css';

// Duración de la animación de salida en ms.
// Debe coincidir con la duración definida en Modal.module.css → modalOut / overlayOut.
const EXIT_DURATION = 200;

/**
 * Modal — componente base reutilizable para el SGC.
 *
 * Props:
 *  isOpen        boolean           — controla visibilidad
 *  onClose       () => void        — callback al cerrar
 *  onSave        () => void        — callback al guardar (si se omite, no se muestra el botón)
 *  title         string            — texto del header
 *  size          'sm' | 'base' | 'lg'  — ancho del modal (default: 'base')
 *  children      ReactNode         — contenido del body
 *  saveLabel     string            — etiqueta del botón primario (default: 'Guardar')
 *  closeLabel    string            — etiqueta del botón secundario (default: 'Cancelar')
 *  saveDisabled  boolean           — deshabilita el botón guardar
 *  loading       boolean           — muestra estado cargando en el botón guardar
 *  danger        boolean           — botón guardar en rojo (para acciones destructivas)
 *  hideFooter    boolean           — oculta el footer completamente
 */
export default function Modal({
  isOpen,
  onClose,
  onSave,
  title,
  size = 'base',
  children,
  saveLabel = 'Guardar',
  closeLabel = 'Cancelar',
  saveDisabled = false,
  loading = false,
  danger = false,
  hideFooter = false,
}) {
  const overlayRef = useRef(null);

  // `visible` → controla si el DOM está montado.
  // `closing` → activa las clases de animación de salida antes de desmontar.
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const exitTimer             = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Cancelar cualquier cierre pendiente y montar inmediatamente.
      clearTimeout(exitTimer.current);
      setClosing(false);
      setVisible(true);
    } else {
      // Activar animación de salida → desmontar al terminar.
      setClosing(true);
      exitTimer.current = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, EXIT_DURATION);
    }
    return () => clearTimeout(exitTimer.current);
  }, [isOpen]);

  // Cierra con Escape
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [visible, onClose]);

  // Bloquea scroll del body mientras la modal está visible
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!visible) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  const saveBtnClass = [
    styles.btnSave,
    danger ? styles.btnDanger : '',
    loading ? styles.btnLoading : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`${styles.modal} ${styles[size]} ${closing ? styles.modalClosing : ''}`}>
        {/* ── HEADER ── */}
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          <button
            className={styles.btnClose}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* ── BODY ── */}
        <div className={styles.body}>{children}</div>

        {/* ── FOOTER ── */}
        {!hideFooter && (
          <div className={styles.footer}>
            <button
              className={styles.btnCancel}
              onClick={onClose}
              disabled={loading}
            >
              {closeLabel}
            </button>

            {onSave && (
              <button
                className={saveBtnClass}
                onClick={onSave}
                disabled={saveDisabled || loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Guardando…
                  </>
                ) : (
                  saveLabel
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}