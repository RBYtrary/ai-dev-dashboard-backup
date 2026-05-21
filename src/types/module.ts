export type ModuleStatus = "active" | "inactive" | "deprecated" | "coming-soon";
export type ModuleVisibility = "always" | "feature-flag" | "admin-only" | "hidden";
export type ModuleRuntime = "server" | "nodejs" | "edge" | "client";
export type ModulePermission = "public" | "local-only" | "admin" | "authenticated";
export type ModuleCategory = "core" | "ai" | "registry" | "system" | "creative" | "analysis";

export type Module = {
  id: string;
  name: string;
  route: string;
  icon: string;
  category: ModuleCategory;
  status: ModuleStatus;
  navVisible: boolean;
  description: string;
  permissions: ModulePermission[];
  runtime: ModuleRuntime;
  featureFlags: string[];
  dependencies: string[];
  provider: string | null;
  visibility: ModuleVisibility;
  tags: string[];
};
