/**
 * Converts an email address to a unqiue, safe email
 * @param email - Valid email address
 */
export const safeEmail = (input: string) => {
  const [user, domain] = input.split('@');
  return `${user.split('+')[0]}@${domain}`.toLowerCase();
};
