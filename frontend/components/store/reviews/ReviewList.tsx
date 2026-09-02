"use client";

import ReviewStars from "./ReviewStars";

export type ProductReview = {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  status: string;
  created_at: string;

  user?: {
    id: number;
    name: string;
  };
};

type ReviewListProps = {
  reviews: ProductReview[];
};

export default function ReviewList({
  reviews,
}: ReviewListProps) {

  /*
   * Only approved reviews should appear
   * publicly on the product page.
   */
  const approvedReviews = reviews.filter(
    (review) => review.status === "approved"
  );

  if (approvedReviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d9d0c2] bg-white p-8 text-center">

        <p className="font-[family-name:var(--font-playfair)] text-xl">
          Be the first to share your experience.
        </p>

        <p className="mt-2 text-sm text-[#777]">
          Reviews become available after a delivered purchase.
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-4">

      {approvedReviews.map((review) => (

        <article
          key={review.id}
          className="rounded-2xl border border-[#e7dfd4] bg-white p-6"
        >

          <div className="flex flex-wrap items-start justify-between gap-3">

            <div>

              <ReviewStars
                rating={Number(review.rating || 0)}
                size="sm"
              />

              <h3 className="mt-2 text-sm font-semibold text-[#191919]">
                {review.title || "Beautiful purchase"}
              </h3>

            </div>

            <div className="text-right">

              <p className="text-xs text-[#8a8379]">
                {review.user?.name || "Verified Customer"}
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-wider text-green-700">
                Verified Customer
              </p>

            </div>

          </div>

          {review.comment && (
            <p className="mt-4 text-sm leading-7 text-[#666]">
              {review.comment}
            </p>
          )}

        </article>

      ))}

    </div>
  );
}