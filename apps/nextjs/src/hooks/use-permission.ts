type OrgRole = "org_admin" | "facility_manager" | "staff";

interface Permissions {
  canManageOrg: boolean;
  canConfigureFacility: boolean;
  canInviteStaff: boolean;
  canManageBookings: boolean;
  canViewReports: boolean;
}

export function usePermission(role: OrgRole): Permissions {
  return {
    canManageOrg: role === "org_admin",
    canConfigureFacility: role !== "staff",
    canInviteStaff: role !== "staff",
    canManageBookings: true,
    canViewReports: role !== "staff",
  };
}
