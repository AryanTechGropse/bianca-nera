"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { t } from "i18next";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const TopDesigner = ({ fashionData, loading }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen width
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    handleResize(); // run on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Slick slider settings (for mobile)
  const mobileSettings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 2500,
    swipeToSlide: true,
  };

  return (
    <div className="topdesigner padding pt-4">
      <div className="container">
        <div className="text-center mb-4">
          <div className="commanhead">{t("Top Designer")}</div>
        </div>

        {/* Render grid for desktop */}
        {!isMobile ? (
          <div className="row justify-content-center">
            {fashionData?.map((i, index) => (
              <div
                key={index}
                className="col-lg-auto col-md-3 col-6 mb-lg-0 mb-md-3 mb-3"
              >
                <Link
                  href={`/Designer/${i?._id}`}
                  className="topdesignerlogo"
                >
                  <img src={i?.logo} alt={i?.full_name} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          // Slick Slider for mobile
          <Slider {...mobileSettings}>
            {fashionData?.map((i, index) => (
              <div key={index} className="text-center">
                <Link
                  href={`/Designer/${i?._id}`}
                  className="topdesignerlogo"
                >
                  <img
                    src={i?.logo}
                    alt={i?.full_name}
                    style={{ width: "70%", margin: "0 auto", borderRadius: 8 }}
                  />
                </Link>
              </div>
            ))}
          </Slider>
        )}
      </div>
    </div>
  );
};

export default TopDesigner;
