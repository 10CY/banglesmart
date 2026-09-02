"use client";

import {
  useState,
} from "react";

import {
  ChevronDown,
  Package,
  Sparkles,
  Info,
} from "lucide-react";

import type {
  Product,
} from "./product.types";


type Props = {
  product: Product;
};


export default function ProductDescription({
  product,
}: Props) {

  const [open, setOpen] =
    useState(true);


  const pieces =
    Number(
      product.set_quantity || 1
    );


  return (
    <section
      className="
        mt-8
        overflow-hidden
        rounded-3xl
        border
        border-[#e8dfd2]
        bg-white
        shadow-[0_8px_30px_rgba(0,0,0,0.03)]
      "
    >

      {/* ================================================================
          HEADER
      ================================================================ */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (value) => !value
          )
        }
        aria-expanded={open}
        className="
          group
          flex
          w-full
          items-center
          justify-between
          gap-5
          px-5
          py-5
          text-left
          transition
          hover:bg-[#fcfaf7]
          sm:px-7
          sm:py-6
        "
      >

        <div
          className="
            flex
            min-w-0
            items-center
            gap-4
          "
        >

          {/* ICON */}

          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#f8f1e5]
              text-[#c9a227]
            "
          >
            <Sparkles
              size={19}
            />
          </div>


          {/* TITLE */}

          <div>

            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-[#c9a227]
              "
            >
              Product information
            </p>


            <h2
              className="
                mt-1
                font-[family-name:var(--font-playfair)]
                text-xl
                text-gray-900
                sm:text-2xl
              "
            >
              Product Details
            </h2>


            <p
              className="
                mt-1
                text-xs
                text-gray-500
                sm:text-sm
              "
            >
              Everything you need to know
              about this piece.
            </p>

          </div>

        </div>


        {/* CHEVRON */}

        <span
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            border-gray-200
            bg-white
            text-gray-500
            transition
            group-hover:border-gray-300
          "
        >

          <ChevronDown
            size={18}
            className={`
              transition-transform
              duration-300
              ${
                open
                  ? "rotate-180"
                  : "rotate-0"
              }
            `}
          />

        </span>

      </button>


      {/* ================================================================
          CONTENT
      ================================================================ */}

      <div
        className={`
          grid
          transition-[grid-template-rows]
          duration-300
          ease-in-out
          ${
            open
              ? "grid-rows-[1fr]"
              : "grid-rows-[0fr]"
          }
        `}
      >

        <div className="min-h-0 overflow-hidden">

          <div
            className="
              border-t
              border-[#eee7dd]
              px-5
              pb-7
              pt-6
              sm:px-7
              sm:pb-8
            "
          >

            {/* ==========================================================
                QUICK DETAILS
            ========================================================== */}

            <div
              className="
                grid
                gap-3
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >

              {/* SET QUANTITY */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-[#eee7dd]
                  bg-[#fcfaf7]
                  p-4
                "
              >

                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white
                    text-[#8f0828]
                    shadow-sm
                  "
                >

                  <Package
                    size={18}
                  />

                </div>


                <div>

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-gray-400
                    "
                  >
                    Set quantity
                  </p>


                  <p
                    className="
                      mt-1
                      text-sm
                      font-semibold
                      text-gray-900
                    "
                  >
                    {pieces}{" "}
                    {pieces === 1
                      ? "Piece"
                      : "Pieces"}
                  </p>

                </div>

              </div>


              {/* CATEGORY */}

              {product.category && (

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-[#eee7dd]
                    bg-[#fcfaf7]
                    p-4
                  "
                >

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-white
                      text-[#c9a227]
                      shadow-sm
                    "
                  >

                    <Sparkles
                      size={18}
                    />

                  </div>


                  <div>

                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.12em]
                        text-gray-400
                      "
                    >
                      Category
                    </p>


                    <p
                      className="
                        mt-1
                        text-sm
                        font-semibold
                        text-gray-900
                      "
                    >
                      {
                        product.category
                          .name
                      }
                    </p>

                  </div>

                </div>

              )}


              {/* PRODUCT TYPE */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-[#eee7dd]
                  bg-[#fcfaf7]
                  p-4
                "
              >

                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white
                    text-[#8f0828]
                    shadow-sm
                  "
                >

                  <Info
                    size={18}
                  />

                </div>


                <div>

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-gray-400
                    "
                  >
                    Collection
                  </p>


                  <p
                    className="
                      mt-1
                      truncate
                      text-sm
                      font-semibold
                      text-gray-900
                    "
                  >
                    {product.name}
                  </p>

                </div>

              </div>

            </div>


            {/* ==========================================================
                DESCRIPTION
            ========================================================== */}

            <div className="mt-7">

              <div
                className="
                  mb-3
                  flex
                  items-center
                  gap-3
                "
              >

                <span
                  className="
                    h-px
                    w-8
                    bg-[#c9a227]
                  "
                />

                <h3
                  className="
                    text-sm
                    font-semibold
                    text-gray-900
                  "
                >
                  About this piece
                </h3>

              </div>


              {product.description ? (

                <div
                  className="
                    rounded-2xl
                    bg-[#fcfaf7]
                    px-5
                    py-5
                    sm:px-6
                  "
                >

                  <p
                    className="
                      whitespace-pre-line
                      text-sm
                      leading-7
                      text-gray-600
                    "
                  >
                    {
                      product.description
                    }
                  </p>

                </div>

              ) : (

                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-gray-200
                    px-5
                    py-6
                    text-center
                  "
                >

                  <p
                    className="
                      text-sm
                      text-gray-500
                    "
                  >
                    Product details are
                    currently unavailable.
                  </p>

                </div>

              )}

            </div>


            {/* ==========================================================
                SHORT DESCRIPTION
            ========================================================== */}

            {product.short_description && (

              <div
                className="
                  mt-6
                  border-t
                  border-[#eee7dd]
                  pt-6
                "
              >

                <p
                  className="
                    text-sm
                    font-semibold
                    text-gray-900
                  "
                >
                  Product overview
                </p>


                <p
                  className="
                    mt-2
                    text-sm
                    leading-7
                    text-gray-600
                  "
                >
                  {
                    product.short_description
                  }
                </p>

              </div>

            )}

          </div>

        </div>

      </div>

    </section>
  );
}