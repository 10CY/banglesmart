"use client";

type ReviewStarsProps = {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
};

export default function ReviewStars({
  rating,
  size = "md",
  interactive = false,
  onChange,
}: ReviewStarsProps) {
  const sizeClass =
    size === "sm"
      ? "text-sm"
      : size === "lg"
        ? "text-2xl"
        : "text-base";

  return (
    <div
      className={`flex items-center gap-0.5 ${sizeClass}`}
      aria-label={`Rating ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= rating;

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              className={`leading-none transition ${
                active
                  ? "text-[#c9a227]"
                  : "text-[#d8d2c8]"
              } hover:scale-110`}
            >
              ★
            </button>
          );
        }

        return (
          <span
            key={star}
            className={
              active
                ? "text-[#c9a227]"
                : "text-[#d8d2c8]"
            }
          >
            ★
          </span>
        );
      })}
    </div>
  );
}