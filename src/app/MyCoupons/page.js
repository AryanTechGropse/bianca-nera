"use client";
import React, { useEffect, useState } from "react";
import Header from "@/header/Header";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import Footer from "@/footer/Footer";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import { t } from "i18next";

const MyCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, valid, expired

  const getMyCoupons = async () => {
    try {
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "/products/getCoupons",
        data: { page: 1, pageSize: 100 },
      });
      setCoupons(response?.results?.coupons || []);
      setFilteredCoupons(response?.results?.coupons || []);
    } catch (error) {
      console.log(error?.message);
    }
  };

  useEffect(() => {
    getMyCoupons();
  }, []);

  // Filter coupons based on search term and status
  useEffect(() => {
    let result = coupons;

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (coupon) =>
          coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.description_en.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by status
    if (filterStatus === "valid") {
      result = result.filter((coupon) => coupon.isValid);
    } else if (filterStatus === "expired") {
      result = result.filter((coupon) => !coupon.isValid);
    }

    setFilteredCoupons(result);
  }, [searchTerm, filterStatus, coupons]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Coupon code "${code}" copied to clipboard!`);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const seoTitle =
      language === "ar"
        ? `كوبوناتي | افتحي خصومات حصرية – بيانكا نيرا`
        : `My Coupons | Unlock Exclusive Discounts – Bianca Nera`;
    document.title = seoTitle;
  }, [language]);

  return (
    <>
      <Header />
      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            <ProfileSidebar />
            <div className="col-auto profilerightcol">
              <div className="profilerightpart">
                <div className="row mb-md-4 mb-2 align-items-center">
                  <div className="col">
                    <div className="profileheadings">
                      <h2>{t("My Coupons")}</h2>
                    </div>
                  </div>
                  <div className="col-md-auto mt-md-0 mt-2 proflebtns">
                    <div className="row">
                      <div className="col-md-auto">
                        <form
                          className="profileheadsearch"
                          onSubmit={(e) => e.preventDefault()}
                        >
                          <input
                            type="search"
                            className="form-control"
                            placeholder={t("Search coupons...")}
                            value={searchTerm}
                            onChange={handleSearch}
                          />
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                {filteredCoupons.length === 0 ? (
                  <div className="text-center py-5">
                    <h4>{t("No coupons found")}</h4>
                    <p className="text-muted">
                      {coupons.length === 0
                        ? t("You don't have any coupons yet.")
                        : t("Try adjusting your search or filter criteria.")}
                    </p>
                  </div>
                ) : (
                  <div className="row">
                    {filteredCoupons.map((coupon) => (
                      <div
                        key={coupon._id}
                        className="col-md-6 mb-4 d-flex align-items-stretch"
                      >
                        <div
                          className={`mycouponmain ${coupon.isValid ? "valid-coupon" : "expired-coupon"}`}
                        >
                          <div className="row border-bottom mb-2 pb-3 align-items-center mx-0">
                            <div className="col-auto ps-0">
                              <div className="Couponsicon">
                                <img
                                  src="/assets/img/profileicon3.png"
                                  alt="coupon"
                                />
                              </div>
                            </div>
                            <div className="col ps-0">
                              <div className="coupontitle">{coupon.name}</div>
                              <div className="coupon-discount">
                                {coupon.amount}{" "}
                                {coupon.minOrder
                                  ? `on orders above ${coupon.minOrder}$`
                                  : ""}
                              </div>
                            </div>
                          </div>
                          <div className="Couponsdetails">
                            <p>{coupon.description_en}</p>
                            <div className="coupon-validity">
                              <small>
                                {t("Valid")}: {formatDate(coupon.valid_from)} -{" "}
                                {formatDate(coupon.valid_till)}
                              </small>
                            </div>
                            {coupon.limit && (
                              <div className="coupon-usage">
                                <small>
                                  {coupon.used} {t("of")} {coupon.limit}{" "}
                                  {t("used")}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyCoupons;
