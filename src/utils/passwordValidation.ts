export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: number;
}

export function validateMasterPassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength = 0;

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long');
  } else {
    strength += 20;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    strength += 20;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    strength += 20;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    strength += 20;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    strength += 20;
  }

  if (password.length >= 16) strength += 10;
  if (password.length >= 20) strength += 10;

  const uniqueChars = new Set(password).size;
  if (uniqueChars / password.length > 0.7) strength += 10;

  return {
    valid: errors.length === 0,
    errors,
    strength: Math.min(100, strength),
  };
}
