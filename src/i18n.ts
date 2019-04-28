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
      "reset-password": "Reset your password"
    }
  }
} as I18N;
