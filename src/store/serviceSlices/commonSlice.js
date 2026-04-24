import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { callMiddleWare } from "../../httpServices/webHttpServices";
import { addAsyncThunkHandlers } from "../reduxHelpers";
import { authAdmin } from "../../httpServices/commonEndPoints";
import toast from "react-hot-toast";
import { set } from "react-hook-form";
import { t } from "i18next";

// ─── THUNKS ────────────────────────────────────────────────
export const getAddress = createAsyncThunk(
  "common/getAddress",
  async (_, thunkAPI) => {
    try {
      const response = await callMiddleWare({
        method: "get",
        endpoint: "user/getAddress",
      });
      return response?.results || [];
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  },
);

export const getProfile = createAsyncThunk(
  "common/getProfile",
  async (_, thunkAPI) => {
    try {
      const response = await callMiddleWare({
        method: "get",
        endpoint: "user/getMyProfile",
      });
      return response?.results?.user || null;
    } catch (error) {
      const errorMsg = error.response?.message || error.message;
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  },
);

// export const getCart = createAsyncThunk("common/getCart", isBuyNow, async (_, thunkAPI) => {
//   try {
//     const response = await callMiddleWare({
//       method: "get",
//       endpoint: "products/getMyCart",
//       queryParams: { isBuyNow: isBuyNow },
//     });
//     return response?.results || [];
//   } catch (error) {
//     const errorMsg = error.response?.data?.message || error.message;
//     toast.error(errorMsg);
//     return thunkAPI.rejectWithValue(errorMsg);
//   }
// });

export const getCart = createAsyncThunk(
  "common/getCart",
  async (isBuyNow = false, thunkAPI) => {
    try {
      const response = await callMiddleWare({
        method: "get",
        endpoint: isBuyNow
          ? `products/getMyCart?isBuyNow=${isBuyNow}`
          : "products/getMyCart",
        // queryParams: { isBuyNow: true }, // Hardcoded true for buy now
      });
      return response?.results || [];
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  },
);

export const userLogin = createAsyncThunk(
  "auth/userLogin",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await callMiddleWare({
        method: "PUT",
        endpoint: "auth/userLogin",
        data,
      });

      if (res?.error) {
        const errorMsg = res?.message || "Login failed";
        toast.error(errorMsg);
        return rejectWithValue(errorMsg);
      }

      toast.success(t("Login successful!"));
      return res;
    } catch (error) {
      const errorMsg =
        error.response?.message || error.message || "Login error";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  },
);
export const sociaLogin = createAsyncThunk(
  "auth/SSOLogin",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await callMiddleWare({
        method: "PUT",
        endpoint: "auth/SSOLogin",
        data,
      });

      if (res?.error) {
        const errorMsg = res?.message || "Login failed";
        toast.error(errorMsg);
        return rejectWithValue(errorMsg);
      }

      toast.success("Login successful!");
      return res;
    } catch (error) {
      const errorMsg =
        error.response?.message || error.message || "Login error";
      toast.error(errorMsg);
      return rejectWithValue(errorMsg);
    }
  },
);
export const wishCart = createAsyncThunk(
  "common/wishCart",
  async (data, thunkAPI) => {
    try {
      const response = await callMiddleWare({
        method: "post",
        endpoint: "products/addProductInWishList",
        data,
      });
      return response?.results || [];
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  },
);

export const wishListCart = createAsyncThunk(
  "common/wishListCart",
  async (data, thunkAPI) => {
    try {
      const response = await callMiddleWare({
        method: "patch",
        endpoint: "products/getMyWishList",
        data,
      });
      return response?.results || [];
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  },
);

export const giftCardsLists = createAsyncThunk(
  "common/giftCards",
  async (data, thunkAPI) => {
    try {
      const response = await callMiddleWare({
        method: "patch",
        endpoint: "products/getGiftCards",
        data,
      });
      return response?.results || [];
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  },
);

export const addCart = createAsyncThunk(
  "common/addCart",
  async (data, thunkAPI) => {
    try {
      const response = await callMiddleWare({
        method: "post",
        endpoint: "products/addToCart",
        data,
      });

      if (response?.error) {
        const errorMsg = response?.message || "Failed to add to cart";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      toast.success(response?.message || "Added to cart successfully");
      return response?.results || [];
    } catch (error) {
      const errorMsg = error.response?.message || error.message;
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  },
);

export const getCounts = createAsyncThunk(
  "common/getCounts",
  async (_, thunkAPI) => {
    try {
      const response = await callMiddleWare({
        method: "PATCH",
        endpoint: "products/getCounts",
      });
      return response?.results || null;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(errorMsg);
    }
  },
);

// ─── INITIAL STATE ─────────────────────────────────────────

const initialState = {
  isLoading: false,
  isError: false,
  error: null,
  address: null,
  profile: null,
  isUserLoggedIn: false,
  wishListState: 0,
  wishState: [],
  orderDetails: [],
  cartState: 0, // Fixed: removed duplicate property
  giftCards: [],
  screenState: "Cart",
  appliedCoupon: null,
  currency: "USD",
  wallet: 0,
  walletUsed: 0,
  counts: {},
  chatId: null,
  shippingCost: 0,
  cartData: null,
  isAddCartLoading: false,
};

// ─── SLICE ─────────────────────────────────────────────────

const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    logoutProfile: (state) => {
      state.profile = null;
      state.isUserLoggedIn = false;
      state.error = null;
      state.isError = false;
      state.wishListState = 0;
      state.wishState = [];
      state.address = null;
      state.cartState = 0;
      state.giftCards = [];
      state.orderDetails = [];
      state.screenState = "Cart";
      state.appliedCoupon = null;
      state.currency = "USD";
      state.wallet = 0;
      state.walletUsed = 0;
      state.counts = {};
      state.chatId = null;
      state.cartData = null;
      state.shippingCost = 0;
      state.isAddCartLoading = false;
    },
    setScreenState: (state, action) => {
      state.screenState = action.payload;
    },
    setAppliedCoupon: (state, action) => {
      state.appliedCoupon = action.payload; // set or clear applied coupon
    },
    setOrderDetails: (state, action) => {
      state.orderDetails = action.payload;
    },
    setCurrency: (state, action) => {
      state.currency = action.payload; // set or clear applied coupon
    },
    setUserAuthentication: (state, action) => {
      state.isUserLoggedIn = action.payload;
    },
    setWalletUsed: (state, action) => {
      state.walletUsed = action.payload;
    },
    setCartData: (state, action) => {
      state.cartData = action.payload;
    },
    setShippingCost: (state, action) => {
      state.shippingCost = action.payload?.shippingCost || 0;
    },
    setIsCartAddLoading: (state, action) => {
      state.isAddCartLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    addAsyncThunkHandlers(builder, getAddress, "address");
    addAsyncThunkHandlers(builder, wishCart, "wishListState");
    addAsyncThunkHandlers(builder, wishListCart, "wishState");
    addAsyncThunkHandlers(builder, giftCardsLists, "giftCards");
    addAsyncThunkHandlers(builder, getCart, "cartState", (state, action) => {
      state.cartState = action.payload;
      state.cartData = action.payload;
      state.shippingCost = action.payload?.shippingCost || 0;
    });
    addAsyncThunkHandlers(builder, getProfile, "profile");
    addAsyncThunkHandlers(builder, userLogin, "profile", (state, action) => {
      state.profile = action.payload;
      state.isUserLoggedIn = true;
    });
    addAsyncThunkHandlers(builder, addCart, "cartState", (state, action) => {
      state.cartState = action.payload;
      state.chatId = action.payload?.chatId;
      // state.isUserLoggedIn = true;
    });
    addAsyncThunkHandlers(builder, getCounts, "counts", (state, action) => {
      state.counts = action.payload || {};
    });
  },
});

// ─── EXPORTS ───────────────────────────────────────────────

export const {
  logoutProfile,
  setScreenState,
  setAppliedCoupon,
  setOrderDetails,
  setUserAuthentication,
  setCurrency,
  setWalletUsed,
  setCartData,
  setShippingCost,
  setIsCartAddLoading,
} = commonSlice.actions;
export default commonSlice.reducer;
