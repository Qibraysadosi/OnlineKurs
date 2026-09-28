import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { coursesApi, getErrorMessage, queryKeys } from "@/api";
import { ErrorFallback } from "@/components/guards/ErrorBoundary";
import { Avatar } from "@/components/ui/Avatar";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarRating } from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatNumber, formatRating } from "@/lib/utils";
import { ratingSchema } from "@/lib/validation";
import type { CourseDetail, Review } from "@/types";

const REVIEWS_PAGE_SIZE = 10;

const schema = z.object({
  rating: ratingSchema,
  comment: z.string().trim().max(2000, "Sharh juda uzun (maksimum 2000 belgi)"),
});

type FormValues = z.infer<typeof schema>;

export interface ReviewsSectionProps {
  course: CourseDetail;
}

function ReviewForm({ course, existing }: { course: CourseDetail; existing: Review | null }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rating: existing?.rating ?? 0, comment: existing?.comment ?? "" },
  });
  const { errors } = form.formState;

  useEffect(() => {
    form.reset({ rating: existing?.rating ?? 0, comment: existing?.comment ?? "" });
  }, [existing, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => coursesApi.review(course.id, { rating: values.rating, comment: values.comment || null }),
    onSuccess: () => {
      toast.success(existing ? "Sharhingiz yangilandi" : "Sharhingiz uchun rahmat!");
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(course.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.course(course.slug) });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Card className="border-primary-100 dark:border-primary-900/60">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{existing ? "Sharhingizni yangilang" : "Sharh qoldiring"}</h3>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Fikringiz boshqa talabalarga kurs tanlashda yordam beradi.</p>
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate className="mt-4 space-y-4">
        <div>
          <p className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bahoyingiz</p>
          <Controller
            control={form.control}
            name="rating"
            render={({ field }) => <StarRating value={field.value} onChange={field.onChange} size="lg" label="Kursga baho bering" />}
          />
          {errors.rating && (
            <p role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
              {errors.rating.message}
            </p>
          )}
        </div>
        <Textarea
          label="Sharh"
          rows={3}
          placeholder="Kurs sizga nimasi bilan yoqdi?"
          hint="Ixtiyoriy"
          error={errors.comment?.message}
          {...form.register("comment")}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={mutation.isPending} leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}>
            {existing ? "Yangilash" : "Yuborish"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ReviewItem({ review, isMine }: { review: Review; isMine: boolean }) {
  return (
    <li className="flex gap-3 py-5 first:pt-0 last:pb-0">
      <Avatar src={review.user.avatar_url} name={review.user.full_name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {review.user.full_name}
            {isMine && <span className="ml-1.5 text-xs font-medium text-primary-600 dark:text-primary-300">(siz)</span>}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(review.created_at)}</span>
        </div>
        <StarRating value={review.rating} className="mt-1" label={`${review.user.full_name} bahosi`} />
        {review.comment && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{review.comment}</p>}
      </div>
    </li>
  );
}

function ReviewsListSkeleton() {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800" aria-hidden="true">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i} className="flex gap-3 py-5 first:pt-0 last:pb-0">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReviewsSection({ course }: ReviewsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const params = { page, page_size: REVIEWS_PAGE_SIZE };
  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews(course.id, params),
    queryFn: () => coursesApi.reviews(course.id, params),
  });

  const isTeacher = user?.id === course.teacher.id;
  const canReview = isAuthenticated && course.has_access && !isTeacher;
  // From the course payload, not the current page of reviews: the user's review may be pages away.
  const myReview = course.my_review;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
          Sharhlar
        </h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">{formatRating(course.rating_avg)}</span>
          <StarRating value={course.rating_avg} size="md" label="O'rtacha baho" />
          <span>({formatNumber(course.reviews_count)})</span>
        </div>
      </div>

      {canReview && <ReviewForm course={course} existing={myReview} />}
      {!isAuthenticated && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sharh qoldirish uchun{" "}
          <Link to={`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`} className="ok-focus rounded font-medium text-primary-600 hover:text-primary-700 dark:text-primary-300">
            tizimga kiring
          </Link>
          .
        </p>
      )}
      {isAuthenticated && !course.has_access && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Sharh qoldirish uchun avval kursga yoziling.</p>
      )}

      <Card>
        {reviewsQuery.isPending ? (
          <ReviewsListSkeleton />
        ) : reviewsQuery.isError ? (
          <ErrorFallback className="py-6" message={getErrorMessage(reviewsQuery.error)} onRetry={() => reviewsQuery.refetch()} />
        ) : reviewsQuery.data.items.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<MessageSquare className="h-6 w-6" />}
            title="Hali sharhlar yo'q"
            description={canReview ? "Birinchi bo'lib fikr bildiring." : "Bu kurs haqida birinchi bo'lib fikr bildiring."}
            action={
              !isAuthenticated ? (
                <Link to={`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`} className={buttonClassName({ variant: "outline", size: "sm" })}>
                  Kirish
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {reviewsQuery.data.items.map((review) => (
                <ReviewItem key={review.id} review={review} isMine={review.user.id === user?.id} />
              ))}
            </ul>
            {reviewsQuery.data.pages > 1 && (
              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Pagination page={reviewsQuery.data.page} pages={reviewsQuery.data.pages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  );
}
