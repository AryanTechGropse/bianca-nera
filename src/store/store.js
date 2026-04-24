// store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import commonSlice from "./serviceSlices/commonSlice";
import { t } from "i18next";

// Combine reducers
const rootReducer = combineReducers({
  commonSlice: commonSlice,
});

// Redux Persist config
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["commonSlice"], // ✅ persist only the slices you want (e.g. login state)
};

// Apply persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // needed for redux-persist
    }),
});

// Persistor
export const persistor = persistStore(store);
