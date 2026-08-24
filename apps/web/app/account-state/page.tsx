import { InfoPageShell } from "@/components/info/InfoPageShell";

const COPY: Record<string, { title: string; body: string; canAppeal: boolean }> = {
  suspended: {
    title: "Account suspended",
    body:
      "Your Voeq account has been temporarily suspended while we review activity on it. " +
      "You won't be able to sign in until the review is complete.",
    canAppeal: true,
  },
  banned: {
    title: "Account banned",
    body:
      "This account has been permanently banned for violating our Terms of Service. " +
      "Access to Voeq is no longer available for this account.",
    canAppeal: false,
  },
  forbidden: {
    title: "Access restricted",
    body: "You don't have access to that area. If you think this is a mistake, contact support.",
    canAppeal: true,
  },
};

export default async function AccountStatePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const status = (await searchParams).status ?? "suspended";
  const copy = COPY[status] ?? COPY.suspended;

  return (
    <InfoPageShell title={copy.title}>
      <div className="auth-card">
        <p className="auth-lede">{copy.body}</p>
        {copy.canAppeal && (
          <p className="auth-alt">
            <a href="mailto:support@voeq.ng?subject=Account%20review%20request">
              Contact support to appeal
            </a>
          </p>
        )}
        <p className="auth-alt">
          <a href="/login">Back to sign in</a>
        </p>
      </div>
    </InfoPageShell>
  );
}
