"use client";
import React from "react";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import i18next, { t } from "i18next";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const BannerCategory = ({ category = [], loading }) => {
  const isMobile = window.innerWidth <= 768;

  const settings = {
    // infinite: true,
    // slidesToShow: 1.5,
    // slidesToScroll: 1,
    // arrows: true,
    // dots: false,
    // autoplay: true,
    // autoplaySpeed: 3000,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    dots: false,
    centerMode: true,
    centerPadding: "40px",
  };

  return (
    <div className="bannercategory padding">
      <div className="container">
        <div
          // className={isMobile ? "d-flex gap-3 pb-2 mobile-scroll" : "row"}
          className={isMobile ? "" : "row"}
          // style={
          //   isMobile
          //     ? {
          //         scrollSnapType: "x mandatory",
          //         overflowX: "auto",
          //       }
          //     : {}
          // }
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={
                  isMobile ? "flex-shrink-0" : "col-lg-4 col-md-6 mb-4"
                }
                style={isMobile ? { width: "70%" } : {}}
              >
                <div className="bannercategorybox text-center">
                  <Skeleton height={180} width="100%" borderRadius={8} />
                  <div className="categoryname mt-2">
                    <Skeleton width={100} height={20} />
                  </div>
                </div>
              </div>
            ))
          ) : isMobile ? (
            <div className="w-100 overflow-hidden">
              <Slider {...settings}>
                {category?.map((cat) => (
                  <div
                    key={cat._id}
                    className={
                      // isMobile ? "flex-shrink-0" : "col-lg-4 col-md-6 mb-4"
                      "col-12 px-2"
                    }
                    // style={
                    //   isMobile ? { width: "70%", scrollSnapAlign: "start" } : {}
                    // }
                  >
                    <Link
                      href={`/category/${cat._id}`}
                      className="bannercategorybox text-center d-block"
                    >
                      <img
                        src={cat.image}
                        alt={cat.name_en}
                        className="img-fluid"
                        loading="eager"
                        fetchPriority="high"
                        style={{
                          borderRadius: "8px",
                          objectFit: "cover",
                          width: "100%",
                          height: "180px",
                        }}
                      />
                      <div className="categoryname mt-2">
                        {" "}
                        {i18next.language === "ar"
                          ? cat?.name_ar
                          : cat?.name_en}
                      </div>
                    </Link>
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            category?.map((cat) => (
              <div
                key={cat._id}
                className={
                  // isMobile ? "flex-shrink-0" : "col-lg-4 col-md-6 mb-4"
                  "col-lg-4 col-md-6 mb-4"
                }
                // style={
                //   isMobile ? { width: "70%", scrollSnapAlign: "start" } : {}
                // }
              >
                <Link
                  href={`/category/${cat._id}`}
                  className="bannercategorybox text-center d-block"
                >
                  <img
                    src={cat.image}
                    alt={cat.name_en}
                    className="img-fluid"
                    style={{
                      borderRadius: "8px",
                      objectFit: "cover",
                      width: "100%",
                      height: "180px",
                    }}
                    loading="eager"
                    fetchPriority="high"
                  />
                  <div className="categoryname mt-2">
                    {" "}
                    {i18next.language === "ar" ? cat?.name_ar : cat?.name_en}
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hide scrollbar only on mobile */}
      <style jsx="true">{`
        @media (max-width: 768px) {
          .mobile-scroll {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          .mobile-scroll::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        }
      `}</style>
    </div>
  );
};

export default BannerCategory;
