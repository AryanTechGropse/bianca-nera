import { t } from "i18next";
// utils/reduxHelpers.js
export const addAsyncThunkHandlers = (
  builder,
  thunk,
  stateKey,
  onFulfilled,
) => {
  builder
    .addCase(thunk.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
      state.error = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state.isLoading = false;
      if (onFulfilled) {
        onFulfilled(state, action); // use custom logic if provided
      } else {
        state[stateKey] = action.payload;
      }
    })
    .addCase(thunk.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.error = action.payload || action.error.message;
    });
};
