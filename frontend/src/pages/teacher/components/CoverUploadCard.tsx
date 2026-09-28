import { useMutation } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { coursesApi, getErrorMessage } from "@/api";
import { CourseCover } from "@/components/course";
import { Card, CardHeader, FileDropzone } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import type { CourseDetail } from "@/types";

const COVER_MAX_BYTES = 5 * 1024 * 1024;

interface CoverUploadCardProps {
  course: CourseDetail;
  onUploaded: (course: CourseDetail) => void;
}

/** Cover image preview + upload with progress (edit mode side column). */
export function CoverUploadCard({ course, onUploaded }: CoverUploadCardProps) {
  const toast = useToast();
  const [progress, setProgress] = useState<number>();

  const upload = useMutation({
    mutationFn: (file: File) => coursesApi.uploadCover(course.id, file, setProgress),
    onSuccess: (updated) => {
      toast.success("Muqova rasmi yangilandi");
      onUploaded(updated);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setProgress(undefined),
  });

  return (
    <Card>
      <CardHeader title="Muqova rasmi" description="16:9 nisbatdagi rasm eng yaxshi ko'rinadi." />
      <CourseCover course={course} className="rounded-xl" />
      <FileDropzone
        className="mt-4"
        accept="image/png,image/jpeg,image/webp,image/gif"
        maxSize={COVER_MAX_BYTES}
        progress={progress}
        onFile={(file) => upload.mutate(file)}
        label={course.cover_url ? "Rasmni almashtirish" : "Rasm yuklash"}
        hint="PNG, JPG, WEBP yoki GIF · maks. 5 MB"
        icon={<ImagePlus className="h-6 w-6" aria-hidden="true" />}
      />
    </Card>
  );
}
