"use client";

import type { Product } from "./product.types";

type Props = {
  product: Product;
};

export default function ProductBadges({
  product,
}: Props) {
  const badges: {
    label: string;
    type: "new" | "best" | "featured";
  }[] = [];

  if (product.new_arrival) {
    badges.push({
      label: "New Arrival",
      type: "new",
    });
  }

  if (product.best_seller) {
    badges.push({
      label: "Best Seller",
      type: "best",
    });
  }

  if (product.featured) {
    badges.push({
      label: "Featured",
      type: "featured",
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const className =
          badge.type === "new"
            ? "bg-blue-50 text-blue-700"
            : badge.type === "best"
              ? "bg-amber-50 text-amber-700"
              : "bg-purple-50 text-purple-700";

        return (
          <span
            key={badge.type}
            className={`
              rounded-full
              px-3
              py-1
              text-[11px]
              font-semibold
              ${className}
            `}
          >
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}