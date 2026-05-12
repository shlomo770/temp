import Swal from "sweetalert2";

/** ברירות מחדם RTL — עקביות בכל האפליקציה */
const rtlDefaults = {
  rtl: true,
  customClass: { popup: "jbk-swal-popup" },
} as const;

export async function swalInfo(message: string, title = "הודעה"): Promise<void> {
  await Swal.fire({
    ...rtlDefaults,
    icon: "info",
    title,
    text: message,
    confirmButtonText: "אישור",
  });
}

export async function swalWarning(message: string, title = "שים לב"): Promise<void> {
  await Swal.fire({
    ...rtlDefaults,
    icon: "warning",
    title,
    text: message,
    confirmButtonText: "הבנתי",
  });
}

/** אישור כללי (כן / ביטול) — מחליף מודאל Confirm ייעודי */
export async function swalConfirm(
  message: string,
  options?: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
  }
): Promise<boolean> {
  const {
    title = "אישור",
    confirmText = "כן",
    cancelText = "ביטול",
  } = options ?? {};
  const r = await Swal.fire({
    ...rtlDefaults,
    icon: "question",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    focusCancel: true,
    reverseButtons: true,
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#4b5563",
  });
  return r.isConfirmed;
}

/** אישור מחיקה / פעולה הרסנית — מחזיר true רק אם המשתמש אישר */
export async function swalConfirmDanger(
  message: string,
  options?: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    /** true = תוכן כ-HTML (למשל <strong>) — רק למחרוזות מבוקרות בקוד */
    richText?: boolean;
  }
): Promise<boolean> {
  const {
    title = "אישור פעולה",
    confirmText = "מחק",
    cancelText = "ביטול",
    richText = false,
  } = options ?? {};
  const r = await Swal.fire({
    ...rtlDefaults,
    icon: "warning",
    title,
    ...(richText
      ? { html: message.replace(/\n/g, "<br/>") }
      : { text: message }),
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    focusCancel: true,
    reverseButtons: true,
    confirmButtonColor: "#b91c1c",
    cancelButtonColor: "#4b5563",
  });
  return r.isConfirmed;
}
