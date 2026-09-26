// Type declaration for web-push — package ships without bundled types.
// This avoids resolution issues in CI/build environments where @types/web-push
// may be hoisted incorrectly by npm workspaces.
declare module "web-push" {
  export interface PushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }
  export interface Options {
    TTL?: number;
  }
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer,
    options?: Options
  ): Promise<void>;
}
