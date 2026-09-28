import { type ReactNode } from "react";
import { Avatar } from "@/components/ui";
import type { UserPublic } from "@/types";

/** Avatar + name + email, for table rows. */
export function UserCell({ user, badge }: { user: UserPublic; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
          <span className="max-w-[176px] truncate">{user.full_name}</span>
          {badge}
        </p>
        <p className="max-w-[176px] truncate text-xs text-slate-500 dark:text-slate-400" title={user.email}>
          {user.email}
        </p>
      </div>
    </div>
  );
}
