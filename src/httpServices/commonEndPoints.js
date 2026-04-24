// api/web.js

import { callMiddleWare } from "./webHttpServices";
import { t } from "i18next";

// export const authAdmin = ({
//   method,
//   endpoint,
//   id = "",
//   data = null,
//   params = null,
// }) => authPublicAdminAPI({ method, endpoint, id, data, params });

export const serviceAdmin = ({
  method,
  endpoint,
  id = "",
  data = null,
  params = null,
}) => callMiddleWare({ method, endpoint, id, data, params });
