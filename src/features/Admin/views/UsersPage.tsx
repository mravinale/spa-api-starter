import { useState, useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import {
  IconDotsVertical,
  IconBan,
  IconCheck,
  IconKey,
  IconShield,
  IconTrash,
  IconUserScan,
  IconPlus,
  IconEdit,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { ServerDataTable } from "@/shared/components/ui/server-data-table"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useBanUser,
  useUnbanUser,
  useSetUserRole,
  useSetUserPassword,
  useRemoveUser,
  useImpersonateUser,
} from "../hooks/useUsers"
import { useAuth } from "@/shared/context/AuthContext"
import type { AdminUser, UserFilterParams } from "../types"

export function UsersPage() {
  // Pagination and filter state
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [searchValue, setSearchValue] = useState("")
  // Sorting state - prepared for future use
  const [sortBy] = useState<string | undefined>()
  const [sortDirection] = useState<"asc" | "desc" | undefined>()

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // Form states
  const [newUserData, setNewUserData] = useState({ name: "", email: "", password: "", role: "user" })
  const [editUserData, setEditUserData] = useState({ name: "" })
  const [banReason, setBanReason] = useState("")
  const [newRole, setNewRole] = useState("user")
  const [newPassword, setNewPassword] = useState("")

  // Build query params
  const queryParams: UserFilterParams = useMemo(() => ({
    limit: pageSize,
    offset: pageIndex * pageSize,
    sortBy,
    sortDirection,
    searchValue: searchValue || undefined,
    searchField: searchValue ? "name" : undefined,
    searchOperator: searchValue ? "contains" : undefined,
  }), [pageSize, pageIndex, sortBy, sortDirection, searchValue])

  // Auth context
  const { user: currentUser, refreshSession } = useAuth()

  // Queries and mutations
  const { data, isLoading } = useUsers(queryParams)
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const banUser = useBanUser()
  const unbanUser = useUnbanUser()
  const setUserRole = useSetUserRole()
  const setUserPassword = useSetUserPassword()
  const removeUser = useRemoveUser()
  const impersonateUser = useImpersonateUser()

  // Handlers
  const handleCreateUser = async () => {
    try {
      await createUser.mutateAsync({
        name: newUserData.name,
        email: newUserData.email,
        password: newUserData.password,
        role: newUserData.role,
      })
      toast.success("User created successfully")
      setCreateDialogOpen(false)
      setNewUserData({ name: "", email: "", password: "", role: "user" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user")
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    try {
      await updateUser.mutateAsync({
        userId: selectedUser.id,
        data: { name: editUserData.name },
      })
      toast.success("User updated successfully")
      setEditDialogOpen(false)
      setEditUserData({ name: "" })
      setSelectedUser(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser) return
    try {
      await banUser.mutateAsync({ userId: selectedUser.id, banReason })
      toast.success("User banned successfully")
      setBanDialogOpen(false)
      setBanReason("")
      setSelectedUser(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to ban user")
    }
  }

  const handleUnbanUser = async (user: AdminUser) => {
    try {
      await unbanUser.mutateAsync(user.id)
      toast.success("User unbanned successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unban user")
    }
  }

  const handleSetRole = async () => {
    if (!selectedUser) return
    try {
      await setUserRole.mutateAsync({ userId: selectedUser.id, role: newRole })
      toast.success("Role updated successfully")
      setRoleDialogOpen(false)
      setNewRole("user")
      setSelectedUser(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role")
    }
  }

  const handleSetPassword = async () => {
    if (!selectedUser) return
    try {
      await setUserPassword.mutateAsync({ userId: selectedUser.id, newPassword })
      toast.success("Password updated successfully")
      setPasswordDialogOpen(false)
      setNewPassword("")
      setSelectedUser(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password")
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    try {
      await removeUser.mutateAsync(selectedUser.id)
      toast.success("User deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    }
  }

  const handleImpersonateUser = async (user: AdminUser) => {
    // Don't allow impersonating yourself
    if (user.id === currentUser?.id) {
      toast.error("You cannot impersonate yourself")
      return
    }
    try {
      await impersonateUser.mutateAsync(user.id)
      await refreshSession()
      toast.success(`Now impersonating ${user.name}`)
      window.location.href = "/" // Redirect to dashboard
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to impersonate user")
    }
  }

  // Table columns
  const columns: ColumnDef<AdminUser>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role || "user"
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role}
          </Badge>
        )
      },
    },
    {
      accessorKey: "emailVerified",
      header: "Email Verified",
      cell: ({ row }) => (
        <Badge variant={row.original.emailVerified ? "default" : "outline"}>
          {row.original.emailVerified ? "Verified" : "Pending"}
        </Badge>
      ),
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original
        if (user.banned) {
          return (
            <Badge variant="destructive" className="gap-1">
              <IconBan className="h-3 w-3" />
              Banned
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <IconCheck className="h-3 w-3" />
            Active
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)
        return date.toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <IconDotsVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user)
                  setEditUserData({ name: user.name || "" })
                  setEditDialogOpen(true)
                }}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user)
                  setNewRole(user.role || "user")
                  setRoleDialogOpen(true)
                }}
              >
                <IconShield className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user)
                  setPasswordDialogOpen(true)
                }}
              >
                <IconKey className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleImpersonateUser(user)}
                disabled={user.id === currentUser?.id}
              >
                <IconUserScan className="mr-2 h-4 w-4" />
                Impersonate User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.banned ? (
                <DropdownMenuItem onClick={() => handleUnbanUser(user)}>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Unban User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUser(user)
                    setBanDialogOpen(true)
                  }}
                >
                  <IconBan className="mr-2 h-4 w-4" />
                  Ban User
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setSelectedUser(user)
                  setDeleteDialogOpen(true)
                }}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
      </div>

      <ServerDataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        pageSize={pageSize}
        pageIndex={pageIndex}
        isLoading={isLoading}
        searchPlaceholder="Search users..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPageIndex(0)
        }}
        toolbar={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the system.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUserData.role}
                onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createUser.isPending}>
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information for {selectedUser?.email}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={updateUser.isPending}>
              {updateUser.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban {selectedUser?.name} from accessing the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="banReason">Reason (optional)</Label>
              <Input
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for ban..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanUser} disabled={banUser.isPending}>
              {banUser.isPending ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newRole">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetRole} disabled={setUserRole.isPending}>
              {setUserRole.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPassword} disabled={setUserPassword.isPending}>
              {setUserPassword.isPending ? "Updating..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={removeUser.isPending}>
              {removeUser.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
