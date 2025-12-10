import { useState } from "react";
import { useRoles, useUsersByRole } from "../hooks/useRoles";
import { useSetUserRole } from "../hooks/useUsers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { IconUsers, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { toast } from "sonner";
import type { Role, RoleName } from "../types/rbac";
import type { AdminUser } from "../types";

/**
 * Color mapping for role badges
 */
const roleColorMap: Record<Role["color"], string> = {
  red: "bg-red-500/10 text-red-500 border-red-500/20",
  gray: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  green: "bg-green-500/10 text-green-500 border-green-500/20",
  yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

/**
 * Component to display permissions for a role
 */
function PermissionBadges({ permissions }: { permissions: Role["permissions"] }) {
  const allPermissions: string[] = [];

  if (permissions.user) {
    permissions.user.forEach((action) => {
      allPermissions.push(`user:${action}`);
    });
  }

  if (permissions.session) {
    permissions.session.forEach((action) => {
      allPermissions.push(`session:${action}`);
    });
  }

  if (allPermissions.length === 0) {
    return (
      <span className="text-muted-foreground text-sm italic">
        No administrative permissions
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {allPermissions.map((permission) => (
        <Badge
          key={permission}
          variant="outline"
          className="text-xs font-mono"
        >
          {permission}
        </Badge>
      ))}
    </div>
  );
}

/**
 * User list within a role card
 */
function RoleUserList({ 
  role, 
  onChangeRole 
}: { 
  role: Role; 
  onChangeRole: (user: AdminUser) => void;
}) {
  const { data, isLoading } = useUsersByRole(role.name);
  const users = data?.data ?? [];

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>;
  }

  if (users.length === 0) {
    return <div className="text-sm text-muted-foreground italic">No users with this role</div>;
  }

  return (
    <div className="space-y-2">
      {users.slice(0, 5).map((user) => (
        <div key={user.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0) ?? user.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate max-w-[120px]">{user.name || user.email}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs"
            onClick={() => onChangeRole(user)}
          >
            Change
          </Button>
        </div>
      ))}
      {users.length > 5 && (
        <div className="text-xs text-muted-foreground">
          +{users.length - 5} more users
        </div>
      )}
    </div>
  );
}

/**
 * Card component for displaying a single role
 */
function RoleCard({ 
  role, 
  onChangeRole,
  expanded,
  onToggleExpand,
}: { 
  role: Role; 
  onChangeRole: (user: AdminUser) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <Card data-testid={`role-card-${role.name}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{role.displayName}</CardTitle>
          <Badge className={roleColorMap[role.color]} variant="outline">
            {role.name}
          </Badge>
        </div>
        <CardDescription>{role.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Permissions</h4>
          <PermissionBadges permissions={role.permissions} />
        </div>
        
        {/* Users section */}
        <div className="space-y-2 pt-2 border-t">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <IconUsers className="h-4 w-4" />
            <span>Users with this role</span>
            {expanded ? (
              <IconChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <IconChevronDown className="h-4 w-4 ml-auto" />
            )}
          </button>
          {expanded && <RoleUserList role={role} onChangeRole={onChangeRole} />}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Roles & Permissions Page
 * 
 * Displays all available roles and their associated permissions.
 * Allows viewing users by role and changing user roles.
 */
export function RolesPage() {
  const { roles, roleNames } = useRoles();
  const setUserRole = useSetUserRole();
  
  // State for expanded cards
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  
  // State for change role dialog
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<RoleName>("user");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleChangeRole = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole((user.role as RoleName) || "user");
    setDialogOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser) return;
    
    try {
      await setUserRole.mutateAsync({ userId: selectedUser.id, role: newRole });
      toast.success(`Role updated to ${newRole} for ${selectedUser.name || selectedUser.email}`);
      setDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const toggleExpand = (roleName: string) => {
    setExpandedRoles((prev) => ({ ...prev, [roleName]: !prev[roleName] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">
          Manage role-based access control for your application
        </p>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleCard 
            key={role.name} 
            role={role} 
            onChangeRole={handleChangeRole}
            expanded={expandedRoles[role.name] ?? false}
            onToggleExpand={() => toggleExpand(role.name)}
          />
        ))}
      </div>

      {/* Change Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Select new role</label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as RoleName)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleNames.map((roleName) => (
                  <SelectItem key={roleName} value={roleName}>
                    {roles.find((r) => r.name === roleName)?.displayName ?? roleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRoleChange}
              disabled={setUserRole.isPending || newRole === selectedUser?.role}
            >
              {setUserRole.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission Reference</CardTitle>
          <CardDescription>
            Understanding the available permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">User Permissions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="text-xs bg-muted px-1 rounded">create</code> - Create new users</li>
                <li><code className="text-xs bg-muted px-1 rounded">list</code> - View user list</li>
                <li><code className="text-xs bg-muted px-1 rounded">set-role</code> - Change user roles</li>
                <li><code className="text-xs bg-muted px-1 rounded">ban</code> - Ban/unban users</li>
                <li><code className="text-xs bg-muted px-1 rounded">impersonate</code> - Impersonate users</li>
                <li><code className="text-xs bg-muted px-1 rounded">delete</code> - Delete users</li>
                <li><code className="text-xs bg-muted px-1 rounded">set-password</code> - Reset passwords</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Session Permissions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="text-xs bg-muted px-1 rounded">list</code> - View sessions</li>
                <li><code className="text-xs bg-muted px-1 rounded">revoke</code> - Revoke sessions</li>
                <li><code className="text-xs bg-muted px-1 rounded">delete</code> - Delete sessions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
