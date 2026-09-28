import { useMutation } from "@tanstack/react-query";
import { CalendarDays, ImagePlus, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { authApi, getErrorMessage } from "@/api";
import { Avatar, Badge, Card, FileDropzone } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { formatDate, roleLabel } from "@/lib/utils";
import type { UserPublic } from "@/types";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** Profile summary with avatar upload (image ≤ 5 MB). */
export function AvatarCard({ user }: { user: UserPublic }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const [progress, setProgress] = useState<number>();

  const upload = useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file, setProgress),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Profil rasmi yangilandi");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setProgress(undefined),
  });

  return (
    <Card className="flex flex-col items-center text-center">
      <Avatar src={user.avatar_url} name={user.full_name} size="xl" className="ring-4 ring-primary-100 dark:ring-primary-950" />
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</h2>
      <Badge tone="primary" className="mt-2">
        {roleLabel(user.role)}
      </Badge>
      <ul className="mt-5 w-full space-y-2 text-left text-sm text-slate-600 dark:text-slate-400">
        <li className="flex items-center gap-2.5">
          <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="min-w-0 truncate">{user.email}</span>
        </li>
        {user.phone && (
          <li className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="min-w-0 truncate">{user.phone}</span>
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span>A'zo: {formatDate(user.created_at)}</span>
        </li>
      </ul>
      <FileDropzone
        className="mt-5 w-full"
        accept="image/*"
        maxSize={MAX_AVATAR_BYTES}
        progress={progress}
        onFile={(file) => upload.mutate(file)}
        label="Rasmni yangilash"
        hint="PNG, JPG yoki WEBP · 5 MB gacha"
        icon={<ImagePlus className="h-6 w-6" />}
      />
    </Card>
  );
}
