import { Lock, VideoOff } from "lucide-react";
import { type ReactNode } from "react";
import { cn, toYouTubeEmbed } from "@/lib/utils";

export interface VideoPlayerProps {
  /** Absolute mp4/webm/mov URL or a YouTube link. `null` renders the locked/empty placeholder. */
  src: string | null | undefined;
  title?: string;
  poster?: string | null;
  /** Shown inside the placeholder when `src` is null (e.g. a "Sotib olish" button) */
  lockedContent?: ReactNode;
  /** Whether the empty state means "locked" (lock icon) or "no video yet" */
  locked?: boolean;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
}

/** Responsive 16:9 player: HTML5 <video> for files, iframe for YouTube. */
export function VideoPlayer({ src, title, poster, lockedContent, locked, autoPlay, onEnded, className }: VideoPlayerProps) {
  const embed = toYouTubeEmbed(src);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg", className)}>
      {!src ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-center text-slate-300">
          {locked ? <Lock className="h-10 w-10 text-slate-400" aria-hidden="true" /> : <VideoOff className="h-10 w-10 text-slate-400" aria-hidden="true" />}
          <p className="text-sm font-medium">{locked ? "Bu dars yopiq" : "Video hali yuklanmagan"}</p>
          {lockedContent}
        </div>
      ) : embed ? (
        <iframe
          src={`${embed}${autoPlay ? "&autoplay=1" : ""}`}
          title={title ?? "Video"}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video
          key={src}
          src={src}
          poster={poster ?? undefined}
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          onEnded={onEnded}
          className="absolute inset-0 h-full w-full"
          aria-label={title}
        >
          Brauzeringiz video formatini qo'llab-quvvatlamaydi.
        </video>
      )}
    </div>
  );
}
