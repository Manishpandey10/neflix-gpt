import { createSlice } from "@reduxjs/toolkit";

const gptSlice = createSlice({
  name: "gpt",
  initialState: {
    showSettings: false,
    movieResults: null,
    movieNames: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    toggleSettingsView: (state) => {
      state.showSettings = !state.showSettings;
    },
    gptSearchStarted: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    gptSearchFailed: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addGptMovieResult: (state, action) => {
      const { movieNames, movieResults } = action.payload;
      state.movieNames = movieNames;
      state.movieResults = movieResults;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  toggleSettingsView,
  addGptMovieResult,
  gptSearchStarted,
  gptSearchFailed,
} = gptSlice.actions;

export default gptSlice.reducer;
