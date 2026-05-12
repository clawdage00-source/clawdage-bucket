/** Serializable user subset passed from the server layout to the header. */
export type HeaderUser = {
  id: string;
  email: string | undefined;
  /** Shown next to the avatar (OAuth name, metadata, or email local-part). */
  displayName: string;
  avatarUrl?: string | null;
};
