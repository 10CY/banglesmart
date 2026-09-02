"use client";

import Link from "next/link";

import {
  ArrowRight,
  Gem,
  Crown,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  Sparkles,
} from "lucide-react";

export default function HeroSection() {
  return (
    <>
      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden bg-[#210303]">
        {/* ================= BACKGROUND IMAGE ================= */}

        <div className="absolute inset-0">
          <img
            src="/hero-img.webp"
            alt="Luxury bridal bangles collection"
            className="
              h-full
              w-full
              object-cover
              object-[68%_center]
              sm:object-center
              lg:object-[65%_center]
            "
          />
        </div>

        {/* ================= DARK OVERLAY ================= */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-[#1d0204]
            via-[#2a0508]/95
            via-35%
            to-[#2a0508]/30
            to-75%
            lg:to-transparent
          "
        />

        {/* EXTRA LUXURY OVERLAY */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-t
            from-[#180203]/40
            via-transparent
            to-black/10
          "
        />

        {/* ================= CONTENT ================= */}

        <div
          className="
            relative
            z-10
            mx-auto
            flex
            min-h-[600px]
            max-w-[1600px]
            items-center
            px-6
            py-16
            sm:px-10
            lg:min-h-[640px]
            lg:px-16
            xl:px-20
          "
        >
          {/* ================= LEFT CONTENT ================= */}

          <div className="max-w-2xl">
            {/* COLLECTION LABEL */}

            <div
              className="
                flex
                items-center
                gap-3
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-[#d7b05a]
                sm:text-xs
              "
            >
              <span className="h-px w-8 bg-[#c99a35]" />

              <Sparkles size={14} />

              New Collection

              <span className="hidden h-px w-8 bg-[#c99a35] sm:block" />
            </div>

            {/* ================= HEADING ================= */}

            <h1
              className="
                mt-6
                font-[family-name:var(--font-playfair)]
                text-5xl
                font-medium
                leading-[0.98]
                tracking-tight
                text-white
                sm:text-6xl
                lg:text-7xl
                xl:text-[76px]
              "
            >
              Timeless Beauty,
            </h1>

            {/* SCRIPT STYLE TEXT */}

            <div
              className="
                mt-1
                font-serif
                text-4xl
                italic
                leading-tight
                text-[#d6a947]
                sm:text-5xl
                lg:text-6xl
                xl:text-7xl
              "
            >
              Made for You
              <span className="ml-3 text-[#d6a947]">♡</span>
            </div>

            {/* ================= DESCRIPTION ================= */}

            <p
              className="
                mt-7
                max-w-lg
                text-sm
                leading-7
                text-white/75
                sm:text-base
              "
            >
              Discover our handcrafted bangles, designed to
              celebrate every special moment of your life.
            </p>

            {/* ================= FEATURES ================= */}

            <div
              className="
                mt-8
                flex
                flex-wrap
                items-center
                gap-y-5
                text-[#d6b46b]
              "
            >
              {/* PREMIUM */}

              <div className="flex items-center gap-3 pr-6 sm:border-r sm:border-[#b99248]/40">
                <Gem
                  size={22}
                  strokeWidth={1.5}
                />

                <div>
                  <p
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-white/90
                    "
                  >
                    Premium
                  </p>

                  <p
                    className="
                      mt-1
                      text-[9px]
                      uppercase
                      tracking-wider
                      text-white/50
                    "
                  >
                    Quality
                  </p>
                </div>
              </div>

              {/* HANDCRAFTED */}

              <div className="flex items-center gap-3 px-0 sm:px-6 sm:border-r sm:border-[#b99248]/40">
                <Crown
                  size={22}
                  strokeWidth={1.5}
                />

                <div>
                  <p
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-white/90
                    "
                  >
                    Handcrafted
                  </p>

                  <p
                    className="
                      mt-1
                      text-[9px]
                      uppercase
                      tracking-wider
                      text-white/50
                    "
                  >
                    Designs
                  </p>
                </div>
              </div>

              {/* TRUST */}

              <div className="flex items-center gap-3 px-0 sm:pl-6">
                <ShieldCheck
                  size={22}
                  strokeWidth={1.5}
                />

                <div>
                  <p
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-white/90
                    "
                  >
                    Trusted By
                  </p>

                  <p
                    className="
                      mt-1
                      text-[9px]
                      uppercase
                      tracking-wider
                      text-white/50
                    "
                  >
                    Customers
                  </p>
                </div>
              </div>
            </div>

            {/* ================= BUTTONS ================= */}

            <div
              className="
                mt-9
                flex
                flex-wrap
                gap-4
              "
            >
              {/* SHOP NOW */}

              <Link
                href="/shop"
                className="
                  group
                  flex
                  items-center
                  justify-center
                  gap-3
                  rounded-md
                  bg-gradient-to-r
                  from-[#7f0714]
                  to-[#a80d20]
                  px-7
                  py-4
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-white
                  shadow-[0_10px_30px_rgba(0,0,0,.3)]
                  transition
                  duration-300
                  hover:from-[#9a0a19]
                  hover:to-[#bd1026]
                "
              >
                Shop Now

                <ArrowRight
                  size={16}
                  className="
                    transition-transform
                    duration-300
                    group-hover:translate-x-1
                  "
                />
              </Link>

              {/* EXPLORE */}

              <Link
                href="/shop"
                className="
                  flex
                  items-center
                  justify-center
                  rounded-md
                  border
                  border-[#b58a36]
                  px-7
                  py-4
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-[#e0bd69]
                  transition
                  duration-300
                  hover:bg-[#b58a36]
                  hover:text-[#240304]
                "
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </div>

        {/* ================= DECORATION ================= */}

        <div
          className="
            pointer-events-none
            absolute
            bottom-[-120px]
            left-[10%]
            h-[280px]
            w-[500px]
            rounded-full
            bg-[#b8862d]/10
            blur-3xl
          "
        />
      </section>

      {/* ================= TRUST / SERVICE BAR ================= */}

      <section
        className="
          border-t
          border-[#e8e1d8]
          bg-[#faf8f5]
        "
      >
        <div
          className="
            mx-auto
            grid
            max-w-[1600px]
            grid-cols-2
            divide-x-0
            divide-y
            divide-[#e4ddd4]
            lg:grid-cols-4
            lg:divide-x
            lg:divide-y-0
          "
        >
          {/* FREE SHIPPING */}

          <div
            className="
              flex
              items-center
              justify-center
              gap-4
              px-5
              py-6
              sm:px-8
            "
          >
            <Truck
              size={28}
              strokeWidth={1.3}
              className="text-[#5b3a2d]"
            />

            <div>
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-[#4a352c]
                "
              >
                Free Shipping
              </p>

              <p className="mt-1 text-[10px] text-[#777]">
                On orders above ₹999
              </p>
            </div>
          </div>

          {/* EASY RETURNS */}

          <div
            className="
              flex
              items-center
              justify-center
              gap-4
              px-5
              py-6
              sm:px-8
            "
          >
            <RefreshCw
              size={26}
              strokeWidth={1.3}
              className="text-[#5b3a2d]"
            />

            <div>
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-[#4a352c]
                "
              >
                Easy Returns
              </p>

              <p className="mt-1 text-[10px] text-[#777]">
                Within 7 days
              </p>
            </div>
          </div>

          {/* PREMIUM QUALITY */}

          <div
            className="
              flex
              items-center
              justify-center
              gap-4
              px-5
              py-6
              sm:px-8
            "
          >
            <ShieldCheck
              size={27}
              strokeWidth={1.3}
              className="text-[#5b3a2d]"
            />

            <div>
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-[#4a352c]
                "
              >
                Premium Quality
              </p>

              <p className="mt-1 text-[10px] text-[#777]">
                100% original products
              </p>
            </div>
          </div>

          {/* SUPPORT */}

          <div
            className="
              flex
              items-center
              justify-center
              gap-4
              px-5
              py-6
              sm:px-8
            "
          >
            <Headphones
              size={27}
              strokeWidth={1.3}
              className="text-[#5b3a2d]"
            />

            <div>
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-[#4a352c]
                "
              >
                24/7 Support
              </p>

              <p className="mt-1 text-[10px] text-[#777]">
                We're here to help
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}