import axios from "axios";
import Swal from "sweetalert2";
import { getDeviceId } from "./deviceId";
import { t } from "i18next";

// const BASE_URL = "http://100.52.8.9:2053";
const BASE_URL = "https://bianca-nera.com:2053";

export async function callMiddleWare({
  method,
  endpoint,
  id = "",
  data = null,
  params = null,
}) {
  const token_user = localStorage.getItem("bianca_web_token");
  const deviceId = getDeviceId();
  const url = id ? `${BASE_URL}/${endpoint}/${id}` : `${BASE_URL}/${endpoint}`;
  const language = localStorage.getItem("i18nextLng") || "en";
  const setLanguage = language === "ar" ? "Arabic" : "English";
  const country = localStorage.getItem("userCountry") || "";
  console.log(setLanguage);
  try {
    const config = {
      method,
      url,
      data,
      params,
      headers: {
        ...(token_user ? { "x-auth-token-user": token_user } : {}),
        "x-auth-user-type": "User",
        "x-user-deviceId": deviceId,
        "x-user-lang": setLanguage,
        "x-user-country": country,
      },
    };

    // If data is FormData, let axios set the Content-Type automatically
    // This ensures proper multipart/form-data with boundary
    if (data instanceof FormData) {
      // Remove any explicit Content-Type header to let axios handle it
      delete config.headers["Content-Type"];
    }

    const response = await axios(config);

    return response.data;
  } catch (error) {
    const status = error?.response?.status;

    // Handle unauthorized (401/403)
    if (status === 401 || status === 403) {
      // Clear auth and update redux state
      localStorage.removeItem("bianca_web_token");

      // Lazy load store and dispatch action by string type to avoid circular dependency
      try {
        const { store } = require("@/store/store");
        store.dispatch({
          type: "common/setUserAuthentication",
          payload: false,
        });
      } catch (e) {
        console.error("Error dispatching logout action:", e);
      }

      //   Swal.fire({
      //     toast: true,
      //     icon: "error",
      //     position: "top-end",
      //     title:
      //       error?.response?.data?.message ||
      //       "Session expired. Please login again.",
      //     showConfirmButton: false,
      //     timerProgressBar: true,
      //     timer: 3000,
      //   });

      // Optionally redirect
      //   setTimeout(() => {
      //     window.location.href = "/";
      //   }, 2000);

      return;
    }

    // Handle other errors
    Swal.fire({
      toast: true,
      icon: "error",
      position: "top-end",
      title: error.response?.data?.message || "Something went wrong",
      showConfirmButton: false,
      timerProgressBar: true,
      timer: 3000,
    });

    throw error;
  }
}
