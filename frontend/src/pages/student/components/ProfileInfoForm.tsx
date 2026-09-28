import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { authApi, getErrorMessage } from "@/api";
import { Button, Card, CardFooter, CardHeader, Input, Textarea } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type { UpdateMePayload, UserPublic } from "@/types";
import { profileSchema, type ProfileFormValues } from "./schemas";

function toDefaults(user: UserPublic): ProfileFormValues {
  return { full_name: user.full_name, phone: user.phone ?? "", bio: user.bio ?? "" };
}

/** Name / phone / bio editor; email is shown read-only. */
export function ProfileInfoForm({ user }: { user: UserPublic }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: toDefaults(user) });
  const { errors, isDirty } = form.formState;

  const update = useMutation({
    mutationFn: (payload: UpdateMePayload) => authApi.updateMe(payload),
    onSuccess: (updated) => {
      setUser(updated);
      form.reset(toDefaults(updated));
      toast.success("Profil ma'lumotlari saqlandi");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const onSubmit = form.handleSubmit((values) =>
    update.mutate({
      full_name: values.full_name.trim(),
      phone: values.phone?.trim() || null,
      bio: values.bio?.trim() || null,
    }),
  );

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader title="Shaxsiy ma'lumotlar" description="Ismingiz va aloqa ma'lumotlaringiz sharhlarda va sertifikatlarda ko'rinadi." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="To'liq ism" required autoComplete="name" error={errors.full_name?.message} {...form.register("full_name")} />
          <Input
            label="Telefon"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+998 90 123 45 67"
            error={errors.phone?.message}
            {...form.register("phone")}
          />
          <Input label="Email" type="email" value={user.email} disabled readOnly hint="Email manzilni o'zgartirib bo'lmaydi" containerClassName="sm:col-span-2" />
          <Textarea
            label="O'zingiz haqingizda"
            rows={4}
            placeholder="Qisqacha: kimsiz, nimalarni o'rganmoqchisiz..."
            hint="500 ta belgigacha"
            error={errors.bio?.message}
            containerClassName="sm:col-span-2"
            {...form.register("bio")}
          />
        </div>
        <CardFooter>
          <Button type="button" variant="ghost" disabled={!isDirty || update.isPending} onClick={() => form.reset(toDefaults(user))}>
            Bekor qilish
          </Button>
          <Button type="submit" loading={update.isPending} disabled={!isDirty} leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}>
            Saqlash
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
