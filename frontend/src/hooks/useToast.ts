import { useToastContext } from "@/context/ToastContext";

/** `toast.success("Saqlandi")`, `toast.error(getErrorMessage(err))`, `toast.info(...)` */
export const useToast = useToastContext;
