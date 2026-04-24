"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import Header from "@/header/Header";
import Footer from "@/footer/Footer";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import toast from "react-hot-toast";
import { t } from "i18next";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();
  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSaveSuccess(false);

    try {
      const response = await callMiddleWare({
        method: "PUT",
        endpoint: "auth/changePassword",
        data: {
          password: data?.currentPassword,
          newPassword: data?.newPassword,
        },
      });
      if (response?.error) {
        toast.error(t(response?.message));
        console.log("Password change failed:", data);
      } else {
        reset();
        setSaveSuccess(true);
        console.log(response);
      }
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const seoTitle =
      language === "ar"
        ? `الإعدادات | إدارة حساب بيانكا نيرا`
        : `Settings | Manage Your Bianca Nera Account`;
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
                <div className="row mb-4 align-items-center">
                  <div className="col">
                    <div className="profileheadings">
                      <h2>{t("Settings")}</h2>
                      <p>
                        {t(
                          "Manage your preferences, account information, and application settings all in one place",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {saveSuccess && (
                  <div
                    className="alert alert-success alert-dismissible fade show"
                    role="alert"
                  >
                    {t("Password updated successfully!")}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSaveSuccess(false)}
                    ></button>
                  </div>
                )}

                {isLoading ? (
                  <div className="skeleton-loading">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-button"></div>
                  </div>
                ) : (
                  <form
                    className="authform row"
                    onSubmit={handleSubmit(onSubmit)}
                    dir="ltr"
                  >
                    {/* Current Password */}
                    <div className="col-md-6 form-group mb-3">
                      <label className="labelinput" htmlFor="currentPassword">
                        {t("Current Password")}
                      </label>
                      <div className="position-relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          className={`form-control ${errors.currentPassword ? "is-invalid" : ""}`}
                          placeholder={t("Enter your current password")}
                          {...register("currentPassword", {
                            required: t("Current password is required"),
                            minLength: {
                              value: 8,
                              message: t(
                                "Password must be at least 8 characters",
                              ),
                            },
                          })}
                        />
                        <img
                          className="inputicon"
                          src="/assets/img/lock.png"
                          alt={t("lock icon")}
                        />
                        <button
                          type="button"
                          className="eyebtn"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          <img
                            src={`/assets/img/eye${showCurrentPassword ? "1" : ""}.png`}
                            alt={t("toggle visibility")}
                          />
                        </button>
                        {errors.currentPassword && (
                          <div className="invalid-feedback">
                            {errors.currentPassword.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="col-md-6 form-group mb-3">
                      <label className="labelinput" htmlFor="newPassword">
                        {t("New Password")}
                      </label>
                      <div className="position-relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className={`form-control ${errors.newPassword ? "is-invalid" : ""}`}
                          placeholder={t("Enter your new password")}
                          {...register("newPassword", {
                            required: t("New password is required"),
                            pattern: {
                              value: passwordRegex,
                              message: t(
                                "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                              ),
                            },
                          })}
                        />
                        <img
                          className="inputicon"
                          src="/assets/img/lock.png"
                          alt={t("lock icon")}
                        />
                        <button
                          type="button"
                          className="eyebtn"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          <img
                            src={`/assets/img/eye${showNewPassword ? "1" : ""}.png`}
                            alt={t("toggle visibility")}
                          />
                        </button>
                        {errors.newPassword && (
                          <div className="invalid-feedback">
                            {errors.newPassword.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput" htmlFor="confirmPassword">
                        {t("Confirm New Password")}
                      </label>
                      <div className="position-relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                          placeholder={t("Confirm your new password")}
                          {...register("confirmPassword", {
                            required: t("Please confirm your password"),
                            validate: (value) =>
                              value === newPassword ||
                              t("Passwords do not match"),
                          })}
                        />
                        <img
                          className="inputicon"
                          src="/assets/img/lock.png"
                          alt={t("lock icon")}
                        />
                        <button
                          type="button"
                          className="eyebtn"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          <img
                            src={`/assets/img/eye${showConfirmPassword ? "1" : ""}.png`}
                            alt={t("toggle visibility")}
                          />
                        </button>
                        {errors.confirmPassword && (
                          <div className="invalid-feedback">
                            {errors.confirmPassword.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="col-md-12 mb-3 mt-2">
                      <div className="row justify-content-start">
                        <div className="col-md-4 w-100">
                          <button
                            type="submit"
                            className="authbtns2 w-100"
                            disabled={isLoading}
                          >
                            {isLoading ? t("SAVING...") : t("SAVE PASSWORD")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style jsx>{`
        .skeleton-loading {
          padding: 1rem;
        }
        .skeleton-line {
          height: 56px;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        .skeleton-button {
          height: 48px;
          width: 30%;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .invalid-feedback {
          display: block;
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        .is-invalid {
          border-color: #dc3545 !important;
        }
        .alert {
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .authbtns2:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};

export default Settings;
