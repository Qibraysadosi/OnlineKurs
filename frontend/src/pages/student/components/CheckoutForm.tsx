import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, FlaskConical, Lock, Wand2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { checkoutSchema, formatCardNumber, formatExpiry, cardDigits, type CheckoutFormValues } from "./schemas";

export interface CheckoutFormProps {
  amount: number;
  submitting: boolean;
  onSubmit: (values: CheckoutFormValues) => void;
}

const TEST_CARD: CheckoutFormValues = { card_number: "8600 1234 5678 9012", expiry: "12/30", cvc: "123", holder: "TEST FOYDALANUVCHI" };

/** Mock card form: validated client-side only, nothing is sent to a gateway. */
export function CheckoutForm({ amount, submitting, onSubmit }: CheckoutFormProps) {
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { card_number: "", expiry: "", cvc: "", holder: "" },
  });
  const { errors, isSubmitted } = form.formState;
  const cardField = form.register("card_number");
  const expiryField = form.register("expiry");
  const cvcField = form.register("cvc");

  const setFormatted = (name: keyof CheckoutFormValues, value: string) =>
    form.setValue(name, value, { shouldValidate: isSubmitted, shouldDirty: true });

  const fillTestCard = () => {
    form.reset(TEST_CARD);
    form.clearErrors();
  };

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <CreditCard className="h-5 w-5 text-primary-500" aria-hidden="true" />
              Karta ma'lumotlari
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Ma'lumotlar faqat brauzeringizda tekshiriladi.</p>
          </div>
          <Badge tone="warning" size="md" icon={<FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />}>
            Test to'lov
          </Badge>
        </div>

        <Alert tone="warning" title="Bu haqiqiy to'lov emas">
          <p>Istalgan 16 xonali raqam, kelajakdagi muddat va 3 xonali CVC qabul qilinadi. Pul yechilmaydi.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fillTestCard}
            leftIcon={<Wand2 className="h-4 w-4" aria-hidden="true" />}
            className="mt-3 border-amber-300 bg-white/70 text-amber-900 hover:bg-white dark:border-amber-800 dark:bg-slate-900/40 dark:text-amber-100 dark:hover:bg-slate-900/70"
          >
            Test kartani to'ldirish
          </Button>
        </Alert>

        <Input
          label="Karta raqami"
          required
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="8600 0000 0000 0000"
          maxLength={19}
          leftIcon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
          error={errors.card_number?.message}
          {...cardField}
          onChange={(e) => setFormatted("card_number", formatCardNumber(e.target.value))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amal qilish muddati"
            required
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="OO/YY"
            maxLength={5}
            error={errors.expiry?.message}
            {...expiryField}
            onChange={(e) => setFormatted("expiry", formatExpiry(e.target.value))}
          />
          <Input
            label="CVC"
            required
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="•••"
            maxLength={4}
            leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
            error={errors.cvc?.message}
            {...cvcField}
            onChange={(e) => setFormatted("cvc", cardDigits(e.target.value).slice(0, 4))}
          />
        </div>
        <Input
          label="Karta egasi"
          required
          autoComplete="cc-name"
          placeholder="ISM FAMILIYA"
          className="uppercase"
          error={errors.holder?.message}
          {...form.register("holder")}
        />

        <Button type="submit" variant="gradient" size="lg" fullWidth loading={submitting} leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}>
          {formatPrice(amount)} to'lash
        </Button>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Tugmani bosish orqali siz bu test to'lov ekanini va haqiqiy pul o'tkazilmasligini tasdiqlaysiz.
        </p>
      </form>
    </Card>
  );
}
