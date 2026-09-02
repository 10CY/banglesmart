"use client";

import {
  Star,
} from "lucide-react";



const testimonials = [

  {
    name: "Priya Sharma",
    location: "Mumbai",
    review:
      "The bangles were absolutely beautiful. The finishing and packaging felt premium.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
  },


  {
    name: "Neha Patel",
    location: "Ahmedabad",
    review:
      "Loved the bridal collection. The design looked exactly like the pictures.",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400",
  },


  {
    name: "Anjali Verma",
    location: "Delhi",
    review:
      "Amazing quality and quick delivery. Will definitely shop again.",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400",
  },


];





export default function Testimonials(){


  return (

    <section className="
      px-6
      py-16
      lg:px-10
    ">


      <div className="
        mx-auto
        max-w-7xl
      ">


        {/* Heading */}


        <div className="
          text-center
        ">


          <p className="
            text-sm
            uppercase
            tracking-[0.25em]
            text-[#C9A227]
          ">

            Customer Love

          </p>




          <h2 className="
            mt-3
            text-3xl
            font-semibold
            text-gray-900
            md:text-4xl
          ">

            What Our Customers Say

          </h2>




          <p className="
            mt-3
            text-gray-500
          ">

            Thousands of happy customers trust BanglesMart.

          </p>


        </div>









        {/* Cards */}


        <div className="
          mt-10
          grid
          grid-cols-1
          gap-6
          md:grid-cols-3
        ">



          {
            testimonials.map((item)=>(


              <div

                key={item.name}

                className="
                  rounded-2xl
                  border
                  bg-white
                  p-6
                  shadow-sm
                  transition
                  hover:shadow-lg
                "

              >




                {/* Rating */}


                <div className="
                  flex
                  gap-1
                ">


                  {
                    Array.from({
                      length:5
                    }).map((_,index)=>(

                      <Star

                        key={index}

                        size={17}

                        fill="#C9A227"

                        className="
                          text-[#C9A227]
                        "

                      />

                    ))
                  }


                </div>







                <p className="
                  mt-5
                  text-sm
                  leading-7
                  text-gray-600
                ">

                  "{item.review}"

                </p>








                <div className="
                  mt-6
                  flex
                  items-center
                  gap-4
                ">



                  <img

                    src={item.image}

                    alt={item.name}

                    className="
                      h-12
                      w-12
                      rounded-full
                      object-cover
                    "

                  />




                  <div>


                    <h3 className="
                      text-sm
                      font-semibold
                      text-gray-900
                    ">

                      {item.name}

                    </h3>



                    <p className="
                      text-xs
                      text-gray-500
                    ">

                      {item.location}

                    </p>


                  </div>



                </div>




              </div>


            ))
          }



        </div>



      </div>



    </section>

  );

}