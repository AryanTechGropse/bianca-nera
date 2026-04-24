"use client";
import React from "react";
import Slider from "react-slick";
import Products from "../Products/Products";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Link from "next/link";
import { t } from "i18next";

const AIRecommendation = ({ products, loading }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const productList = products?.products || products || [];
  const displayedProducts = productList.slice(0, 4);

  // Slider configuration
  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <>
      <div className="ai_recommdation padding pt-0">
        <div className="container">
          <div className="row ai_recommdation_row">
            <div className="col-md-12 mb-4">
              <div className="row">
                <div className="col">
                  <div className="commanhead">{t("AI Recommendation")}</div>
                </div>
                <div className="col-auto" dir="ltr">
                  <Link
                    href="/Product/All/Recommended-Products"
                    className="seeallbtn"
                  >
                    {t("See all")}{" "}
                    <img
                      style={{ direction: "ltr" }}
                      src="/assets/img/seeall.png"
                      alt=""
                    />
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-12">
              <div className="row productrow flex-nowrap overflow-auto">
                {loading ? (
                  // Skeleton loader for 4 products
                  [...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="col-lg-3 col-md-4 col-sm-6 mb-4"
                    >
                      <div className="product-skeleton">
                        <div
                          className="skeleton-img"
                          style={{ height: "350px", marginBottom: "15px" }}
                        ></div>
                        <div
                          className="skeleton-line"
                          style={{
                            width: "70%",
                            height: "16px",
                            marginBottom: "10px",
                          }}
                        ></div>
                        <div
                          className="skeleton-line"
                          style={{
                            width: "50%",
                            height: "20px",
                            marginBottom: "10px",
                          }}
                        ></div>
                        <div
                          className="skeleton-line"
                          style={{ width: "40%", height: "16px" }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  // <Products products={displayedProducts} loading={loading} classType={"col-medium"} />
                  <div
                    className={`col-12 py-3 ${isMobile ? "slider-card" : "horizontal-scroll-card"}`}
                  >
                    <Products
                      isMobile={isMobile}
                      products={displayedProducts}
                      loading={loading}
                      classType={"col-medium"}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          .product-skeleton {
            background: #fff;
            border-radius: 8px;
            padding: 10px;
          }
          .skeleton-img,
          .skeleton-line {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </>
  );
};

export default AIRecommendation;
