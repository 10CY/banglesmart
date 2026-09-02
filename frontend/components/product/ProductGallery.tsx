"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ShoppingBag,
} from "lucide-react";

import { BACKEND_URL } from "@/lib/api";

import type { Product } from "./product.types";


type Props = {
  product: Product;
  selectedImage: number;
  onImageChange: (
    index: number
  ) => void;
};


export default function ProductGallery({
  product,
  selectedImage,
  onImageChange,
}: Props) {

  const [zoomed, setZoomed] =
    useState(false);


  const images =
    product.images || [];


  const current =
    images[selectedImage];


  function previous() {

    if (!images.length) {
      return;
    }

    onImageChange(
      selectedImage === 0
        ? images.length - 1
        : selectedImage - 1
    );
  }


  function next() {

    if (!images.length) {
      return;
    }

    onImageChange(
      selectedImage === images.length - 1
        ? 0
        : selectedImage + 1
    );
  }


  return (
    <>
      <div className="space-y-4">


        {/* MAIN IMAGE */}

        <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white">

          <div className="aspect-square">

            {current ? (

              <img
                src={`${BACKEND_URL}/storage/${current.image}`}
                alt={
                  current.alt_text ||
                  product.name
                }
                className="
                  h-full
                  w-full
                  object-cover
                  transition
                  duration-500
                  group-hover:scale-[1.02]
                "
              />

            ) : (

              <div className="flex h-full items-center justify-center">

                <ShoppingBag
                  size={60}
                  className="text-gray-200"
                />

              </div>

            )}

          </div>


          {/* ZOOM */}

          {current && (

            <button
              type="button"
              onClick={() =>
                setZoomed(true)
              }
              className="
                absolute
                bottom-4
                right-4
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-white/90
                text-gray-700
                shadow
                backdrop-blur
                transition
                hover:bg-white
              "
            >
              <ZoomIn size={18} />
            </button>

          )}


          {/* ARROWS */}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={previous}
                className="
                  absolute
                  left-4
                  top-1/2
                  flex
                  h-10
                  w-10
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-white/90
                  shadow
                  transition
                  hover:bg-white
                "
              >
                <ChevronLeft size={18} />
              </button>


              <button
                type="button"
                onClick={next}
                className="
                  absolute
                  right-4
                  top-1/2
                  flex
                  h-10
                  w-10
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-white/90
                  shadow
                  transition
                  hover:bg-white
                "
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

        </div>


        {/* THUMBNAILS */}

        {images.length > 1 && (

          <div className="grid grid-cols-5 gap-3">

            {images.map(
              (image, index) => (

                <button
                  key={image.id}
                  type="button"
                  onClick={() =>
                    onImageChange(index)
                  }
                  className={`
                    aspect-square
                    overflow-hidden
                    rounded-xl
                    border-2
                    bg-white
                    transition
                    ${
                      selectedImage === index
                        ? "border-gray-900"
                        : "border-transparent hover:border-gray-300"
                    }
                  `}
                >

                  <img
                    src={`${BACKEND_URL}/storage/${image.image}`}
                    alt={
                      image.alt_text ||
                      product.name
                    }
                    className="h-full w-full object-cover"
                  />

                </button>

              )
            )}

          </div>

        )}

      </div>


      {/* FULLSCREEN */}

      {zoomed && current && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/80
            p-4
          "
          onClick={() =>
            setZoomed(false)
          }
        >

          <img
            src={`${BACKEND_URL}/storage/${current.image}`}
            alt={product.name}
            className="
              max-h-[90vh]
              max-w-[90vw]
              object-contain
            "
          />

        </div>

      )}

    </>
  );
}