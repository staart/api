interface Lang {
  [index: string]: any;
}
interface I18N {
  [index: string]: Lang;
}

export default {
  en: {
    emails: {
      "email-verify": "Verify your new email",
      "password-reset": "Reset your password",
      "new-password": "Set a password for your account",
      "unapproved-location": "Login from a new location",
      "unknown-location": "Unknown location"
    }
  }
} as I18N;
