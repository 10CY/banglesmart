"use client";

import ReviewStars from "./ReviewStars";

export type MyReview = {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  status: string;
  created_at: string;
};

type ReviewFormProps = {
  rating: number;
  title: string;
  comment: string;

  submitting: boolean;

  message: string;

  myReview: MyReview | null;

  onRatingChange: (rating: number) => void;
  onTitleChange: (title: string) => void;
  onCommentChange: (comment: string) => void;

  onSubmit: () => void;
};

export default function ReviewForm({
  rating,
  title,
  comment,
  submitting,
  message,
  myReview,
  onRatingChange,
  onTitleChange,
  onCommentChange,
  onSubmit,
}: ReviewFormProps) {

  const status = myReview?.status;

  function statusLabel() {
    if (status === "approved") {
      return "Published";
    }

    if (status === "rejected") {
      return "Rejected";
    }

    return "Pending approval";
  }

  function statusClass() {
    if (status === "approved") {
      return "bg-green-50 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-50 text-red-700";
    }

    return "bg-[#f8f1e5] text-[#8f0828]";
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#e7dfd4] bg-white p-6">

      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>

          <h3 className="text-sm font-semibold text-[#191919]">
            Write a review
          </h3>

          <p className="mt-1 text-xs text-[#888]">
            Only delivered purchases can submit reviews.
          </p>

        </div>

        {myReview && (
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusClass()}`}
          >
            {statusLabel()}
          </span>
        )}

      </div>


      {/* Rating */}

      <div className="mt-5">

        <ReviewStars
          rating={rating}
          size="lg"
          interactive
          onChange={onRatingChange}
        />

      </div>


      {/* Fields */}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">

        <input
          value={title}
          onChange={(event) =>
            onTitleChange(event.target.value)
          }
          maxLength={150}
          placeholder="Review title"
          className="rounded-xl border border-[#ddd4c7] px-4 py-3 text-sm outline-none transition focus:border-[#c9a227]"
        />

        <textarea
          value={comment}
          onChange={(event) =>
            onCommentChange(event.target.value)
          }
          maxLength={2000}
          rows={4}
          placeholder="Tell us about the product..."
          className="sm:col-span-2 rounded-xl border border-[#ddd4c7] px-4 py-3 text-sm outline-none transition focus:border-[#c9a227]"
        />

      </div>


      {/* Message */}

      {message && (
        <p className="mt-3 rounded-xl bg-[#f8f1e5] px-4 py-3 text-xs leading-5 text-[#6d675e]">
          {message}
        </p>
      )}


      {/* Submit */}

      <button
        type="button"
        disabled={submitting}
        onClick={onSubmit}
        className="mt-4 rounded-full bg-[#111827] px-6 py-3 text-xs font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Submitting..."
          : myReview
            ? "Update Review"
            : "Submit Review"}
      </button>

    </div>
  );
}