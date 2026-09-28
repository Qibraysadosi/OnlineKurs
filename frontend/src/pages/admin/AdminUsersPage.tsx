import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Trash2, Users } from "lucide-react";
import { useState } from "react";
import { adminApi, getErrorMessage, queryKeys } from "@/api";
import { ErrorFallback } from "@/components/guards";
import { PageHeader } from "@/components/layout";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Pagination,
  Select,
  Switch,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableContainer,
  TableSkeletonRows,
} from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useToast } from "@/hooks/useToast";
import { ROLE_LABELS, cn, formatDate, formatNumber, roleLabel } from "@/lib/utils";
import type { AdminUserUpdatePayload, AdminUsersParams, Role, UserPublic } from "@/types";
import { ListToolbar } from "./components/ListToolbar";
import { UserCell } from "./components/UserCell";
import { useDebouncedSearchParam } from "./components/useDebouncedSearchParam";
import { useInvalidateAdmin } from "./components/useInvalidateAdmin";

const PAGE_SIZE = 20;
const COLS = 5;
const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
const ROLES = new Set<string>(Object.keys(ROLE_LABELS));

function parseRole(value: string): Role | undefined {
  return ROLES.has(value) ? (value as Role) : undefined;
}

export default function AdminUsersPage() {
  useDocumentTitle("Foydalanuvchilar");
  const { user: me } = useAuth();
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const { get, getNumber, setMany, clear } = useQueryParams();
  const [search, setSearch] = useDebouncedSearchParam();
  const [deleteTarget, setDeleteTarget] = useState<UserPublic | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const role = parseRole(get("role"));
  const params: AdminUsersParams = { q: get("q") || undefined, role, page: getNumber("page", 1), page_size: PAGE_SIZE };
  const hasFilters = Boolean(params.q || role);

  const users = useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: () => adminApi.users(params),
    placeholderData: keepPreviousData,
  });

  const update = useMutation({
    mutationFn: ({ user, payload }: { user: UserPublic; payload: AdminUserUpdatePayload }) => adminApi.updateUser(user.id, payload),
    onMutate: ({ user }) => setBusyId(user.id),
    onSuccess: (updated, { payload }) => {
      if (payload.role !== undefined) toast.success(`${updated.full_name} endi ${roleLabel(updated.role).toLowerCase()}`);
      else toast.success(updated.is_active ? "Foydalanuvchi faollashtirildi" : "Foydalanuvchi bloklandi");
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setBusyId(null),
  });

  const remove = useMutation({
    mutationFn: (user: UserPublic) => adminApi.removeUser(user.id),
    onSuccess: () => {
      toast.success("Foydalanuvchi o'chirildi");
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const data = users.data;
  const showEmpty = data !== undefined && data.items.length === 0;

  return (
    <div className="animate-in">
      <PageHeader
        title="Foydalanuvchilar"
        description="Rollarni boshqaring, foydalanuvchilarni bloklang yoki o'chiring."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Foydalanuvchilar" }]}
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Ism yoki email bo'yicha qidirish"
        summary={data ? `${formatNumber(data.total)} ta foydalanuvchi${hasFilters ? " topildi" : ""}` : undefined}
      >
        <Select
          aria-label="Rol bo'yicha filtr"
          placeholder="Barcha rollar"
          options={ROLE_OPTIONS}
          value={role ?? ""}
          onChange={(event) => setMany({ role: event.target.value, page: null })}
          containerClassName="w-full sm:w-48"
        />
      </ListToolbar>

      {users.isError ? (
        <ErrorFallback message={getErrorMessage(users.error)} onRetry={() => users.refetch()} />
      ) : showEmpty ? (
        <EmptyState
          icon={<Users className="h-7 w-7" aria-hidden="true" />}
          title={hasFilters ? "Hech kim topilmadi" : "Hali foydalanuvchilar yo'q"}
          description={hasFilters ? "Qidiruv so'zini yoki rol filtrini o'zgartirib ko'ring." : "Ro'yxatdan o'tgan foydalanuvchilar shu yerda ko'rinadi."}
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  clear();
                }}
              >
                Filtrlarni tozalash
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <TableContainer className={cn("transition-opacity duration-200", users.isPlaceholderData && "opacity-60")}>
            <Table className="min-w-[820px]">
              <THead>
                <TR>
                  <TH>Foydalanuvchi</TH>
                  <TH>Rol</TH>
                  <TH>Holat</TH>
                  <TH>Qo'shilgan</TH>
                  <TH align="right">Amallar</TH>
                </TR>
              </THead>
              <TBody>
                {users.isPending ? (
                  <TableSkeletonRows rows={8} cols={COLS} />
                ) : (
                  data?.items.map((user) => {
                    const isSelf = user.id === me?.id;
                    const busy = busyId === user.id;
                    return (
                      <TR key={user.id}>
                        <TD>
                          <UserCell user={user} badge={isSelf ? <Badge tone="primary">Siz</Badge> : undefined} />
                        </TD>
                        <TD>
                          <Select
                            size="sm"
                            aria-label={`${user.full_name} — rol`}
                            options={ROLE_OPTIONS}
                            value={user.role}
                            disabled={isSelf || busy}
                            onChange={(event) => update.mutate({ user, payload: { role: event.target.value as Role } })}
                            containerClassName="w-40"
                          />
                        </TD>
                        <TD>
                          <div className="flex items-center gap-2.5">
                            <Switch
                              size="sm"
                              checked={user.is_active}
                              disabled={isSelf || busy}
                              aria-label={user.is_active ? `${user.full_name} — bloklash` : `${user.full_name} — faollashtirish`}
                              onChange={(next) => update.mutate({ user, payload: { is_active: next } })}
                            />
                            <span className={cn("text-xs font-medium", user.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400")}>
                              {user.is_active ? "Faol" : "Bloklangan"}
                            </span>
                          </div>
                        </TD>
                        <TD className="whitespace-nowrap">{formatDate(user.created_at)}</TD>
                        <TD align="right">
                          <IconButton
                            aria-label={`${user.full_name} — o'chirish`}
                            size="sm"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(user)}
                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </IconButton>
                        </TD>
                      </TR>
                    );
                  })
                )}
              </TBody>
            </Table>
          </TableContainer>
          {data && (
            <Pagination className="mt-5" page={data.page} pages={data.pages} total={data.total} onChange={(page) => setMany({ page })} />
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Foydalanuvchini o'chirasizmi?"
        description={`${deleteTarget?.full_name} (${deleteTarget?.email}) hisobi va unga bog'liq ma'lumotlar butunlay o'chiriladi.`}
        confirmText="O'chirish"
        loading={remove.isPending}
        onConfirm={() => remove.mutateAsync(deleteTarget!)}
      />
    </div>
  );
}
