"use client";
import React, { useEffect, useState, useRef } from "react";
import Footer from "@/footer/Footer";
import Header from "@/header/Header";
import ProfileSidebar from "@/app/HomeComponents/ProfileSidebar";
import { callMiddleWare } from "@/httpServices/webHttpServices";
import toast from "react-hot-toast";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { t } from "i18next";

const HelpAndSupport = () => {
  const modalRef = useRef(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    countryCode: "",
    subject: "",
    message: "",
    priority: "Low",
  });
  const [submitting, setSubmitting] = useState(false);

  const closeModal = () => {
    if (typeof window !== "undefined" && modalRef.current) {
      const bootstrap = window.bootstrap;
      if (bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalRef.current);
        modal?.hide();
      }
    }
  };

  const getSupport = async () => {
    try {
      setLoading(true);
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "user/getSupportList",
        data: {
          search: "",
          page: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        },
      });
      if (response?.results?.supportRequests) {
        setTickets(response.results.supportRequests);
      }
    } catch (error) {
      toast.error(t("Failed to fetch support tickets"));
    } finally {
      setLoading(false);
    }
  };

  const createSupport = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await callMiddleWare({
        method: "POST",
        endpoint: "user/createSupportTicket",
        data: {
          ...formData,
        },
      });

      if (response?.error === false) {
        toast.success(t("Support ticket created successfully"));
        setFormData({
          fullName: "",
          email: "",
          phoneNumber: "",
          subject: "",
          message: "",
          countryCode: "",
          priority: "Low",
        });
        closeModal();
        getSupport();
      } else {
        toast.error(response?.message || t("Failed to create ticket"));
      }
    } catch (error) {
      toast.error(t("Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    getSupport();
  }, []);

  const language =
    typeof window !== "undefined"
      ? localStorage.getItem("i18nextLng") || "en"
      : "en";

  useEffect(() => {
    const seoTitle =
      language === "ar"
        ? `خدمة العملاء | نحن هنا لمساعدتك – بيانكا نيرا`
        : `Customer Service | We're Here – Bianca Nera`;
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
                      <h2>{t("Help & Support")}</h2>
                      <p>
                        {t("Get Assistance and Find Answers to Your Queries")}
                      </p>
                    </div>
                  </div>

                  <div
                    className="col-md-auto mt-md-0 mt-2 proflebtns d-md-flex align-items-center"
                    dir="ltr"
                  >
                    <a
                      className="WhatsAppbtn me-md-3 px-3 d-flex align-items-center gap-2"
                      href="https://wa.me/96597698498"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src="/assets/img/whatsappIcon.png" alt="WhatsApp" />
                      <span>{t("WHATSAPP")}</span>
                    </a>

                    <button
                      className="authbtns1 px-3 mt-md-0 mt-2"
                      data-bs-toggle="modal"
                      data-bs-target="#needhelp"
                    >
                      {t("NEED HELP")}
                    </button>
                  </div>
                </div>

                <div className="row">
                  {loading ? (
                    <p>{t("Loading...")}</p>
                  ) : tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <div className="col-md-6 mb-4" key={ticket._id}>
                        <div className="helpsupportbox">
                          <div className="helpsupporttop d-flex justify-content-between">
                            <h2>{ticket.subject || t("No Subject")}</h2>
                            <div className="hlpbadge">{ticket.status}</div>
                          </div>
                          <div className="helpsupport_p">{ticket.message}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">
                      {t("No support tickets found")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <div
        className="modal fade needhelpmodal"
        id="needhelp"
        ref={modalRef}
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
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "15px",
                  zIndex: 1,
                }}
              />
              <div className="modalhead text-center mb-4">
                <h2>{t("Add Details")}</h2>
                <p>{t("Get Assistance and Find Answers to Your Queries")}</p>
              </div>

              <form className="authform row mx-0" onSubmit={createSupport}>
                <div className="col-md-6 form-group mb-3">
                  <label>{t("Full Name")}*</label>
                  <input
                    className="form-control"
                    placeholder={t("Enter name")}
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-md-6 form-group mb-3">
                  <label>{t("Email Id")}*</label>
                  <input
                    className="form-control"
                    placeholder={t("Email Id")}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-md-12 form-group mb-3">
                  <label>{t("Phone Number")}*</label>
                  <div dir="ltr">
                    <PhoneInput
                      country="sa"
                      value={formData.phoneNumber}
                      onChange={(phone, countryData) =>
                        setFormData({
                          ...formData,
                          phoneNumber: phone,
                          countryCode: "+" + countryData.dialCode,
                        })
                      }
                      inputProps={{
                        name: "phone",
                        placeholder: t("Enter phone number"),
                      }}
                      containerStyle={{ width: "100%" }}
                      inputStyle={{
                        width: "100%",
                        height: "48px",
                        fontSize: "16px",
                        paddingLeft: "48px",
                        textAlign: "left",
                        direction: "ltr",
                      }}
                      buttonStyle={{
                        borderRadius: "4px 0 0 4px",
                      }}
                      dropdownStyle={{ zIndex: 1050 }}
                      countryCodeEditable={false}
                      enableSearch
                      searchPlaceholder={t("Search countries")}
                    />
                  </div>
                </div>

                <div className="col-md-12 form-group mb-3">
                  <label>{t("Subject")}</label>
                  <input
                    className="form-control"
                    placeholder={t("Subject")}
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-12 form-group mb-4">
                  <label>{t("Message")}</label>
                  <textarea
                    className="form-control h-auto"
                    placeholder={t("Type here...")}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={6}
                    required
                  />
                </div>

                <div className="col-md-12 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="authbtns1"
                    data-bs-dismiss="modal"
                  >
                    {t("CANCEL")}
                  </button>
                  <button
                    type="submit"
                    className="authbtns2"
                    disabled={submitting}
                  >
                    {submitting ? t("Submitting...") : t("SUBMIT")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpAndSupport;
