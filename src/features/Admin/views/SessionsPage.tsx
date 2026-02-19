import { useState } from "react"
import {
  IconTrash,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconRefresh,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"

import {
  useUsers,
  useUserSessions,
  useRevokeSession,
  useRevokeAllSessions,
} from "../hooks/useUsers"
import type { AdminUser, UserSession } from "../types"
import { usePermissionsContext } from "@/shared/context/PermissionsContext"

// Parse user agent to determine device type
const getDeviceInfo = (userAgent?: string) => {
  if (!userAgent) return { type: "Unknown", icon: IconDeviceDesktop }
  const ua = userAgent.toLowerCase()
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return { type: "Mobile", icon: IconDeviceMobile }
  }
  return { type: "Desktop", icon: IconDeviceDesktop }
}

export function SessionsPage() {
  // State
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 10
  const [searchValue, setSearchValue] = useState("")
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false)
  const { can } = usePermissionsContext()
  const canRevokeSessions = can("session", "revoke")

  // Queries
  const { data: usersData, isLoading: usersLoading } = useUsers({
    limit: pageSize,
    offset: pageIndex * pageSize,
    searchValue: searchValue || undefined,
    searchField: searchValue ? "name" : undefined,
    searchOperator: searchValue ? "contains" : undefined,
  })

  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useUserSessions(
    selectedUser?.id ?? ""
  )

  // Mutations
  const revokeSession = useRevokeSession()
  const revokeAllSessions = useRevokeAllSessions()

  // Handlers
  const handleRevokeSession = async (session: UserSession) => {
    if (!canRevokeSessions) {
      toast.error("You do not have permission to revoke sessions")
      return
    }

    try {
      await revokeSession.mutateAsync(session.token)
      toast.success("Session revoked successfully")
      refetchSessions()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke session")
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!selectedUser) return
    if (!canRevokeSessions) {
      toast.error("You do not have permission to revoke sessions")
      return
    }

    try {
      await revokeAllSessions.mutateAsync(selectedUser.id)
      toast.success("All sessions revoked successfully")
      setRevokeAllDialogOpen(false)
      refetchSessions()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke sessions")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Sessions</h1>
          <p className="text-muted-foreground">View and manage active user sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Select a user to view their sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search users..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {usersLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : usersData?.data?.length ? (
                usersData.data.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex items-center gap-3 w-full text-left p-2 rounded-lg transition-colors ${
                      selectedUser?.id === user.id ? "bg-primary/10 border border-primary" : "hover:bg-muted border border-transparent"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{user.name}</span>
                      <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No users found</div>
              )}
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {pageIndex + 1} of {Math.ceil((usersData?.total ?? 0) / pageSize) || 1}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                  disabled={pageIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex(pageIndex + 1)}
                  disabled={pageIndex >= Math.ceil((usersData?.total ?? 0) / pageSize) - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {selectedUser ? `Sessions for ${selectedUser.name}` : "Sessions"}
              </CardTitle>
              <CardDescription>
                {selectedUser
                  ? `Active sessions for ${selectedUser.email}`
                  : "Select a user to view their sessions"}
              </CardDescription>
            </div>
            {selectedUser && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchSessions()}>
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                {canRevokeSessions && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRevokeAllDialogOpen(true)}
                    disabled={!sessions?.length}
                  >
                    Revoke All
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="text-center py-12 text-muted-foreground">
                Select a user from the list to view their sessions
              </div>
            ) : sessionsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
            ) : sessions?.length ? (
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Device</th>
                      <th className="text-left p-3 font-medium">IP Address</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Expires</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => {
                      const { type, icon: DeviceIcon } = getDeviceInfo(session.userAgent)
                      const expiresAt = new Date(session.expiresAt)
                      const isExpired = expiresAt < new Date()
                      return (
                        <tr key={session.id} className="border-t">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{type}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-sm">{session.ipAddress || "Unknown"}</span>
                          </td>
                          <td className="p-3 text-sm">
                            {new Date(session.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge variant={isExpired ? "destructive" : "outline"}>
                              {isExpired ? "Expired" : expiresAt.toLocaleString()}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            {canRevokeSessions && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRevokeSession(session)}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No active sessions found for this user
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revoke All Sessions Dialog */}
      <Dialog open={revokeAllDialogOpen} onOpenChange={setRevokeAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke All Sessions</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke all sessions for {selectedUser?.name}? 
              This will log them out from all devices.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeAllSessions}
              disabled={revokeAllSessions.isPending}
            >
              {revokeAllSessions.isPending ? "Revoking..." : "Revoke All Sessions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
