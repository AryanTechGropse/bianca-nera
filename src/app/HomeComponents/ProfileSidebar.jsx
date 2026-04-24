"use client";
import React from "react";
import Link from "next/link";
import { logoutProfile } from "@/store/serviceSlices/commonSlice";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { persistor } from "@/store/store";
import { useTranslation } from "react-i18next";
import { useRouter, usePathname } from "next/navigation";

const NavLink = ({ to, children, className = "", ...props }) => {
  const pathname = usePathname();
  const isActive = pathname === to;

  return (
    <Link
      href={to}
      className={`${className} ${isActive ? "active" : ""}`}
      {...props}
    >
      {children}
    </Link>
  );
};

const ProfileSidebar = () => {
  const navigate = useRouter();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || "en";
  const isRTL = currentLanguage === "ar";

  const handleLogout = () => {
    dispatch(logoutProfile());
    persistor.purge();
    localStorage.clear();
    sessionStorage.clear();
    toast.success(
      currentLanguage === "ar" ? "تم تسجيل الخروج بنجاح" : "Logout successful",
    );
    navigate("/Authentication");
  };

  const { isUserLoggedIn } = useSelector((state) => ({
    isUserLoggedIn: state?.commonSlice?.isUserLoggedIn,
  }));

  return (
    <>
      <div className={`col-auto profileleftcol ${isRTL ? "rtl-sidebar" : ""}`}>
        <div className="mainsidebar" dir="ltr">
          {isUserLoggedIn && (
            <>
              <NavLink to="/MyProfile">
                <span>
                  <img src="/assets/img/sidebaricon1.png" alt="profile" />
                </span>
                {t("profileSidebar.myProfile")}
              </NavLink>

              <NavLink to="/MyCoupons">
                <span>
                  <img src="/assets/img/sidebaricon3.png" alt="coupons" />
                </span>
                {t("profileSidebar.myCoupons")}
              </NavLink>

              <NavLink to="/MyLoyaltyPoints">
                <span>
                  <img src="/assets/img/walletIcon.png" alt="loyalty" />
                </span>
                {t("profileSidebar.myWallet")}
              </NavLink>

              <NavLink to="/SavedAddress">
                <span>
                  <img src="/assets/img/sidebaricon5.png" alt="address" />
                </span>
                {t("profileSidebar.mySavedAddress")}
              </NavLink>

              <NavLink to="/Career">
                <span>
                  <img src="/assets/img/sidebaricon6.png" alt="career" />
                </span>
                {t("profileSidebar.career")}
              </NavLink>

              <NavLink to="/Settings">
                <span>
                  <img src="/assets/img/sidebaricon7.png" alt="settings" />
                </span>
                {t("profileSidebar.settings")}
              </NavLink>
            </>
          )}

          <NavLink to="/MyOrders">
            <span>
              <img src="/assets/img/sidebaricon2.png" alt="orders" />
            </span>
            {t("profileSidebar.myOrders")}
          </NavLink>

          {/* <NavLink to="/Career">
            <span>
              <img src="/assets/img/sidebaricon6.png" alt="career" />
            </span>
            {t("profileSidebar.career")}
          </NavLink> */}

          <NavLink to="/Content/AboutUs">
            <span>
              <img src="/assets/img/sidebaricon8.png" alt="about" />
            </span>
            {t("profileSidebar.aboutUs")}
          </NavLink>

          <NavLink to="/Content/TermsAndConditions">
            <span>
              <img src="/assets/img/sidebaricon9.png" alt="terms" />
            </span>
            {t("profileSidebar.termsConditions")}
          </NavLink>

          <NavLink to="/Content/PrivacyPolicy">
            <span>
              <img src="/assets/img/sidebaricon10.png" alt="privacy" />
            </span>
            {t("profileSidebar.privacyPolicy")}
          </NavLink>

          <NavLink to="/HelpSupport">
            <span>
              <img src="/assets/img/sidebaricon11.png" alt="help" />
            </span>
            {t("profileSidebar.helpSupport")}
          </NavLink>

          {isUserLoggedIn && (
            <a href="#!" data-bs-toggle="modal" data-bs-target="#logout">
              <span>
                <img src="/assets/img/sidebaricon12.png" alt="logout" />
              </span>
              {t("profileSidebar.logout")}
            </a>
          )}
        </div>
      </div>

      {/* Logout Modal */}
      <div
        className="modal fade commanmodal"
        id="logout"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body position-relative">
              <div className="row">
                <div className="col-md-12">
                  <div className="commanmodaltop">
                    <img src="/assets/img/logout.png" alt="Logout" />
                    <h2 className={isRTL ? "text-right" : ""}>
                      {t("profileSidebar.logoutConfirmation")}
                    </h2>
                    <p className={isRTL ? "text-right" : ""}>
                      {t("profileSidebar.logoutMessage")}
                    </p>
                  </div>
                </div>
                <div className="col-md-12 mt-4">
                  <div className={`row ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="col-md-6 mb-md-0 mb-2">
                      <a
                        className="authbtns1"
                        data-bs-dismiss="modal"
                        id="close"
                      >
                        {t("profileSidebar.notNow")}
                      </a>
                    </div>
                    <div className="col-md-6">
                      <a
                        className="authbtns2 mt-md-0 mt-2"
                        onClick={handleLogout}
                        style={{ cursor: "pointer" }}
                      >
                        {t("profileSidebar.logoutBtn")}
                      </a>
                    </div>
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

export default ProfileSidebar;
