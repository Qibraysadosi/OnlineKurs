import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Mail } from "lucide-react";
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
import { emailSchema, zodMessages } from "@/lib/validation";
import { AuthLayout, AuthSwitchLink, PasswordInput, authPath, safeNextPath } from "./components/AuthLayout";

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, zodMessages.required),
});

type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { label: "Talaba", email: "talaba@onlinekurs.uz" },
  { label: "O'qituvchi", email: "ustoz@onlinekurs.uz" },
  { label: "Admin", email: "admin@onlinekurs.uz" },
] as const;

const DEMO_PASSWORD = "Parol123!";

export default function LoginPage() {
  useDocumentTitle("Kirish");
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      const user = await login(values);
      toast.success(`Xush kelibsiz, ${user.full_name}!`);
      navigate(safeNextPath(next), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const fillDemo = (email: string) => {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", DEMO_PASSWORD, { shouldValidate: true });
    setFormError(null);
  };

  return (
    <AuthLayout
      title="Xush kelibsiz"
      subtitle="Hisobingizga kirib, o'rganishni davom ettiring."
      footer={
        <>
          Hisobingiz yo'qmi? <AuthSwitchLink to={authPath("/register", next)}>Ro'yxatdan o'ting</AuthSwitchLink>
        </>
      }
      panelTitle={
        <>
          O'rganishni <span className="underline decoration-white/40 decoration-4 underline-offset-4">to'xtatmang</span>
        </>
      }
      panelPoints={[
        "Barcha kurslaringiz va progressingiz bir joyda",
        "Yakunlangan darslar avtomatik saqlanadi",
        "Yangi kurslar haqida birinchi bo'lib xabar oling",
      ]}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && (
          <Alert tone="danger" onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="siz@example.uz"
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          error={errors.email?.message}
          {...form.register("email")}
        />
        <PasswordInput
          label="Parol"
          autoComplete="current-password"
          placeholder="Parolingiz"
          error={errors.password?.message}
          {...form.register("password")}
        />
        <Button type="submit" variant="gradient" size="lg" fullWidth loading={isSubmitting} leftIcon={<LogIn className="h-4 w-4" aria-hidden="true" />}>
          Kirish
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Demo hisoblar (parol: {DEMO_PASSWORD})</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button key={account.email} type="button" variant="secondary" size="xs" onClick={() => fillDemo(account.email)}>
              {account.label}
            </Button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
