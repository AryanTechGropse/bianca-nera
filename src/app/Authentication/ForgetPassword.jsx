"use client";
import React, { useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Swal from "sweetalert2";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import { t } from "i18next";
import { countryCodeMap } from "./countryCodes";

const ForgetPassword = ({
  navigateTo,
  setphoneNumber,
  setmail,
  setOtpScreen,
}) => {
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("phone");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    resetField,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: { phone: "", email: "" },
  });

  const phoneValue = watch("phone");
  const emailValue = watch("email");

  const showToast = (type, message) => {
    Swal.fire({
      toast: true,
      icon: type,
      position: "top-end",
      title: message,
      showConfirmButton: false,
      timerProgressBar: true,
      timer: 3000,
    });
  };

  const toggleLoginMethod = (method) => {
    setLoginMethod(method);
    if (method === "phone") {
      resetField("email");
    } else {
      resetField("phone");
    }
  };

  const validatePhoneNumber = (phone) => {
    // More robust phone validation - check if it's at least 7 digits after country code
    if (!phone || phone.length < 7) return false;

    // Remove country code and check if remaining digits are valid
    const phoneDigits = phone.replace(/^\d{1,4}/, ""); // Remove country code (1-4 digits)
    return phoneDigits.length >= 7 && phoneDigits.length <= 15;
  };

  const parsePhoneFromFormatted = (formattedPhone) => {
    if (!formattedPhone) return { countryCode: "", nationalNumber: "" };

    // react-phone-input-2 returns the phone number in format like "919876543210"
    const digits = formattedPhone.replace(/\D/g, "");

    // Try to find the correct country code length
    for (let length = 1; length <= 4; length++) {
      const potentialCountryCode = digits.substring(0, length);
      if (countryCodeMap[potentialCountryCode] === length) {
        const nationalNumber = digits.substring(length);
        return {
          countryCode: `+${potentialCountryCode}`,
          nationalNumber: nationalNumber,
        };
      }
    }

    // Fallback for unknown country codes - try common lengths
    for (let length of [3, 2, 1]) {
      const potentialCountryCode = digits.substring(0, length);
      const potentialNationalNumber = digits.substring(length);

      if (
        potentialNationalNumber.length >= 7 &&
        potentialNationalNumber.length <= 15
      ) {
        return {
          countryCode: `+${potentialCountryCode}`,
          nationalNumber: potentialNationalNumber,
        };
      }
    }

    // Last resort fallback
    return {
      countryCode: `+${digits.substring(0, 2)}`,
      nationalNumber: digits.substring(2),
    };
  };

  const onSubmit = useCallback(
    async (formData) => {
      try {
        setLoading(true);
        let payload;

        if (loginMethod === "phone") {
          if (!formData.phone) throw new Error("Phone number is required");

          if (!validatePhoneNumber(formData.phone)) {
            throw new Error("Please enter a valid phone number");
          }

          const parsedNumber = parsePhoneFromFormatted(formData.phone);

          payload = {
            phoneNumber: parsedNumber.nationalNumber,
            countryCode: parsedNumber.countryCode,
            language: "English",
            deviceOS: "web",
            userType: "User",
          };

          setphoneNumber([payload.countryCode, payload.phoneNumber]);
        } else {
          if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
            throw new Error("Please enter a valid email address.");
          }

          payload = {
            email: formData.email,
            language: "English",
            deviceOS: "web",
            userType: "User",
          };
          setmail(formData.email);
        }

        const response = await callMiddleWare({
          method: "put",
          endpoint: "auth/forgotPassword",
          data: payload,
        });

        if (response?.error || response?.error) {
          throw new Error(response?.message || response?.message);
        }

        showToast(
          "success",
          response?.results?.otp + " " + response?.message ||
            "Recovery code sent successfully",
        );
        setOtpScreen("ResetPassword");
        navigateTo("OTP");
      } catch (error) {
        showToast(
          "error",
          error.response?.message ||
            error.message ||
            "Failed to send recovery code",
        );
      } finally {
        setLoading(false);
      }
    },
    [loginMethod, navigateTo, setphoneNumber, setmail, setOtpScreen],
  );

  return (
    <>
      <div className="authpages padding">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 colwidth">
              <div className="authlogin">
                <div className="authlogintop">
                  <img src="assets/img/loginbanner.png" alt="Login Banner" />
                </div>
                <div className="loginform">
                  <h2>{t("Forgot Password")}</h2>

                  {/* Login Method Tabs */}
                  <div className="login-tabs mb-4">
                    <div className="nav nav-tabs" role="tablist">
                      <button
                        className={`nav-link ${loginMethod === "phone" ? "active" : ""}`}
                        onClick={() => toggleLoginMethod("phone")}
                        type="button"
                        role="tab"
                      >
                        <img
                          src="/assets/img/phone.png"
                          alt="Phone"
                          className="tab-icon"
                        />
                        {t("Phone")}
                      </button>
                      <button
                        className={`nav-link ${loginMethod === "email" ? "active" : ""}`}
                        onClick={() => toggleLoginMethod("email")}
                        type="button"
                        role="tab"
                      >
                        <img
                          src="/assets/img/email.png"
                          alt="Email"
                          className="tab-icon"
                        />
                        {t("Email")}
                      </button>
                    </div>
                  </div>

                  <form
                    className="authform row"
                    onSubmit={handleSubmit(onSubmit)}
                  >
                    {loginMethod === "phone" ? (
                      <div className="col-md-12 form-group mb-4" dir="ltr">
                        <label className="labelinput" htmlFor="phone">
                          {t("Mobile Number")}
                        </label>
                        <div className="position-relative">
                          <Controller
                            name="phone"
                            control={control}
                            rules={{
                              required: t("Phone number is required"),
                              validate: {
                                validPhone: (value) =>
                                  validatePhoneNumber(value) ||
                                  "Please enter a valid phone number",
                              },
                            }}
                            render={({ field: { onChange, value } }) => (
                              <PhoneInput
                                country={"sa"} // Default to Saudi Arabia
                                value={value}
                                onChange={onChange}
                                inputProps={{
                                  name: "phone",
                                  required: true,
                                  autoFocus: false,
                                  placeholder: t("Enter phone number"),
                                }}
                                containerStyle={{
                                  width: "100%",
                                }}
                                inputStyle={{
                                  width: "100%",
                                  height: "48px",
                                  fontSize: "16px",
                                  paddingLeft: "48px",
                                  border: errors.phone
                                    ? "1px solid #dc3545"
                                    : "1px solid #ced4da",
                                  borderRadius: "4px",
                                }}
                                buttonStyle={{
                                  border: errors.phone
                                    ? "1px solid #dc3545"
                                    : "1px solid #ced4da",
                                  borderRadius: "4px 0 0 4px",
                                  backgroundColor: "#fff",
                                }}
                                dropdownStyle={{
                                  zIndex: 1050,
                                }}
                                countryCodeEditable={false}
                                enableSearch={true}
                                searchPlaceholder="Search countries"
                                preferredCountries={[
                                  "sa",
                                  "ae",
                                  "in",
                                  "us",
                                  "gb",
                                ]}
                              />
                            )}
                          />
                          {errors.phone && (
                            <div className="invalid-feedback d-block">
                              {errors.phone.message}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="col-md-12 form-group mb-4">
                        <label className="labelinput">
                          {t("Email Address")}
                        </label>
                        <div className="position-relative">
                          <input
                            type="email"
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            placeholder={t("Enter your email")}
                            autoComplete="off"
                            {...register("email", {
                              required: t("Email is required"),
                              pattern: {
                                value: /^\S+@\S+\.\S+$/,
                                message: t(
                                  "Please enter a valid email address",
                                ),
                              },
                            })}
                          />
                          <img
                            className="inputicon"
                            src="/assets/img/mail.png"
                            style={{ top: "13px" }}
                            alt="Mail"
                          />

                          {errors.email && (
                            <div className="invalid-feedback d-block">
                              {errors.email.message}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="col-md-12 form-group mb-3">
                      <button
                        type="submit"
                        className="authbtns2 w-100"
                        disabled={loading}
                      >
                        {loading ? t("SENDING...") : t("SEND CODE")}
                      </button>
                    </div>
                    <div className="col-md-12 form-group mb-3 text-center">
                      <div className="donthave">
                        {t("Remember Password?")}{" "}
                        <a
                          href="#login"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo("Login");
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {t("Login")}
                        </a>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-tabs .nav-tabs {
          display: flex;
          border: none;
          background: #f8f9fa;
          border-radius: 50px;
          padding: 4px;
        }
        .login-tabs .nav-link {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: #6c757d;
          font-weight: 500;
          border-radius: 50px;
          transition: all 0.3s ease;
        }
        .login-tabs .nav-link:hover {
          color: #495057;
          background: rgba(255, 255, 255, 0.7);
        }
        .login-tabs .nav-link.active {
          background: #fff;
          color: #000000ff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .tab-icon {
          width: 18px;
          height: 18px;
          object-fit: contain;
        }
      `}</style>
    </>
  );
};

export default ForgetPassword;
