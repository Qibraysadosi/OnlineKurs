import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { buttonClassName } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Sahifa topilmadi");
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center animate-in">
      <p className="ok-gradient-text text-7xl font-bold tracking-tight sm:text-8xl">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">Sahifa topilmadi</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400 sm:text-base">
        Siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko'chirilgan.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className={buttonClassName({ variant: "gradient", size: "lg" })}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Bosh sahifaga
        </Link>
        <Link to="/courses" className={buttonClassName({ variant: "outline", size: "lg" })}>
          <Compass className="h-4 w-4" aria-hidden="true" />
          Kurslarni ko'rish
        </Link>
      </div>
    </Container>
  );
}
