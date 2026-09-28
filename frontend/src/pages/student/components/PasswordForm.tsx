import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { authApi, getErrorMessage } from "@/api";
import { tokenStorage } from "@/api/client";
import { Button, Card, CardFooter, CardHeader, IconButton, Input } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type { ChangePasswordPayload, Tokens } from "@/types";
import { passwordChangeSchema, type PasswordFormValues } from "./schemas";

const EMPTY: PasswordFormValues = { current_password: "", new_password: "", confirm_password: "" };

/** Change-password card with show/hide toggle for the new password. */
export function PasswordForm() {
  const toast = useToast();
  const { setUser } = useAuth();
  const [reveal, setReveal] = useState(false);
  const form = useForm<PasswordFormValues>({ resolver: zodResolver(passwordChangeSchema), defaultValues: EMPTY });
  const { errors } = form.formState;

  const change = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: (tokens: Tokens) => {
      // The change revokes every earlier token pair (including ours): swap in the fresh one
      // so the next authenticated request does not bounce the user to /login.
      tokenStorage.set(tokens);
      setUser(tokens.user);
      form.reset(EMPTY);
      toast.success("Parol o'zgartirildi", { description: "Yangi parol darhol kuchga kirdi." });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const onSubmit = form.handleSubmit((values) =>
    change.mutate({ current_password: values.current_password, new_password: values.new_password }),
  );

  const revealButton = (
    <IconButton
      aria-label={reveal ? "Parolni yashirish" : "Parolni ko'rsatish"}
      size="sm"
      onClick={() => setReveal((v) => !v)}
      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
    >
      {reveal ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
    </IconButton>
  );

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader title="Parolni o'zgartirish" description="Xavfsizlik uchun kamida 8 ta belgidan iborat kuchli parol tanlang." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Joriy parol"
            type="password"
            autoComplete="current-password"
            required
            error={errors.current_password?.message}
            containerClassName="sm:col-span-2"
            {...form.register("current_password")}
          />
          <Input
            label="Yangi parol"
            type={reveal ? "text" : "password"}
            autoComplete="new-password"
            required
            rightElement={revealButton}
            error={errors.new_password?.message}
            {...form.register("new_password")}
          />
          <Input
            label="Yangi parolni tasdiqlang"
            type={reveal ? "text" : "password"}
            autoComplete="new-password"
            required
            error={errors.confirm_password?.message}
            {...form.register("confirm_password")}
          />
        </div>
        <CardFooter>
          <Button type="submit" variant="secondary" loading={change.isPending} leftIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}>
            Parolni yangilash
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
