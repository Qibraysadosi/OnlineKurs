import { useAuthContext } from "@/context/AuthContext";

/** Access the current user, role flags and login/register/logout actions. */
export const useAuth = useAuthContext;
