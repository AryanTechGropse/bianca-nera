// utils/deviceId.js
import { v4 as uuidv4 } from "uuid";
import { t } from "i18next";

export function getDeviceId() {
  let deviceId = localStorage.getItem("bianca_web_deviceId");

  if (!deviceId) {
    deviceId = uuidv4(); // generate new deviceId'
    console.log(deviceId);
    localStorage.setItem("bianca_web_deviceId", deviceId); // persist it
  }

  return deviceId;
}
