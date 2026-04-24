"use client";
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useRouter } from "next/navigation";

const Banners = ({ bannerData, loading }) => {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Detect screen size for responsive layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: true,
    adaptiveHeight: true,
    swipe: true,
    swipeToSlide: true,
    touchThreshold: 10,
    draggable: true,
    fade: false,
    cssEase: "cubic-bezier(0.645, 0.045, 0.355, 1)",
    waitForAnimate: true,
    touchMove: true,
    focusOnSelect: false,
    centerPadding: "0px",
    variableWidth: false,
  };

  if (loading) {
    return (
      <div className={isMobile ? "bannersectionMobile" : "bannersection"}>
        <div className="container">
          <div className="skeleton-slider">
            <div className="skeleton-image"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!bannerData || bannerData.length === 0) {
    return (
      <div className={isMobile ? "bannersectionMobile" : "bannersection"}>
        <div className="container">
          <div className="row justify-content-end">
            <div className="col-md-6">
              <div className="bannercontent text-center">
                <h1></h1>
                <h2></h2>
                <a href="#shop"></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nonPromotionalBanners = bannerData.filter(
    (banner) => banner.isPromotional === false || !banner.isPromotional,
  );

  const handleBannerClick = (banner) => {
    if (banner?.productId) {
      router.push(`/product/${banner.productId}`);
    } else if (banner?.categoryId) {
      router.push(`/category/${banner.categoryId}`);
    }
  };

  return (
    <div className="banner-slider-container">
      <Slider {...settings}>
        {nonPromotionalBanners.map((banner) => (
          <div
            key={banner?._id || Math.random()}
            className="banner-slide"
            onClick={() => handleBannerClick(banner)}
            style={{
              cursor:
                banner?.productId || banner?.categoryId ? "pointer" : "default",
            }}
          >
            <div
              className={isMobile ? "bannersectionMobile" : "bannersection"}
              // style={{
              //   backgroundImage: `url(${banner?.image})`,
              //   backgroundSize: "cover",
              //   backgroundPosition: "center",
              //   backgroundRepeat: "no-repeat",
              // }}
            >
              {/* Preload critical banner images */}
              {banner?.image && (
                <img
                  src={banner.image}
                  alt={banner?.title || "Banner"}
                  loading="eager"
                  fetchPriority="high"
                  className="w-100 h-100 object-fit-cover"
                  // style={{ display: 'none' }}
                />
              )}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Banners;
