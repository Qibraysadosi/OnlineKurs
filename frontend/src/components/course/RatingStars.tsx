import { StarRating, type StarRatingProps } from "@/components/ui/StarRating";

export type RatingStarsProps = StarRatingProps;

/** Alias of <StarRating> for course contexts: `<RatingStars value={c.rating_avg} showValue count={c.reviews_count} />` */
export function RatingStars(props: RatingStarsProps) {
  return <StarRating {...props} />;
}
