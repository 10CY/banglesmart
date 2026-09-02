"use client";

import {
  Gem,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
} from "lucide-react";



const features = [

  {
    icon: Gem,
    title: "Premium Quality",
    description:
      "Carefully crafted jewellery with elegant finishing.",
  },


  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description:
      "Safe and secure payment experience.",
  },


  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Reliable delivery across India.",
  },


  {
    icon: RotateCcw,
    title: "Easy Returns",
    description:
      "Simple and hassle-free return process.",
  },


  {
    icon: Award,
    title: "Trusted Jewellery",
    description:
      "Designed for your special moments.",
  },

];





export default function TrustSection(){


  return (

    <section className="
      bg-[#faf6ee]
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

            Why Choose Us

          </p>



          <h2 className="
            mt-3
            text-3xl
            font-semibold
            text-gray-900
            md:text-4xl
          ">

            A Beautiful Shopping Experience

          </h2>



          <p className="
            mx-auto
            mt-3
            max-w-xl
            text-gray-500
          ">

            From design to delivery, we make every
            jewellery purchase special.

          </p>


        </div>









        {/* Cards */}


        <div className="
          mt-10
          grid
          grid-cols-1
          gap-5
          sm:grid-cols-2
          lg:grid-cols-5
        ">


          {
            features.map((item)=>{


              const Icon =
                item.icon;



              return (

                <div

                  key={item.title}

                  className="
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white
                    p-6
                    text-center
                    transition
                    hover:-translate-y-1
                    hover:shadow-lg
                  "

                >



                  <div className="
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    bg-[#C9A227]/10
                  ">


                    <Icon

                      size={26}

                      className="
                        text-[#C9A227]
                      "

                    />


                  </div>





                  <h3 className="
                    mt-5
                    font-semibold
                    text-gray-900
                  ">

                    {item.title}

                  </h3>




                  <p className="
                    mt-2
                    text-sm
                    leading-6
                    text-gray-500
                  ">

                    {item.description}

                  </p>



                </div>

              );


            })
          }



        </div>



      </div>



    </section>

  );

}