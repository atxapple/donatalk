// types/listener.ts

export type Listener = {
  fullName: string;
  intro: string;
  donation: number;
  email: string;
  isSetUp?: boolean;
  deletedAt?: unknown;
};