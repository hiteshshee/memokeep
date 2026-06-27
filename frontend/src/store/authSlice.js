import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAccessToken } from '../api/client.js';

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    setAccessToken(data.accessToken);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    setAccessToken(data.accessToken);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
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
  },
  reducers: {
    clearError: (state) => {
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
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, fulfilled)
      .addCase(register.rejected, rejected)
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
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
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
