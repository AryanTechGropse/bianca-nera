"use client";
import { t } from "i18next";
import React, { useState } from "react";
import Link from "next/link";
import { callMiddleWare } from "@/httpServices/webHttpServices";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      const response = await callMiddleWare({
        method: "post",
        endpoint: "user/subscribe",
        data: { email },
      });

      alert("Successfully subscribed!");
      setEmail("");
    } catch (error) {
      console.error("Subscription error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <>
      <div className="footermain" dir="ltr">
        <div className="container">
          <div className="row">
            {/* ABOUT / NEWSLETTER */}
            <div className="col-lg-3 col-md-12">
              <div className="footerabout">
                <h2>{t("Subscribe To Our News letter")}</h2>
                <p>{t("footer.stayUpToDate")}</p>

                <form onSubmit={handleSubmit}>
                  <div className="emailbox position-relative mb-3">
                    <input
                      type="email"
                      placeholder={t("Enter Email")}
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btnsubmit">
                      <img src="/assets/img/footerarrow.png" alt="submit" />
                    </button>
                  </div>
                </form>

                <div className="socialicons d-flex align-items-center">
                  <a
                    className="footericons me-3"
                    href="https://www.instagram.com/biancanera.group/"
                    target="_blank"
                  >
                    <img src="/assets/img/instagram.png" alt="Instagram" />
                  </a>
                  {/* <a className="footericons me-3" href="#">
                    <img src="/assets/img/twitter.png" alt="Twitter" />
                  </a> */}
                  <a
                    className="footericons me-3"
                    href="https://www.facebook.com/biancanerakuwait/"
                    target="_blank"
                  >
                    <img src="/assets/img/facebook.png" alt="Facebook" />
                  </a>
                </div>
              </div>
            </div>

            {/* INFORMATION */}
            <div className="col-lg-3 col-md-4 mt-md-4 mt-4 d-lg-flex justify-content-center">
              <div className="footerbox">
                <h2>{t("Information")}</h2>
                <ul>
                  <li>
                    <Link href="/Content/AboutUs">{t("About Us")}</Link>
                  </li>
                  <li>
                    <Link href="/Content/TermsAndConditions">
                      {t("Terms & Conditions")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/Content/PrivacyPolicy">
                      {t("Privacy Policy")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/Career">{t("Career")}</Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* CUSTOMER SERVICE */}
            <div className="col-lg-3 col-md-4 mt-md-4 mt-4 d-lg-flex justify-content-center">
              <div className="footerbox">
                <h2>{t("Customer Service")}</h2>
                <ul>
                  <li>
                    <Link href="/Shipping">{t("Shipping & Delivery")}</Link>
                  </li>
                  <li>
                    <Link href="/CustomerService">{t("Exchange & Returns")}</Link>
                  </li>
                  <li>
                    <Link href="/Payment">{t("Payment Methods")}</Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* CONTACT INFO */}
            <div className="col-lg-3 col-md-4 mt-md-4 mt-4 d-lg-flex justify-content-center">
              <div className="footerbox">
                <h2>{t("Contact information")}</h2>

                {/* PHONE */}
                <div className="row align-items-center mb-3">
                  <div className="col-md-auto mb-md-0 mb-2">
                    <span className="footericons">
                      <img src="/assets/img/call.png" alt="Call" />
                    </span>
                  </div>
                  <div className="col ps-md-0 text-center">
                    <a
                      href="tel:+96598006633"
                      className="infofooter text-center ltr-text"
                    >
                      {t("Call")} : +965 9800 6633
                    </a>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="row align-items-center">
                  <div className="col-md-auto mb-md-0 mb-2">
                    <span className="footericons">
                      <img src="/assets/img/mail.png" alt="Email" />
                    </span>
                  </div>
                  <div className="col ps-md-0 text-center">
                    <a
                      href="mailto:Info@bianca-nera.com"
                      className="infofooter text-center ltr-text"
                    >
                      Info@bianca-nera.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
            {/* END */}
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="copyright">
        <div className="container">
          <p>
            {t(
              "All Rights Reserved - Copyright 2024 TM Fashion Group Company for General Trading",
            )}
          </p>
        </div>
      </div>
      <style jsx>
        {`
          .ltr-text {
            direction: ltr;
            unicode-bidi: bidi-override;
            text-align: left;
          }
        `}
      </style>
    </>
  );
};

export default Footer;
