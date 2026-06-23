import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";

function normalizeInternationalPrefix(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed;
}

function parseCandidate(value: string, countryCode: string, dialCode: string): PhoneNumber | undefined {
  const normalized = normalizeInternationalPrefix(value);
  const digits = normalized.replace(/\D/g, "");
  const dialDigits = dialCode.replace(/\D/g, "");
  const country = countryCode.toUpperCase() as CountryCode;

  if (normalized.startsWith("+")) {
    return parsePhoneNumberFromString(normalized);
  }

  if (digits.startsWith(dialDigits)) {
    const international = parsePhoneNumberFromString(`+${digits}`);
    if (international?.isValid()) return international;
  }

  return parsePhoneNumberFromString(normalized, country);
}

export function formatPhoneNumberAsYouType(value: string, countryCode: string) {
  const normalized = normalizeInternationalPrefix(value);
  const formatter = new AsYouType(countryCode.toUpperCase() as CountryCode);
  return formatter.input(normalized);
}

export function normalizePhoneNumber(value: string, countryCode: string, dialCode: string) {
  const phoneNumber = parseCandidate(value, countryCode, dialCode);
  if (!phoneNumber?.isValid()) return null;

  return {
    e164: phoneNumber.number,
    international: phoneNumber.formatInternational(),
    national: phoneNumber.formatNational(),
    country: phoneNumber.country,
  };
}
