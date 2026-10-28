export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "OTHER", label: "Other" },
];

export const methodLabel = (value) =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label || "—";

export const TICKET_PILL = {
  ISSUED: { label: "Issued", cls: "pill-blue" },
  USED: { label: "Used", cls: "pill-green" },
  CANCELLED: { label: "Cancelled", cls: "pill-grey" },
};

// Inaunganisha ujumbe wa makosa ya fomu (field errors) kuwa sentensi moja
export const explain = (err) =>
  (err.errors && Object.values(err.errors).join(". ")) || err.message;

export function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Opens the calendar when the date box is tapped (some phone browsers only open it from the small icon)
export function openPicker(e) {
  try {
    e.currentTarget.showPicker?.();
  } catch {
    /* the browser will use its own behaviour */
  }
}
