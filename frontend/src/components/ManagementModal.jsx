import { useEffect, useRef } from "react";

export default function ManagementModal({
  title,
  children,
  onClose,
  saving = false
}) {

  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="management-modal"
      aria-labelledby="management-modal-title"
      onCancel={e => {
        e.preventDefault();
        if (!saving) onClose();
      }}
    >

      <div className="management-modal-header">

        <h5 id="management-modal-title" className="mb-0">
          {title}
        </h5>

        <button
          type="button"
          className="btn-close"
          aria-label="Close modal"
          disabled={saving}
          onClick={onClose}
        />

      </div>

      <div className="management-modal-body">
        {children}
      </div>

    </dialog>
  );
}
