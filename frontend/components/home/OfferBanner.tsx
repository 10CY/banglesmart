"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function OfferBanner() {
  return (
    <section className="px-6 py-16 lg:px-10">
      <div
        className="
          relative
          mx-auto
          max-w-7xl
          overflow-hidden
          rounded-3xl
          bg-[#1c1c1c]
        "
      >
        {/* BACKGROUND IMAGE */}

        <img
          src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=1600"
          alt="Bridal bangles and bangles set for women"
          loading="lazy"
          decoding="async"
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            opacity-30
          "
        />

        {/* OVERLAY */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-black
            via-black/70
            to-transparent
          "
        />

        {/* CONTENT */}

        <div
          className="
            relative
            z-10
            px-8
            py-16
            md:px-14
            md:py-20
          "
        >
          {/* LABEL */}

          <div
            className="
              flex
              items-center
              gap-2
              text-sm
              uppercase
              tracking-[0.3em]
              text-[#C9A227]
            "
          >
            <Sparkles size={16} />
            Bridal Collection
          </div>

          {/* HEADING */}

          <h2
            className="
              mt-5
              max-w-2xl
              text-3xl
              font-semibold
              leading-tight
              text-white
              md:text-5xl
            "
          >
            Bridal Bangles

            <span
              className="
                block
                text-[#C9A227]
              "
            >
              Made for Every Celebration
            </span>
          </h2>

          {/* DESCRIPTION */}

          <p
            className="
              mt-5
              max-w-xl
              leading-7
              text-gray-300
            "
          >
            Explore elegant bridal bangles and beautiful bangles set for women,
            designed to complete wedding, festive, and traditional looks.
          </p>

          {/* OFFER */}

          <div
            className="
              mt-8
              flex
              flex-wrap
              items-center
              gap-5
            "
          >
            <div>
              <p className="text-sm text-gray-400">
                Wedding Season Offer
              </p>

              <p
                className="
                  mt-1
                  text-3xl
                  font-semibold
                  text-white
                "
              >
                Flat 20% OFF
              </p>
            </div>

            {/* CTA */}

            <Link
              href="/shop/bridal-bangles"
              className="
                flex
                items-center
                gap-2
                rounded-full
                bg-[#C9A227]
                px-7
                py-3
                text-sm
                font-medium
                text-black
                transition
                duration-300
                hover:bg-[#e1bd42]
              "
            >
              Shop Bridal Bangles

              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}