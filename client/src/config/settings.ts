type ClientSettings = {
  apiBaseUrl: string;
  httpTimeoutMs: number;
};

const defaultSettings: ClientSettings = {
  apiBaseUrl: '/api',
  httpTimeoutMs: 60000,
};

export const clientSettings: ClientSettings = Object.freeze(defaultSettings);
