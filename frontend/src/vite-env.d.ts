/// <reference types="vite/client" />

interface FreighterApiShape {
  getPublicKey: () => Promise<string>;
  isConnected: () => Promise<boolean>;
  signTransaction: (xdr: string, opts?: { networkPassphrase?: string; address?: string }) => Promise<string>;
  getNetwork: () => Promise<{ network: string; networkPassphrase: string } | string>;
}

interface Window {
  freighter?: FreighterApiShape;
  freighterApi?: FreighterApiShape;
  stellar?: {
    freighter?: FreighterApiShape;
  };
  xBullSDK?: unknown;
  albedo?: unknown;
  lobstr?: unknown;
}
