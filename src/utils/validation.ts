/**
 * Validation utilities matching backend rules in HasRegistrationRules trait.
 * Username: min:3, max:20, regex:/^[a-zA-Z0-9_]+$/
 * Email: required, valid email format
 * Password: min:8
 */

export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 8;

export function isValidUsername(value: string): boolean {
  return (
    value.length >= USERNAME_MIN_LENGTH &&
    value.length <= USERNAME_MAX_LENGTH &&
    USERNAME_REGEX.test(value)
  );
}

export function isValidEmail(value: string): boolean {
  return value.length > 0 && EMAIL_REGEX.test(value);
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}

export const validationHints = {
  username: `${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters, letters, numbers, underscore only`,
  email: 'Enter a valid email',
  password: `At least ${PASSWORD_MIN_LENGTH} characters`,
  passwordMismatch: 'Passwords do not match',
};
