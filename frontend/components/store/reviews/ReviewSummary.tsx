"use client";

import ReviewStars from "./ReviewStars";

type ReviewSummaryProps = {
  rating: number;
  reviewCount: number;
};

export default function ReviewSummary({
  rating,
  reviewCount,
}: ReviewSummaryProps) {
  return (
    <div className="rounded-3xl bg-[#f6efe4] p-7">

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8f0828]">
        Customer love
      </p>

      <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl text-[#191919]">
        Reviews
      </h2>

      <div className="mt-6 flex items-end gap-3">

        <span className="font-[family-name:var(--font-playfair)] text-5xl text-[#191919]">
          {rating.toFixed(1)}
        </span>

        <div className="pb-1">

          <ReviewStars
            rating={Math.round(rating)}
            size="sm"
          />

          <p className="mt-1 text-xs text-[#777]">
            {reviewCount} verified review
            {reviewCount === 1 ? "" : "s"}
          </p>

        </div>

      </div>

      <p className="mt-5 text-sm leading-6 text-[#6d675e]">
        Real feedback from customers who have received
        their BanglesMart order.
      </p>

    </div>
  );
}