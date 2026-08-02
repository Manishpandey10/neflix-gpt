import { useDispatch, useSelector } from "react-redux";
import lang from "../utils/languageConstants";
import {
  ERAS,
  GENRES,
  MAX_PREFERENCES_PER_GROUP,
  MOODS,
} from "../utils/constants";
import { clearPreferences, togglePreference } from "../utils/preferencesSlice";

const Chip = ({ label, isSelected, isDisabled, tone, onClick }) => {
  const selectedTone =
    tone === "avoid"
      ? "bg-amber-500 border-amber-400 text-black"
      : "bg-red-600 border-red-500 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={isSelected}
      className={
        "px-3 py-1.5 text-sm rounded-full border transition-colors duration-150 " +
        (isSelected
          ? selectedTone
          : "bg-white bg-opacity-5 border-white border-opacity-20 text-gray-200 hover:bg-opacity-15 hover:border-opacity-40") +
        (isDisabled && !isSelected ? " opacity-30 cursor-not-allowed" : "")
      }
    >
      {label}
    </button>
  );
};

const ChipRow = ({ label, group, options, tone }) => {
  const dispatch = useDispatch();
  const selected = useSelector((store) => store.preferences[group]);
  const atLimit = selected.length >= MAX_PREFERENCES_PER_GROUP;

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
          {label}
        </span>
        {atLimit && (
          <span className="text-[11px] text-gray-500">
            max {MAX_PREFERENCES_PER_GROUP}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            tone={tone}
            isSelected={selected.includes(option)}
            isDisabled={atLimit && !selected.includes(option)}
            onClick={() => dispatch(togglePreference({ group, value: option }))}
          />
        ))}
      </div>
    </div>
  );
};

const PreferenceChips = () => {
  const dispatch = useDispatch();
  const langKey = useSelector((store) => store.config.lang);
  const preferences = useSelector((store) => store.preferences);

  const selectedCount =
    preferences.genres.length +
    preferences.moods.length +
    preferences.eras.length +
    preferences.avoid.length;

  return (
    <div className="w-full max-w-2xl mt-3 mx-auto">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
          {lang[langKey].refineTaste}
          {selectedCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-600 text-white font-bold shadow-md">
              {selectedCount} Selected
            </span>
          )}
        </div>

        {selectedCount > 0 && (
          <button
            type="button"
            onClick={() => dispatch(clearPreferences())}
            className="text-xs text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
          >
            {lang[langKey].clearAll}
          </button>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-black bg-opacity-60 backdrop-blur-md border border-white border-opacity-10 shadow-xl">
        <ChipRow
          label={lang[langKey].genreLabel}
          group="genres"
          options={GENRES}
        />
        <ChipRow
          label={lang[langKey].moodLabel}
          group="moods"
          options={MOODS}
        />
        <ChipRow label={lang[langKey].eraLabel} group="eras" options={ERAS} />
        <ChipRow
          label={lang[langKey].avoidLabel}
          group="avoid"
          options={GENRES}
          tone="avoid"
        />
      </div>
    </div>
  );
};

export default PreferenceChips;
