"use client";

import ReviewSummary from "./ReviewSummary";
import ReviewList, {
  ProductReview,
} from "./ReviewList";

import ReviewForm, {
  MyReview,
} from "./ReviewForm";

type ProductReviewsProps = {
  reviews: ProductReview[];

  myReview: MyReview | null;

  reviewRating: number;
  reviewTitle: string;
  reviewComment: string;

  reviewSubmitting: boolean;
  reviewMessage: string;

  onRatingChange: (rating: number) => void;
  onTitleChange: (title: string) => void;
  onCommentChange: (comment: string) => void;

  onSubmit: () => void;
};

export default function ProductReviews({
  reviews,
  myReview,

  reviewRating,
  reviewTitle,
  reviewComment,

  reviewSubmitting,
  reviewMessage,

  onRatingChange,
  onTitleChange,
  onCommentChange,

  onSubmit,
}: ProductReviewsProps) {

  /*
   * IMPORTANT:
   *
   * Only approved reviews contribute to the public
   * rating and review count.
   */
  const approvedReviews = reviews.filter(
    (review) => review.status === "approved"
  );

  const reviewCount = approvedReviews.length;

  const averageRating =
    reviewCount > 0
      ? approvedReviews.reduce(
          (total, review) =>
            total + Number(review.rating || 0),
          0
        ) / reviewCount
      : 0;

  return (
    <section className="mx-auto mt-12 max-w-7xl border-t border-[#e9e2d8] px-1 pt-10">

      <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)]">

        {/* -------------------------------------------------------------- */}
        {/* Summary                                                        */}
        {/* -------------------------------------------------------------- */}

        <ReviewSummary
          rating={averageRating}
          reviewCount={reviewCount}
        />


        {/* -------------------------------------------------------------- */}
        {/* Reviews                                                        */}
        {/* -------------------------------------------------------------- */}

        <div>

          <ReviewList
            reviews={reviews}
          />

          <ReviewForm
            rating={reviewRating}
            title={reviewTitle}
            comment={reviewComment}

            submitting={reviewSubmitting}

            message={reviewMessage}

            myReview={myReview}

            onRatingChange={onRatingChange}
            onTitleChange={onTitleChange}
            onCommentChange={onCommentChange}

            onSubmit={onSubmit}
          />

        </div>

      </div>

    </section>
  );
}