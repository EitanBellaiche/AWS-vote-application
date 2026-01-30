const region = import.meta.env.VITE_COGNITO_REGION;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;

export const oidcConfig = {
  authority: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "openid email",
  // שומר סשן ב-localStorage כדי שלא תצטרך להתחבר כל רענון
  userStore: new (await import("oidc-client-ts")).WebStorageStateStore({ store: window.localStorage }),
};
