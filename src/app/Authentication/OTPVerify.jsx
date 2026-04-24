"use client";
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import { t } from "i18next";
import ScrollToTop from "@/utils/ScrollToTop";

const OTPVerify = ({
  navigateTo,
  phoneNumber = [],
  mail,
  goBack,
  otpScreen,
}) => {
  const [verification, setVerification] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [resendTime, setResendTime] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const [countryCode, localPhone] = phoneNumber;

  const handleChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 3) inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").slice(0, 4);
    if (/^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split("");
      setOtp((prev) => prev.map((_, i) => newOtp[i] || ""));
      if (pasteData.length === 4) {
        inputRefs.current[3].focus();
      } else {
        inputRefs.current[pasteData.length].focus();
      }
    }
  };

  const verifyOtp = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 4) {
      Swal.fire({
        icon: "warning",
        text: t("otp.enter_4_digit_otp"),
        toast: true,
        timer: 3000,
        timerProgressBar: true,
        position: "top-end",
        showConfirmButton: false,
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: mail,
        phoneNumber: phoneNumber?.[1],
        countryCode: phoneNumber?.[0],
        otp: enteredOtp,
        deviceId: "",
        language: "English",
        deviceOS: "Web",
        userType: "User",
      };

      const response = await callMiddleWare({
        method: "post",
        endpoint: "auth/verifyOTP",
        data: payload,
      });

      if (response && !response.error) {
        Swal.fire({
          toast: true,
          icon: "success",
          position: "top-end",
          title: response.data?.message || t("otp.verification_successful"),
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 3000,
        });
        setVerification(true);

        if (otpScreen === "ResetPassword") {
          navigateTo("ResetPassword");
        } else {
          clearSavedData();
          navigateTo("Login");
        }
      } else {
        throw new Error(response.data?.message || t("otp.verification_failed"));
      }
    } catch (error) {
      Swal.fire({
        toast: true,
        icon: "error",
        position: "top-end",
        title: error.message || t("otp.otp_verification_failed"),
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSavedData = () => {
    localStorage.removeItem("signupFormData");
  };

  const resendOtp = async () => {
    if (!canResend) return;

    try {
      setCanResend(false);
      setResendTime(30);

      const payload = {
        phoneNumber: phoneNumber?.[1],
        countryCode: phoneNumber?.[0],
        language: "English",
        deviceOS: "web",
        userType: "User",
        email: mail,
      };

      const response = await callMiddleWare({
        method: "put",
        endpoint: "auth/forgotPassword",
        data: payload,
      });

      if (response && response?.error) {
        Swal.fire({
          toast: true,
          icon: "error",
          position: "top-end",
          title: response?.message || t("otp.failed_resend_otp"),
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 3000,
        });
      } else {
        Swal.fire({
          toast: true,
          icon: "success",
          position: "top-end",
          title: response?.message || t("otp.otp_resent_successfully"),
          text: `${t("otp.your_otp_is")}: ${response?.results?.otp}`,
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 3000,
        });
      }
    } catch (error) {
      Swal.fire({
        toast: true,
        icon: "error",
        position: "top-end",
        title: error.message || t("otp.failed_resend_otp"),
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
      });
    }
  };

  useEffect(() => {
    let timer;
    if (resendTime > 0) {
      timer = setTimeout(() => setResendTime(resendTime - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTime]);

  useEffect(() => {
    if (otp.every((digit) => digit !== "") && otp.length === 4) {
      verifyOtp();
    }
  }, [otp]);

  return (
    <>
      <div className="authpages padding">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 colwidth">
              <div className="authlogin">
                <div className="authlogintop">
                  <img
                    src="/assets/img/loginbanner.png"
                    alt={t("otp.login_banner_alt")}
                  />
                </div>
                <div className="loginform">
                  <h2>{t("otp.verification")}</h2>
                  <p className="text-center mb-4">
                    {t("otp.enter_4_digit_code_sent_to")} {countryCode}{" "}
                    {localPhone}
                  </p>

                  <form
                    className="authform row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      verifyOtp();
                    }}
                  >
                    <div className="col-md-12 form-group mb-4">
                      <label className="labelinput">
                        {t("otp.verification_code")}
                      </label>
                      <div className="row flex-nowrap justify-content-center">
                        {otp.map((digit, index) => (
                          <div className="col-3" key={index}>
                            <div className="position-relative">
                              <input
                                type="text"
                                className="form-control px-3 text-center otp-input"
                                placeholder="0"
                                maxLength={1}
                                value={digit}
                                onChange={(e) =>
                                  handleChange(index, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                ref={(el) => (inputRefs.current[index] = el)}
                                autoFocus={index === 0}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-md-12 form-group mb-4 text-center">
                      <div className="donthave">
                        {canResend ? (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              resendOtp();
                            }}
                          >
                            {t("otp.resend_code")}
                          </a>
                        ) : (
                          <>
                            {t("otp.resend_code_in")}{" "}
                            <span className="text-primary">
                              00:{resendTime.toString().padStart(2, "0")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="col-md-12 form-group mb-3">
                      <button
                        type="submit"
                        className="authbtns2 w-100"
                        disabled={loading || otp.some((digit) => digit === "")}
                      >
                        {loading ? t("otp.verifying") + "..." : t("otp.verify")}
                      </button>
                    </div>

                    <div className="col-md-12 form-group mb-3 text-center">
                      <a
                        href="#"
                        className="text-decoration-underline"
                        onClick={(e) => {
                          e.preventDefault();
                          goBack();
                        }}
                      >
                        {t("otp.back_to_previous_step")}
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </>
  );
};

export default OTPVerify;
