"use client";
import React, { useEffect, useState } from "react";
import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import i18next, { t } from "i18next";
// import Head from "next/head";
// import { Helmet } from "react-helmet";

const ContentManagement = () => {
  const { isUserLoggedIn } = useSelector((state) => ({
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));

  const [content, setContent] = useState(null);
  const { name } = useParams();

  // Get localized content based on current language
  const getLocalizedContent = () => {
    if (!content) return "";
    return i18next.language === "en"
      ? content.contents_en || ""
      : content.contents_ar || content.contents_en || "";
  };

  // Get page title
  const getPageTitle = () => {
    if (name === "TermsAndConditions") {
      return t("Terms & Conditions");
    } else if (name === "PrivacyPolicy") {
      return t("Privacy Policy");
    } else if (name === "AboutUs") {
      return t("About Us");
    }
    return "";
  };

  const getContent = async () => {
    try {
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "user/getContent",
        data: {
          type:
            name === "TermsAndConditions"
              ? "T&C"
              : name === "PrivacyPolicy"
                ? "Privacy Policy"
                : name === "AboutUs"
                  ? "About Us"
                  : "",
        },
      });
      console.log(response);
      setContent(response?.results?.content?.[0] || null);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getContent();
  }, [name]);

  const language = localStorage.getItem("i18nextLng") || "en";

  const pageTitle = getPageTitle();

  const seoTitle =
    language === "ar"
      ? `${pageTitle || name} | معلومات أساسية – بيانكا نيرا`
      : `${pageTitle || name} | Essential Information – Bianca Nera`;

  const seoDescription =
    language === "ar"
      ? `تعرفي على ${pageTitle || name} في بيانكا نيرا. اكتشفي قصة علامتنا التجارية على مدار 15 عاماً وسياساتنا الموثوقة وكل ما تحتاجين معرفته عن تسوق الأزياء الفاخرة.`
      : `Learn about ${pageTitle || name} at Bianca Nera. Discover our 15-year brand story, trusted policies & everything you need to know about luxury fashion shopping.`;

  return (
    <>

      <Header />
      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            {/* {isUserLoggedIn ? <ProfileSidebar /> : ''} */}
            <ProfileSidebar />

            {/* <div
              className={
                isUserLoggedIn
                  ? "col-auto profilerightcol"
                  : "col-auto profilerightcol w-100"
              }
            > */}
            <div className="col-auto profilerightcol">
              <div className="profilerightpart">
                <div className="row conatentpages">
                  <div className="col-md-12">
                    <h1>{getPageTitle()}</h1>

                    {/* Render localized HTML safely */}
                    <div
                      dangerouslySetInnerHTML={{
                        __html: getLocalizedContent(),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ContentManagement;
