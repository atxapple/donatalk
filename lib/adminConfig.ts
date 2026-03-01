export const ADMIN_EMAILS = [
  'yunyoungmokk@gmail.com',
  'atxapplellc@gmail.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
