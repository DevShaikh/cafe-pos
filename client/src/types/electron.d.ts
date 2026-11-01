export {};

declare global {
  interface Window {
    cafePosDesktop?: {
      createBackup: () => Promise<{
        canceled: boolean;
        path?: string;
      }>;
      restoreBackup: () => Promise<{
        canceled: boolean;
        path?: string;
      }>;
    };
  }
}
