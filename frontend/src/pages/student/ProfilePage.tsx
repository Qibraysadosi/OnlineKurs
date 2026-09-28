import { PageHeader } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AvatarCard } from "./components/AvatarCard";
import { PasswordForm } from "./components/PasswordForm";
import { ProfileInfoForm } from "./components/ProfileInfoForm";

export default function ProfilePage() {
  useDocumentTitle("Profil");
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="animate-in">
      <PageHeader title="Profil" description="Shaxsiy ma'lumotlaringiz, rasm va parolni boshqaring." />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <AvatarCard user={user} />
        <div className="min-w-0 space-y-6">
          <ProfileInfoForm key={user.id} user={user} />
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
