import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, FileText, Link2, Paperclip, PlayCircle, Upload } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { getErrorMessage, lessonsApi } from "@/api";
import { Alert, Badge, Button, Checkbox, FileDropzone, Input, Modal, Tabs, Textarea } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { isYouTubeUrl } from "@/lib/utils";
import type { LessonOut } from "@/types";
import { EMPTY_LESSON_FORM, lessonFormSchema, lessonFormToPayload, lessonToFormValues, type LessonFormValues } from "./schemas";

const VIDEO_MAX_BYTES = 500 * 1024 * 1024;
const ATTACHMENT_MAX_BYTES = 50 * 1024 * 1024;
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";
const ATTACHMENT_ACCEPT = ".pdf,.zip,.docx,.pptx,.xlsx,.txt";

type VideoMode = "upload" | "link";

const VIDEO_TABS = [
  { value: "upload" as const, label: "Fayl yuklash", icon: <Upload className="h-4 w-4" aria-hidden="true" /> },
  { value: "link" as const, label: "Tashqi havola", icon: <Link2 className="h-4 w-4" aria-hidden="true" /> },
];

/** Uploaded videos live under the backend's /uploads/videos/ folder; anything else is an external link. */
const isUploadedVideo = (url: string | null) => Boolean(url && url.includes("/uploads/videos/"));

function videoSourceLabel(url: string): string {
  if (isUploadedVideo(url)) return "Yuklangan fayl";
  if (isYouTubeUrl(url)) return "YouTube";
  return "Tashqi havola";
}

export interface LessonModalProps {
  open: boolean;
  onClose: () => void;
  sectionId: number | null;
  /** Existing lesson (edit mode) or null (create mode) */
  lesson: LessonOut | null;
  onCreated: (lesson: LessonOut, sectionId: number) => void;
  onUpdated: (lesson: LessonOut, sectionId: number) => void;
}

function initialFormValues(lesson: LessonOut | null): LessonFormValues {
  if (!lesson) return EMPTY_LESSON_FORM;
  const values = lessonToFormValues(lesson);
  // Uploaded files are attached through the video endpoint, never round-tripped as a link.
  return isUploadedVideo(lesson.video_url) ? { ...values, video_url: "" } : values;
}

const initialVideoMode = (lesson: LessonOut | null): VideoMode =>
  !lesson || (lesson.video_url && !isUploadedVideo(lesson.video_url)) ? "link" : "upload";

/**
 * Create / edit a lesson, upload its video (with progress) or set an external URL, and attach a file.
 * The form is mounted only while the modal is open, so it always starts from the right default
 * values; resetting an already-interactive form in an effect used to drop the first keystrokes.
 */
export function LessonModal({ open, ...props }: LessonModalProps) {
  if (!open) return null;
  return <LessonModalContent {...props} />;
}

function LessonModalContent({ onClose, sectionId, lesson, onCreated, onUpdated }: Omit<LessonModalProps, "open">) {
  const toast = useToast();
  const formId = useId();
  const [videoMode, setVideoMode] = useState<VideoMode>(() => initialVideoMode(lesson));
  const [videoProgress, setVideoProgress] = useState<number>();
  const [attachmentProgress, setAttachmentProgress] = useState<number>();
  const [justCreated, setJustCreated] = useState(false);

  // `lesson` may change while open (create -> edit, refresh after an upload); the typed values
  // are kept, only the read-only bits (current video / attachment) follow the prop.
  const form = useForm<LessonFormValues>({ resolver: zodResolver(lessonFormSchema), defaultValues: initialFormValues(lesson) });
  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  const save = useMutation({
    mutationFn: (values: LessonFormValues) => {
      const payload = lessonFormToPayload(values, videoMode === "link");
      if (lesson) return lessonsApi.update(lesson.id, payload);
      if (sectionId === null) throw new Error("Bo'lim tanlanmagan");
      return lessonsApi.create(sectionId, payload);
    },
    onSuccess: (saved) => {
      if (sectionId === null) return;
      if (lesson) {
        toast.success("Dars saqlandi");
        onUpdated(saved, sectionId);
        onClose();
      } else {
        toast.success("Dars yaratildi", { description: "Endi video va qo'shimcha fayl yuklashingiz mumkin." });
        setJustCreated(true);
        onCreated(saved, sectionId);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const uploadVideo = useMutation({
    mutationFn: (file: File) => lessonsApi.uploadVideo(lesson!.id, file, setVideoProgress),
    onSuccess: (saved) => {
      toast.success("Video yuklandi");
      if (sectionId !== null) onUpdated(saved, sectionId);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setVideoProgress(undefined),
  });

  const uploadAttachment = useMutation({
    mutationFn: (file: File) => lessonsApi.uploadAttachment(lesson!.id, file, setAttachmentProgress),
    onSuccess: (saved) => {
      toast.success("Fayl biriktirildi");
      if (sectionId !== null) onUpdated(saved, sectionId);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setAttachmentProgress(undefined),
  });

  const busy = save.isPending || uploadVideo.isPending || uploadAttachment.isPending;
  const submit = handleSubmit((values) => save.mutate(values));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      closeOnOverlay={!busy}
      title={lesson ? "Darsni tahrirlash" : "Yangi dars"}
      description={lesson ? `${lesson.position}-dars` : "Dars nomi va tavsifini kiriting, keyin video qo'shing."}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {lesson ? "Yopish" : "Bekor qilish"}
          </Button>
          <Button type="submit" form={formId} variant="gradient" loading={save.isPending} disabled={uploadVideo.isPending || uploadAttachment.isPending}>
            {lesson ? "Saqlash" : "Darsni yaratish"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-5">
        {justCreated && (
          <Alert tone="success" title="Dars yaratildi">
            Quyida video faylini yuklashingiz yoki tashqi havola kiritishingiz mumkin.
          </Alert>
        )}

        <Input label="Dars nomi" required placeholder="Masalan: Kirish va o'rnatish" error={errors.title?.message} {...register("title")} />
        <Textarea label="Tavsif" rows={3} placeholder="Darsda nimalar ko'rib chiqiladi (ixtiyoriy)" error={errors.description?.message} {...register("description")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Davomiyligi (daqiqa)"
            type="number"
            min={0}
            max={10000}
            inputMode="numeric"
            error={errors.duration_minutes?.message}
            {...register("duration_minutes")}
          />
          <div className="sm:pt-7">
            <Checkbox
              label="Bepul ko'rish"
              description="Kursni sotib olmagan talabalar ham ko'ra oladi"
              {...register("is_free_preview")}
            />
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Video</h3>
            <Tabs tabs={VIDEO_TABS} value={videoMode} onChange={setVideoMode} variant="pills" label="Video manbasi" />
          </div>

          {lesson?.video_url && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
              <PlayCircle className="h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                  Video mavjud
                  <Badge tone="primary">{videoSourceLabel(lesson.video_url)}</Badge>
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{lesson.video_url}</p>
              </div>
              <a
                href={lesson.video_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Videoni yangi oynada ochish"
                className="ok-focus shrink-0 rounded-md p-1 text-slate-400 transition hover:text-primary-600"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          )}

          {videoMode === "upload" ? (
            lesson ? (
              <FileDropzone
                accept={VIDEO_ACCEPT}
                maxSize={VIDEO_MAX_BYTES}
                progress={videoProgress}
                disabled={busy && !uploadVideo.isPending}
                onFile={(file) => uploadVideo.mutate(file)}
                label={lesson.video_url ? "Yangi video yuklash" : "Video faylini tanlang yoki shu yerga tashlang"}
                hint="MP4, WEBM yoki MOV · maks. 500 MB"
                icon={<Upload className="h-6 w-6" aria-hidden="true" />}
              />
            ) : (
              <Alert tone="info">Video faylini yuklash uchun avval darsni yarating. Hozircha tashqi havola kiritishingiz mumkin.</Alert>
            )
          ) : (
            <Input
              label="Video havolasi"
              type="url"
              placeholder="https://www.youtube.com/watch?v=… yoki .mp4 havola"
              hint="YouTube yoki to'g'ridan-to'g'ri mp4/webm havola. Saqlaganda yuklangan video o'rniga qo'llanadi."
              leftIcon={<Link2 className="h-4 w-4" aria-hidden="true" />}
              error={errors.video_url?.message}
              {...register("video_url")}
            />
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Qo'shimcha fayl</h3>
          {lesson ? (
            <>
              {lesson.attachment_url && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                  <FileText className="h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">
                    {lesson.attachment_name ?? "Biriktirilgan fayl"}
                  </span>
                  <a
                    href={lesson.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Faylni yangi oynada ochish"
                    className="ok-focus shrink-0 rounded-md p-1 text-slate-400 transition hover:text-primary-600"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              )}
              <FileDropzone
                accept={ATTACHMENT_ACCEPT}
                maxSize={ATTACHMENT_MAX_BYTES}
                progress={attachmentProgress}
                disabled={busy && !uploadAttachment.isPending}
                onFile={(file) => uploadAttachment.mutate(file)}
                label={lesson.attachment_url ? "Faylni almashtirish" : "Fayl biriktirish"}
                hint="PDF, ZIP, DOCX, PPTX, XLSX yoki TXT · maks. 50 MB"
                icon={<Paperclip className="h-6 w-6" aria-hidden="true" />}
              />
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">Dars yaratilgandan so'ng PDF, ZIP va boshqa fayllarni biriktirish mumkin.</p>
          )}
        </section>
      </form>
    </Modal>
  );
}
