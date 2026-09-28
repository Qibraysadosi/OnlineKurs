import { Clock } from "lucide-react";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDuration } from "@/lib/utils";
import type { LessonOut } from "@/types";

export interface LessonPreviewModalProps {
  lesson: LessonOut | null;
  onClose: () => void;
}

/** Plays a free-preview lesson inline for visitors who do not own the course. */
export function LessonPreviewModal({ lesson, onClose }: LessonPreviewModalProps) {
  return (
    <Modal open={Boolean(lesson)} onClose={onClose} size="xl" title={lesson?.title} description="Bepul ko'rish uchun ochiq dars">
      {lesson && (
        <div className="space-y-4">
          <VideoPlayer src={lesson.video_url} title={lesson.title} autoPlay />
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="primary">Bepul ko'rish</Badge>
            {lesson.duration_minutes > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDuration(lesson.duration_minutes)}
              </span>
            )}
          </div>
          {lesson.description && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">{lesson.description}</p>}
        </div>
      )}
    </Modal>
  );
}
