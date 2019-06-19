export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: "public" | "private";
}
