"use client";
import React from "react";
import { t } from "i18next";

const HomeService = () => {
  return (
    <>
      <div className="homeservices padding" dir="ltr">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="row justify-content-center">
                <div className="col-lg-3 col-md-6 col-6 mb-lg-0 mb-md-3 mb-3 h-100">
                  <div className="homeservicesbox">
                    <span>
                      <img src="/assets/img/service1.png" alt="service one" />
                    </span>{" "}
                    {t("Fast")} <br /> {t("Delivery")}
                  </div>
                </div>
                <div className="col-lg-3 col-md-6 col-6 mb-lg-0 mb-md-3 mb-3">
                  <div className="homeservicesbox">
                    <span>
                      <img src="/assets/img/service2.png" alt="service two" />
                    </span>{" "}
                    {t("Return")} <br /> {t("Policy")}
                  </div>
                </div>
                <div className="col-lg-3 col-md-6 col-6 mb-lg-0 mb-md-3">
                  <div className="homeservicesbox">
                    <span>
                      <img src="/assets/img/service3.png" alt="service three" />
                    </span>{" "}
                    {t("Secure")} <br /> {t("Payment")}
                  </div>
                </div>
                <div className="col-lg-3 col-md-6 col-6 mb-lg-0 mb-md-3">
                  <div className="homeservicesbox">
                    <span>
                      <img src="/assets/img/service4.png" alt="service four" />
                    </span>{" "}
                    {t("Support")} <br /> 24/7
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeService;
