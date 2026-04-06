export type SystemPageConfig = {
  name: string;
  template: string;
};

export const SYSTEM_PAGES: Record<string, SystemPageConfig> = {
  home: { name: "Home Page", template: "home" },
  login: { name: "User Login", template: "login" },
  register: { name: "User Register", template: "register" },
};
