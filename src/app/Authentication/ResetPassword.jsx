"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import Swal from "sweetalert2";
import { t } from "i18next";

// ✅ Yup validation schema
const schema = yup.object().shape({
  password: yup
    .string()
    .required(t("Password is required"))
    .min(8, t("Minimum 8 characters")),
  confirmPassword: yup
    .string()
    .required(t("Confirm your password"))
    .oneOf([yup.ref("password")], t("Passwords must match")),
});

const ResetPassword = ({ navigateTo, phoneNumber }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        email: "",
        phoneNumber: phoneNumber?.[1],
        countryCode: phoneNumber?.[0],
        password: data.confirmPassword,
        language: localStorage.getItem("bianca_web_language"),
        userType: "User",
      };

      const response = await callMiddleWare({
        method: "put",
        endpoint: "auth/updatePassword",
        data: payload,
      });

      if (!response?.error || !response?.data?.error) {
        reset();
        Swal.fire({
          toast: true,
          icon: "success",
          position: "top-end",
          title: t("Password updated successfully"),
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 3000,
        });
        navigateTo("Login");
      }
    } catch (error) {
      Swal.fire({
        toast: true,
        icon: "error",
        position: "top-end",
        title: t("Something went wrong"),
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
      });
    }
    setLoading(false);
  };

  return (
    <div className="authpages padding">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 colwidth">
            <div className="authlogin">
              <div className="authlogintop">
                <img
                  src="/assets/img/loginbanner.png"
                  alt={t("Reset Password")}
                />
              </div>
              <div className="loginform">
                <h2>{t("Reset Password")}</h2>

                <form
                  className="authform row"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  {/* Password */}
                  <div className="col-md-12 form-group mb-4">
                    <label className="labelinput">{t("Password")}</label>
                    <div className="position-relative" dir="ltr">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`form-control ${
                          errors.password ? "is-invalid" : ""
                        }`}
                        placeholder={t("At least 8 characters")}
                        {...register("password")}
                      />
                      <img
                        className="inputicon"
                        src="/assets/img/lock.png"
                        alt=""
                      />
                      <button
                        type="button"
                        className="eyebtn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <img
                          src={`/assets/img/${
                            showPassword ? "eye-slash.svg" : "eye.png"
                          }`}
                          alt={t("Toggle visibility")}
                        />
                      </button>
                      {errors.password && (
                        <div className="invalid-feedback d-block">
                          {errors.password.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="col-md-12 form-group mb-4">
                    <label className="labelinput">
                      {t("Confirm Password")}
                    </label>
                    <div className="position-relative" dir="ltr">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={`form-control ${
                          errors.confirmPassword ? "is-invalid" : ""
                        }`}
                        placeholder={t("Re-enter password")}
                        {...register("confirmPassword")}
                      />
                      <img
                        className="inputicon"
                        src="/assets/img/lock.png"
                        alt=""
                      />
                      <button
                        type="button"
                        className="eyebtn"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        <img
                          src={`/assets/img/${
                            showConfirmPassword ? "eye-slash.svg" : "eye.png"
                          }`}
                          alt={t("Toggle visibility")}
                        />
                      </button>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback d-block">
                          {errors.confirmPassword.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="col-md-12 form-group mb-4">
                    <button
                      type="submit"
                      className="authbtns2 w-100"
                      disabled={loading}
                    >
                      {loading ? t("Saving...") : t("Save")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
