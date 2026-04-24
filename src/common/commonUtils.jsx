import { useState, useCallback } from "react";

// create a function to format description limited to n characters
export const formatDescription = (description, wordCount = 3) => {
  if (!description) return "";

  const words = description.trim().split(/\s+/);

  if (words.length <= wordCount) {
    return description;
  }

  return words.slice(0, wordCount).join(" ") + "...";
};

// Get currency symbol based on country
export const getCurrencySymbol = (country) => {
  const currencySymbols = {
    "Saudi Arabia": "SAR",
    "United States": "$",
    "United Arab Emirates": "AED",
    Qatar: "QAR",
    Kuwait: "KWD",
    Oman: "OMR",
    "United Kingdom": "£",
  };
  return currencySymbols[country] || "$";
};
