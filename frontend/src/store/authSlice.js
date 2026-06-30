import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAccessToken } from '../api/client.js';

// Step 1: send the signup details — backend emails an OTP, no login yet.
export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    return data; // { requiresVerification, email, message, devOtp? }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

// Step 2: verify the OTP — on success the account is created/verified and logged in.
export const verifyOtp = createAsyncThunk('auth/verifyOtp', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify-otp', payload);
    setAccessToken(data.accessToken);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Verification failed');
  }
});

export const resendOtp = createAsyncThunk('auth/resendOtp', async (email, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data; // { message, devOtp? }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not resend code');
  }
});

// Password reset, step 1: ask the backend to email a reset code.
export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data; // { message, devOtp? }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not send reset code');
  }
});

// Password reset, step 2: verify the code + new password — on success, logged in.
export const resetPassword = createAsyncThunk('auth/resetPassword', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/reset-password', payload);
    setAccessToken(data.accessToken);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Password reset failed');
  }
});

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    setAccessToken(data.accessToken);
    return data.user;
  } catch (err) {
    // Unverified accounts get a 403 telling us to go verify (with a fresh OTP).
    const d = err.response?.data;
    if (d?.requiresVerification) {
      return rejectWithValue({ requiresVerification: true, email: d.email, devOtp: d.devOtp });
    }
    return rejectWithValue(d?.message || 'Login failed');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.patch('/auth/profile', payload);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

export const changePassword = createAsyncThunk('auth/changePassword', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.patch('/auth/password', payload);
    return data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Password change failed');
  }
});

// Try to restore the session on app load using the refresh cookie.
export const loadSession = createAsyncThunk('auth/load', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/refresh');
    setAccessToken(data.accessToken);
    return data.user;
  } catch {
    return rejectWithValue(null);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    status: 'idle', // idle | loading | authenticated | error
    bootstrapped: false, // session restore attempt finished
    error: null,
    awaitingOtp: false, // signup is waiting on the email OTP
    pendingEmail: null,
    devOtp: null, // shown only in dev when email isn't configured
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOtp: (state) => {
      state.awaitingOtp = false;
      state.pendingEmail = null;
      state.devOtp = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.status = 'loading';
      state.error = null;
    };
    const fulfilled = (state, action) => {
      state.status = 'authenticated';
      state.user = action.payload;
    };
    const rejected = (state, action) => {
      state.status = 'error';
      state.error = action.payload;
    };

    builder
      // Step 1: details submitted → awaiting OTP (no user yet)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'idle';
        state.awaitingOtp = true;
        state.pendingEmail = action.payload.email;
        state.devOtp = action.payload.devOtp || null;
      })
      .addCase(register.rejected, rejected)
      // Step 2: OTP verified → logged in
      .addCase(verifyOtp.pending, pending)
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.awaitingOtp = false;
        state.pendingEmail = null;
        state.devOtp = null;
      })
      .addCase(verifyOtp.rejected, rejected)
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.devOtp = action.payload.devOtp || null;
        state.error = null;
      })
      .addCase(resendOtp.rejected, rejected)
      // Login — may bounce to the OTP step if the account isn't verified
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, (state, action) => {
        if (action.payload && action.payload.requiresVerification) {
          state.status = 'idle';
          state.error = null;
          state.awaitingOtp = true;
          state.pendingEmail = action.payload.email;
          state.devOtp = action.payload.devOtp || null;
        } else {
          state.status = 'error';
          state.error = action.payload;
        }
      })
      // Password reset verified → logged straight in
      .addCase(resetPassword.pending, pending)
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.awaitingOtp = false;
        state.pendingEmail = null;
        state.devOtp = null;
      })
      .addCase(resetPassword.rejected, rejected)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(loadSession.rejected, (state) => {
        state.bootstrapped = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.awaitingOtp = false;
        state.pendingEmail = null;
        state.devOtp = null;
      });
  },
});

export const { clearError, resetOtp } = authSlice.actions;
export default authSlice.reducer;
