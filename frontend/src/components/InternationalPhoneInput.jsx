import PhoneInputModule from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./InternationalPhoneInput.css";

const PhoneInput =
  PhoneInputModule.default ?? PhoneInputModule;

export default function InternationalPhoneInput({
  value = "",
  onChange,
  onBlur,
  error,
  disabled = false,
}) {
  return (
    <div className="international-phone-field">
      <label className="form-label" htmlFor="phone">
        Phone number
      </label>

      <PhoneInput
        country="tz"
        value={value.replace(/^\+/, "")}
        onChange={(number) => {
          onChange(number ? `+${number}` : "");
        }}
        onBlur={onBlur}
        enableSearch={true}
        searchPlaceholder="Search country..."
        searchNotFound="No country found"
        countryCodeEditable={false}
        disableSearchIcon={false}
        preferredCountries={[
          "tz",
          "ke",
          "ug",
          "rw",
          "bi",
          "om",
          "ae",
        ]}
        disabled={disabled}
        containerClass="khamiar-phone-container"
        inputClass={
          "khamiar-phone-input" +
          (error ? " is-invalid" : "")
        }
        buttonClass="khamiar-phone-button"
        dropdownClass="khamiar-phone-dropdown"
        inputProps={{
          id: "phone",
          name: "phone",
          autoComplete: "tel",
          required: true,
          "aria-invalid": Boolean(error),
          "aria-describedby": error
            ? "phone-error"
            : undefined,
        }}
      />

      {error && (
        <div
          id="phone-error"
          className="invalid-feedback d-block"
        >
          {error}
        </div>
      )}
    </div>
  );
}
