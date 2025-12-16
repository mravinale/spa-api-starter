import { useState, useEffect, useCallback, useRef } from "react";
import {
  useRoles,
  useUsersByRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  usePermissionsGrouped,
  useAssignPermissions,
} from "../hooks/useRoles";
import { useSetUserRole } from "../hooks/useUsers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
import {
  IconUsers,
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconEdit,
  IconTrash,
  IconShield,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { roleColorMap, ROLE_COLORS } from "../types/rbac";
import type { Role, Permission } from "../types/rbac";
import type { AdminUser } from "../types";

/**
 * Component to display permissions for a role
 */
function PermissionBadges({ permissions }: { permissions: Permission[] }) {
  if (!permissions || permissions.length === 0) {
    return (
      <span className="text-muted-foreground text-sm italic">
        No administrative permissions
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {permissions.map((perm) => (
        <Badge
          key={perm.id}
          variant="outline"
          className="text-xs font-mono"
        >
          {perm.resource}:{perm.action}
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
  permissions,
  onChangeRole,
  onEdit,
  onDelete,
  onManagePermissions,
  expanded,
  onToggleExpand,
}: { 
  role: Role;
  permissions: Permission[];
  onChangeRole: (user: AdminUser) => void;
  onEdit: () => void;
  onDelete: () => void;
  onManagePermissions: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <Card data-testid={`role-card-${role.name}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{role.displayName}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={roleColorMap[role.color] || roleColorMap.gray} variant="outline">
              {role.name}
            </Badge>
            {role.isSystem && (
              <Badge variant="secondary" className="text-xs">System</Badge>
            )}
          </div>
        </div>
        <CardDescription>{role.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Permissions</h4>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onManagePermissions}>
              <IconShield className="h-3 w-3 mr-1" />
              Manage
            </Button>
          </div>
          <PermissionBadges permissions={permissions} />
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

        {/* Actions */}
        {!role.isSystem && (
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
              <IconEdit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Roles & Permissions Page
 * 
 * Displays all available roles and their associated permissions.
 * Allows CRUD operations on roles and permission management.
 */
export function RolesPage() {
  const { data: roles = [], isLoading } = useRoles();
  const { data: permissionsGrouped = {} } = usePermissionsGrouped();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignPermissions = useAssignPermissions();
  const setUserRole = useSetUserRole();
  
  // State for expanded cards
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  
  // State for role permissions (fetched individually)
  const [rolePermissions, setRolePermissions] = useState<Record<string, Permission[]>>({});
  
  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  
  // State for selected items
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    color: "gray",
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // Track which roles have been fetched to avoid infinite loops
  const fetchedRolesRef = useRef<Set<string>>(new Set());

  // Fetch role permissions when needed
  const fetchRolePermissions = useCallback(async (roleId: string, force = false) => {
    // Skip if already fetched (unless forced)
    if (!force && fetchedRolesRef.current.has(roleId)) {
      return;
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/rbac/roles/${roleId}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const result = await response.json();
        setRolePermissions((prev) => ({ ...prev, [roleId]: result.data.permissions }));
        fetchedRolesRef.current.add(roleId);
      }
    } catch (error) {
      console.error("Failed to fetch role permissions", error);
    }
  }, []);

  // Fetch permissions for all roles when roles change
  useEffect(() => {
    roles.forEach((role) => {
      fetchRolePermissions(role.id);
    });
  }, [roles, fetchRolePermissions]);

  const handleCreateRole = async () => {
    try {
      await createRole.mutateAsync({
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        color: formData.color,
      });
      toast.success("Role created successfully");
      setCreateDialogOpen(false);
      setFormData({ name: "", displayName: "", description: "", color: "gray" });
    } catch (error) {
      toast.error("Failed to create role");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    try {
      await updateRole.mutateAsync({
        id: selectedRole.id,
        dto: {
          displayName: formData.displayName,
          description: formData.description || undefined,
          color: formData.color,
        },
      });
      toast.success("Role updated successfully");
      setEditDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await deleteRole.mutateAsync(selectedRole.id);
      toast.success("Role deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  const handleAssignPermissions = async () => {
    if (!selectedRole) return;
    try {
      await assignPermissions.mutateAsync({
        roleId: selectedRole.id,
        dto: { permissionIds: selectedPermissionIds },
      });
      // Force refresh permissions for this role
      fetchRolePermissions(selectedRole.id, true);
      toast.success("Permissions updated successfully");
      setPermissionsDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast.error("Failed to update permissions");
    }
  };

  const handleChangeUserRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await setUserRole.mutateAsync({ userId: selectedUser.id, role: newRole });
      toast.success(`Role updated for ${selectedUser.name || selectedUser.email}`);
      setChangeRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole("");
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
      color: role.color,
    });
    setEditDialogOpen(true);
  };

  const openPermissionsDialog = (role: Role) => {
    setSelectedRole(role);
    const perms = rolePermissions[role.id] || [];
    setSelectedPermissionIds(perms.map((p) => p.id));
    setPermissionsDialogOpen(true);
  };

  const openChangeRoleDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role || "user");
    setChangeRoleDialogOpen(true);
  };

  const toggleExpand = (roleName: string) => {
    setExpandedRoles((prev) => ({ ...prev, [roleName]: !prev[roleName] }));
  };

  if (isLoading) {
    return <div className="p-4">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage role-based access control for your application
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <IconPlus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleCard 
            key={role.id} 
            role={role}
            permissions={rolePermissions[role.id] || []}
            onChangeRole={openChangeRoleDialog}
            onEdit={() => openEditDialog(role)}
            onDelete={() => { setSelectedRole(role); setDeleteDialogOpen(true); }}
            onManagePermissions={() => openPermissionsDialog(role)}
            expanded={expandedRoles[role.name] ?? false}
            onToggleExpand={() => toggleExpand(role.name)}
          />
        ))}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role with custom permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (identifier)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., editor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g., Editor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Role description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRole} disabled={createRole.isPending || !formData.name || !formData.displayName}>
              {createRole.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details (name cannot be changed)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-displayName">Display Name</Label>
              <Input
                id="edit-displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole} disabled={updateRole.isPending}>
              {updateRole.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.displayName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRole} disabled={deleteRole.isPending}>
              {deleteRole.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Select permissions for {selectedRole?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {Object.entries(permissionsGrouped).map(([resource, perms]) => (
              <div key={resource} className="space-y-2">
                <h4 className="font-medium capitalize">{resource}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {perms.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPermissionIds.includes(perm.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissionIds([...selectedPermissionIds, perm.id]);
                          } else {
                            setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== perm.id));
                          }
                        }}
                      />
                      <label htmlFor={perm.id} className="text-sm">
                        {perm.action}
                        {perm.description && (
                          <span className="text-muted-foreground ml-1">- {perm.description}</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignPermissions} disabled={assignPermissions.isPending}>
              {assignPermissions.isPending ? "Saving..." : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change User Role Dialog */}
      <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Select new role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleChangeUserRole}
              disabled={setUserRole.isPending || newRole === selectedUser?.role}
            >
              {setUserRole.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
