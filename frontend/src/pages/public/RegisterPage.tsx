import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, User, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { getErrorMessage } from "@/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/useToast";
import { emailSchema, fullNameSchema, passwordSchema, phoneSchema, zodMessages } from "@/lib/validation";
import { AuthLayout, AuthSwitchLink, PasswordInput, authPath, safeNextPath } from "./components/AuthLayout";

const schema = z
  .object({
    full_name: fullNameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    password_confirm: z.string().min(1, zodMessages.required),
  })
  .refine((values) => values.password === values.password_confirm, {
    path: ["password_confirm"],
    message: "Parollar mos kelmadi",
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  useDocumentTitle("Ro'yxatdan o'tish");
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", phone: "", password: "", password_confirm: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      const phone = values.phone?.trim();
      const user = await registerUser({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        ...(phone ? { phone } : {}),
      });
      toast.success(`Xush kelibsiz, ${user.full_name}!`, { description: "Hisobingiz muvaffaqiyatli yaratildi." });
      navigate(safeNextPath(next), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Hisob yarating"
      subtitle="Bir daqiqada ro'yxatdan o'ting va bepul kurslardan boshlang."
      footer={
        <>
          Hisobingiz bormi? <AuthSwitchLink to={authPath("/login", next)}>Kirish</AuthSwitchLink>
        </>
      }
      panelTitle={
        <>
          Bugun boshlang — <span className="underline decoration-white/40 decoration-4 underline-offset-4">ertaga</span> natija
        </>
      }
      panelPoints={[
        "Bepul kurslarga cheksiz kirish",
        "O'z tezligingizda, istalgan qurilmada o'rganing",
        "Progress va yakunlangan darslar avtomatik saqlanadi",
        "Tajribali o'qituvchilardan amaliy bilim",
      ]}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && (
          <Alert tone="danger" onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}
        <Input
          label="To'liq ism"
          autoComplete="name"
          placeholder="Aziz Toshmatov"
          leftIcon={<User className="h-4 w-4" aria-hidden="true" />}
          error={errors.full_name?.message}
          {...form.register("full_name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="siz@example.uz"
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          error={errors.email?.message}
          {...form.register("email")}
        />
        <Input
          label="Telefon"
          type="tel"
          autoComplete="tel"
          placeholder="+998 90 123 45 67"
          hint="Ixtiyoriy"
          leftIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
          error={errors.phone?.message}
          {...form.register("phone")}
        />
        <PasswordInput
          label="Parol"
          autoComplete="new-password"
          placeholder="Kamida 8 ta belgi"
          error={errors.password?.message}
          {...form.register("password")}
        />
        <PasswordInput
          label="Parolni tasdiqlang"
          autoComplete="new-password"
          placeholder="Parolni qayta kiriting"
          error={errors.password_confirm?.message}
          {...form.register("password_confirm")}
        />
        <Button type="submit" variant="gradient" size="lg" fullWidth loading={isSubmitting} leftIcon={<UserPlus className="h-4 w-4" aria-hidden="true" />}>
          Ro'yxatdan o'tish
        </Button>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Ro'yxatdan o'tish orqali siz platformadan foydalanish shartlariga rozilik bildirasiz.
        </p>
      </form>
    </AuthLayout>
  );
}
