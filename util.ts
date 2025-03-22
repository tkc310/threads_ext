export const isSupported = (): boolean => {
  const { PLASMO_PUBLIC_SUPPORTED_ORIGIN } = process.env;
  const origin = location.origin;

  return PLASMO_PUBLIC_SUPPORTED_ORIGIN === origin;
};
