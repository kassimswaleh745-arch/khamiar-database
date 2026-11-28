import { useEffect, useRef } from "react";
import CustomerForm from "../pages/CustomerForm.jsx";

export default function CustomerModal({ onClose, onSaved }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="customer-modal-title"
      onCancel={(e) => e.preventDefault()}
      className="border-0 rounded-3 shadow-lg bg-body text-body p-0"
      style={{
        width: "900px",
        maxWidth: "95vw",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <div className="modal-header border-bottom p-3">
        <h5
          className="modal-title"
          id="customer-modal-title"
        >
          <i className="bi bi-person-plus me-2" />
          Add Customer
        </h5>
      </div>

      <div className="modal-body p-3">
        <CustomerForm
          modal={true}
          onSaved={onSaved}
          onCancel={onClose}
        />
      </div>
    </dialog>
  );
}
