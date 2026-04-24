"use client";
import React, { useEffect, useState, useCallback } from "react";
import Header from "@/header/Header";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import Footer from "@/footer/Footer";
import { useRouter, useParams } from "next/navigation";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

const CareerDetails = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRTL, setIsRTL] = useState(i18n.language === "ar");

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setIsRTL(lng === "ar");
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => i18n.off("languageChanged", handleLanguageChange);
  }, []);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    countryCode: "",
    email: "",
    nationality: "",
    address: "",
    resume: null,
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState("");

  const validationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    name: /^[a-zA-Z\s]{2,50}$/,
    address: /^.{10,200}$/,
  };

  const supportedFileTypes = {
    images: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
    documents: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  };

  const getAllowedFileTypes = () => {
    return [...supportedFileTypes.images, ...supportedFileTypes.documents];
  };

  const getJobDetails = useCallback(async (jobId) => {
    try {
      setLoading(true);
      const response = await callMiddleWare({
        method: "GET",
        endpoint: `analytics/getJobDetails`,
        id: jobId,
      });
      setJob(response.results.job);
    } catch (error) {
      setError(t("career.failedToLoadJobDetails"));
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (id) {
      getJobDetails(id);
    }
  }, [id, getJobDetails]);

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = t("career.errors.fullNameRequired");
    } else if (!validationPatterns.name.test(formData.fullName.trim())) {
      errors.fullName = t("career.errors.fullNameInvalid");
    }

    if (!formData.phoneNumber) {
      errors.phoneNumber = t("career.errors.phoneRequired");
    } else if (formData.phoneNumber.length < 5) {
      errors.phoneNumber = t("career.errors.phoneInvalid");
    }

    if (!formData.email.trim()) {
      errors.email = t("career.errors.emailRequired");
    } else if (!validationPatterns.email.test(formData.email.trim())) {
      errors.email = t("career.errors.emailInvalid");
    }

    if (!formData.nationality) {
      errors.nationality = t("career.errors.nationalityRequired");
    }

    if (!formData.address.trim()) {
      errors.address = t("career.errors.addressRequired");
    } else if (!validationPatterns.address.test(formData.address.trim())) {
      errors.address = t("career.errors.addressInvalid");
    }

    if (!formData.resume) {
      errors.resume = t("career.errors.resumeRequired");
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePhoneChange = (value, country) => {
    setFormData((prev) => ({
      ...prev,
      phoneNumber: value.replace(country.dialCode, ""),
      countryCode: "+" + country.dialCode,
    }));

    if (formErrors.phoneNumber) {
      setFormErrors((prev) => ({
        ...prev,
        phoneNumber: "",
      }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      const allowedTypes = getAllowedFileTypes();
      if (!allowedTypes.includes(file.type)) {
        setFormErrors((prev) => ({
          ...prev,
          resume: t("career.errors.invalidFileType"),
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          resume: t("career.errors.fileSizeExceeded"),
        }));
        return;
      }

      setFormErrors((prev) => ({
        ...prev,
        resume: "",
      }));

      setFormData((prev) => ({
        ...prev,
        resume: file,
      }));

      setFileName(file.name);

      if (supportedFileTypes.images.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview("/assets/img/document-icon.png");
      }
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({
      ...prev,
      resume: null,
    }));
    setFilePreview(null);
    setFileName("");
    const fileInput = document.getElementById("uploadfile");
    if (fileInput) fileInput.value = "";
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      try {
        const submitData = new FormData();
        submitData.append("name", formData.fullName.trim());
        submitData.append("phone_number", formData.phoneNumber);
        submitData.append("country_code", formData.countryCode);
        submitData.append("email", formData.email.trim());
        submitData.append("country", formData.nationality);
        submitData.append("address", formData.address.trim());
        submitData.append("jobId", id);

        if (formData.resume) {
          submitData.append("resume", formData.resume);
        }

        const response = await callMiddleWare({
          method: "POST",
          endpoint: "analytics/applyJob",
          data: submitData,
        });

        if (!response?.error) {
          toast.success(response?.message);
          getJobDetails(id);
          const closeBtn = document.getElementById("ccnnl");
          if (closeBtn) closeBtn.click();
          setFormData({
            fullName: "",
            phoneNumber: "",
            countryCode: "",
            email: "",
            nationality: "",
            address: "",
            resume: null,
          });
          setFilePreview(null);
          setFileName("");
        }
      } catch (error) {
        console.error("Error submitting application:", error);
        toast.error(t("career.errors.submissionFailed"));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const jobTitle =
      language === "ar"
        ? job?.title_ar || job?.title_en || ""
        : job?.title_en || "";
    const seoTitle =
      language === "ar"
        ? `${jobTitle} | وظائف بيانكا نيرا`
        : `${job?.title_en || "Career"} | Careers at Bianca Nera`;
    document.title = seoTitle;
  }, [language, job]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="myprofilepage py-lg-5 py-md-4 py-4">
          <div className="container text-center">
            <p>{t("Loading...")}</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !job) {
    return (
      <>
        <Header />
        <div className="myprofilepage py-lg-5 py-md-4 py-4">
          <div className="container text-center">
            <h3>{error || t("career.jobNotFound")}</h3>
            <button className="btn btn-dark mt-3" onClick={() => router.back()}>
              {t("Back")}
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="myprofilepage py-lg-5 py-md-4 py-4">
        <div className="container">
          <div className="row">
            <ProfileSidebar />
            <div className="col-auto profilerightcol">
              <div className="profilerightpart">
                <button
                  className="btn btn-dark mb-3"
                  onClick={() => router.push("/Career")}
                >
                  {t("Back")}
                </button>

                <div className="row mb-4 align-items-center">
                  <div className="col">
                    <div className="profileheadings">
                      <h2>{t("career.title")}</h2>
                      <p>{t("career.subtitle")}</p>
                    </div>
                  </div>
                  <div className="col-md-auto mt-md-0 mt-2 proflebtns">
                    {job.isApplied ? (
                      <button className="authbtns1 active px-5" disabled>
                        {t("career.applied")}
                      </button>
                    ) : (
                      <button
                        className="authbtns1 px-5"
                        data-bs-toggle="modal"
                        data-bs-target="#applyjob"
                      >
                        {t("career.apply")}
                      </button>
                    )}
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <div className="careersbox position-relative d-block px-4 py-4">
                      <div className="carreerpost">
                        {i18n.language === "ar"
                          ? job.profile_ar
                          : job.profile_en}
                      </div>
                      <div className="location">
                        {t("career.location")}: <span>{job.location}</span>
                      </div>
                      <div className="jobdescription border-bottom py-3">
                        <span>{t("career.jobDescription")}</span>
                        <div className="jobpara mt-1">
                          {i18n.language === "ar"
                            ? job.jobDescription_ar
                            : job.jobDescription_en}
                        </div>
                      </div>
                      <div className="jobdescription border-bottom py-3">
                        <span>{t("career.requirements")}</span>
                        <div className="jobpara mt-1">
                          {i18n.language === "ar"
                            ? job.jobRequirements_ar
                            : job.jobRequirements_en}
                        </div>
                      </div>
                      <div className="row pt-3">
                        <div className="col-md-6 mb-3">
                          <div className="jobdescription">
                            <span>{t("career.experience")}</span>
                            <div className="jobpara mt-1">
                              {job.yearsOfExperience[0]} -{" "}
                              {job.yearsOfExperience[1]} {t("career.years")}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="jobdescription">
                            <span>{t("career.availability")}</span>
                            <div className="jobpara mt-1">
                              {job.availability === "notice"
                                ? t("career.noticePeriod")
                                : t("career.immediate")}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="jobdescription">
                            <span>{t("career.workMode")}</span>
                            <div className="jobpara mt-1">
                              {job.mode === "remote"
                                ? t("career.remote")
                                : job.mode === "office"
                                  ? t("career.office")
                                  : t("career.hybrid")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <div
        className="modal fade addtocartmodal needhelpmodal"
        id="applyjob"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body position-relative">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                id="ccnnl"
              />
              <div className="row">
                <div className="col-md-12 mb-4">
                  <div className="modalhead text-center">
                    <h2>{t("career.addDetails")}</h2>
                    <p>{t("career.modalDescription")}</p>
                  </div>
                </div>
                <div className="col-md-12 mb-3">
                  <form
                    className="authform row mx-0"
                    onSubmit={handleFormSubmit}
                  >
                    <div className="col-md-6 form-group mb-3">
                      <label className="labelinput" htmlFor="fullName">
                        {t("career.fullName")}*
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        className={`form-control px-3 ${formErrors.fullName ? "error" : ""}`}
                        placeholder={t("career.placeholders.fullName")}
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                      {formErrors.fullName && (
                        <div className="form-error text-danger small">
                          {formErrors.fullName}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6 form-group mb-3">
                      <label className="labelinput">
                        {t("career.mobileNumber")}*
                      </label>
                      <div dir="ltr">
                        <PhoneInput
                          country={i18n.language === "ar" ? "sa" : "us"}
                          value={formData.countryCode + formData.phoneNumber}
                          onChange={handlePhoneChange}
                          inputProps={{
                            name: "phone",
                            placeholder: t("career.placeholders.phoneNumber"),
                          }}
                          containerStyle={{ width: "100%" }}
                          inputStyle={{
                            width: "100%",
                            height: "48px",
                            fontSize: "16px",
                          }}
                        />
                      </div>
                      {formErrors.phoneNumber && (
                        <div className="form-error text-danger small">
                          {formErrors.phoneNumber}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6 form-group mb-3">
                      <label className="labelinput" htmlFor="email">
                        {t("career.email")}*
                      </label>
                      <input
                        type="email"
                        name="email"
                        className={`form-control px-3 ${formErrors.email ? "error" : ""}`}
                        placeholder={t("career.placeholders.email")}
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      {formErrors.email && (
                        <div className="form-error text-danger small">
                          {formErrors.email}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6 form-group mb-3">
                      <label className="labelinput" htmlFor="nationality">
                        {t("career.nationality")}*
                      </label>
                      <select
                        name="nationality"
                        className={`form-select px-3 ${formErrors.nationality ? "error" : ""}`}
                        value={formData.nationality}
                        onChange={handleInputChange}
                      >
                        <option value="">
                          {t("career.selectNationality")}
                        </option>
                        <option value="afghan">{t("nationalities.afghan")}</option>
                        <option value="qatari">{t("nationalities.qatari")}</option>
                        <option value="saudi">{t("nationalities.saudi")}</option>
                        <option value="emirati">{t("nationalities.emirati")}</option>
                        <option value="kuwaiti">{t("nationalities.kuwaiti")}</option>
                        {/* Add more options as needed */}
                      </select>
                      {formErrors.nationality && (
                        <div className="form-error text-danger small">
                          {formErrors.nationality}
                        </div>
                      )}
                    </div>

                    <div className="col-md-12 form-group mb-3">
                      <label className="labelinput" htmlFor="address">
                        {t("career.address")}*
                      </label>
                      <textarea
                        name="address"
                        className={`form-control px-3 ${formErrors.address ? "error" : ""}`}
                        placeholder={t("career.placeholders.address")}
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={2}
                      />
                      {formErrors.address && (
                        <div className="form-error text-danger small">
                          {formErrors.address}
                        </div>
                      )}
                    </div>

                    <div className="col-md-12 form-group mb-4">
                      <label className="labelinput">
                        {t("career.resume")}*
                      </label>
                      <div className="uploadboxmain">
                        <input
                          type="file"
                          className="d-none"
                          id="uploadfile"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,image/*"
                        />
                        <label htmlFor="uploadfile" style={{ cursor: "pointer" }}>
                          <div className="text-center">
                            <img
                              src="/assets/img/upload1.png"
                              alt={t("career.upload")}
                            />
                            <span>{t("career.upload_your_image")}</span>
                          </div>
                        </label>
                      </div>
                      {fileName && (
                        <div className="file-preview-container d-flex align-items-center mt-2 p-2 bg-light rounded">
                          <span className="flex-grow-1 text-truncate">
                            {fileName}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger ms-2"
                            onClick={removeFile}
                          >
                            ×
                          </button>
                        </div>
                      )}
                      {formErrors.resume && (
                        <div className="form-error text-danger small">
                          {formErrors.resume}
                        </div>
                      )}
                    </div>

                    <div className="col-md-12">
                      <button
                        type="submit"
                        className="authbtns2 w-100"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? t("career.submitting")
                          : t("career.submitApplication")}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CareerDetails;
