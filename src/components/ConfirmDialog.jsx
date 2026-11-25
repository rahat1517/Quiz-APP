import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import styles from './ConfirmDialog.module.css';

/**
 * Accessible confirmation dialog.
 * Radix handles focus trapping, Escape to close, returning focus to the
 * trigger, and labelling the dialog with its title and description.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  tone = 'primary',
  icon = '✓',
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} />
        <DialogPrimitive.Content className={styles.box}>
          <span
            className={`${styles.icon} ${tone === 'danger' ? styles.iconDanger : ''}`}
            aria-hidden
          >
            {icon}
          </span>
          <DialogPrimitive.Title className={styles.title}>{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className={styles.description}>
            {description}
          </DialogPrimitive.Description>

          <div className={styles.actions}>
            <DialogPrimitive.Close asChild>
              <Button type="button" className={styles.cancelButton}>
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <Button
              type="button"
              className={`${styles.confirmButton} ${tone === 'danger' ? styles.danger : ''}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
