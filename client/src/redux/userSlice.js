import createSlice from '@reduxjs/toolkit';
const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
   
  },
});

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;       