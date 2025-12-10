import { useState } from "react"
import {
  IconDotsVertical,
  IconPlus,
  IconTrash,
  IconEdit,
  IconUsers,
  IconMail,
} from "@tabler/icons-react"
import { toast } from "sonner"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"

import {
  useOrganizations,
  useOrganizationMembers,
  useOrganizationInvitations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
  useCancelInvitation,
  useCheckSlug,
} from "../hooks/useOrganizations"

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: Date
  metadata?: unknown
}

interface Member {
  id: string
  userId: string
  role: string
  user?: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
}

// Helper to extract members array from response
const getMembersArray = (data: unknown): Member[] => {
  if (!data) return []
  if (Array.isArray(data)) return data as Member[]
  if (typeof data === "object" && "members" in data) {
    return (data as { members: Member[] }).members
  }
  return []
}

// Helper to extract invitations array from response
const getInvitationsArray = (data: unknown): Invitation[] => {
  if (!data) return []
  if (Array.isArray(data)) return data as Invitation[]
  if (typeof data === "object" && "invitations" in data) {
    return (data as { invitations: Invitation[] }).invitations
  }
  return []
}

export function OrganizationsPage() {
  // State
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  // Form state
  const [newOrgData, setNewOrgData] = useState({ name: "", slug: "" })
  const [editOrgData, setEditOrgData] = useState({ name: "", slug: "" })
  const [inviteData, setInviteData] = useState({ email: "", role: "member" })
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")

  // Queries
  const { data: organizations, isLoading: orgsLoading } = useOrganizations()
  const { data: membersData, isLoading: membersLoading } = useOrganizationMembers(selectedOrg?.id ?? "")
  const { data: invitationsData, isLoading: invitationsLoading } = useOrganizationInvitations(selectedOrg?.id ?? "")

  // Extract arrays from response data
  const members = getMembersArray(membersData)
  const invitations = getInvitationsArray(invitationsData)

  // Mutations
  const createOrg = useCreateOrganization()
  const updateOrg = useUpdateOrganization()
  const deleteOrg = useDeleteOrganization()
  const inviteMember = useInviteMember()
  const removeMember = useRemoveMember()
  const updateMemberRole = useUpdateMemberRole()
  const cancelInvitation = useCancelInvitation()
  const checkSlug = useCheckSlug()

  // Check slug availability with debounce
  const handleSlugChange = async (slug: string) => {
    const formattedSlug = slug.toLowerCase().replace(/\s+/g, "-")
    setNewOrgData({ ...newOrgData, slug: formattedSlug })
    
    if (formattedSlug.length < 3) {
      setSlugStatus("idle")
      return
    }

    setSlugStatus("checking")
    try {
      const result = await checkSlug.mutateAsync(formattedSlug)
      // result contains { status: boolean } where true means available
      setSlugStatus(result?.status ? "available" : "taken")
    } catch {
      setSlugStatus("idle")
    }
  }

  // Handlers
  const handleCreateOrg = async () => {
    try {
      await createOrg.mutateAsync({
        name: newOrgData.name,
        slug: newOrgData.slug.toLowerCase().replace(/\s+/g, "-"),
      })
      toast.success("Organization created successfully")
      setCreateDialogOpen(false)
      setNewOrgData({ name: "", slug: "" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create organization")
    }
  }

  const handleUpdateOrg = async () => {
    if (!selectedOrg) return
    try {
      await updateOrg.mutateAsync({
        organizationId: selectedOrg.id,
        data: { name: editOrgData.name, slug: editOrgData.slug },
      })
      toast.success("Organization updated successfully")
      setEditDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update organization")
    }
  }

  const handleDeleteOrg = async () => {
    if (!selectedOrg) return
    try {
      await deleteOrg.mutateAsync(selectedOrg.id)
      toast.success("Organization deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedOrg(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete organization")
    }
  }

  const handleInviteMember = async () => {
    if (!selectedOrg) return
    try {
      await inviteMember.mutateAsync({
        organizationId: selectedOrg.id,
        email: inviteData.email,
        role: inviteData.role,
      })
      toast.success("Invitation sent successfully")
      setInviteDialogOpen(false)
      setInviteData({ email: "", role: "member" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invitation")
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedOrg || !selectedMember) return
    try {
      await removeMember.mutateAsync({
        organizationId: selectedOrg.id,
        memberIdOrEmail: selectedMember.id,
      })
      toast.success("Member removed successfully")
      setRemoveMemberDialogOpen(false)
      setSelectedMember(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member")
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!selectedOrg) return
    try {
      await updateMemberRole.mutateAsync({
        organizationId: selectedOrg.id,
        memberId,
        role: newRole,
      })
      toast.success("Role updated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role")
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!selectedOrg) return
    try {
      await cancelInvitation.mutateAsync({ invitationId, organizationId: selectedOrg.id })
      toast.success("Invitation cancelled")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel invitation")
    }
  }

  const openEditDialog = (org: Organization) => {
    setEditOrgData({ name: org.name, slug: org.slug })
    setEditDialogOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Manage organizations and their members</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Select an organization to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {orgsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : organizations?.length ? (
                organizations.map((org: Organization) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${
                      selectedOrg?.id === org.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted border border-transparent"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={org.logo ?? undefined} alt={org.name} />
                      <AvatarFallback>{org.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{org.name}</span>
                      <span className="text-sm text-muted-foreground truncate">/{org.slug}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(org)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedOrg(org)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No organizations yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Organization Details */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {selectedOrg ? selectedOrg.name : "Organization Details"}
              </CardTitle>
              <CardDescription>
                {selectedOrg ? `Manage members and invitations` : "Select an organization"}
              </CardDescription>
            </div>
            {selectedOrg && (
              <Button onClick={() => setInviteDialogOpen(true)}>
                <IconMail className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedOrg ? (
              <div className="text-center py-12 text-muted-foreground">
                Select an organization from the list to view details
              </div>
            ) : (
              <div className="space-y-6">
                {/* Members Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Members ({members.length})
                  </h3>
                  {membersLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : members.length ? (
                    <div className="rounded-lg border">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">Member</th>
                            <th className="text-left p-3 font-medium">Role</th>
                            <th className="text-right p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((member) => (
                            <tr key={member.id} className="border-t">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.user?.image} />
                                    <AvatarFallback>
                                      {member.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{member.user?.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {member.user?.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <Select
                                  value={member.role}
                                  onValueChange={(value) => handleUpdateRole(member.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedMember(member)
                                    setRemoveMemberDialogOpen(true)
                                  }}
                                >
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg">
                      No members yet
                    </div>
                  )}
                </div>

                {/* Invitations Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <IconMail className="h-5 w-5" />
                    Pending Invitations ({invitations.length})
                  </h3>
                  {invitationsLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : invitations.length ? (
                    <div className="rounded-lg border">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">Email</th>
                            <th className="text-left p-3 font-medium">Role</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-right p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invitations.map((invitation) => (
                            <tr key={invitation.id} className="border-t">
                              <td className="p-3">{invitation.email}</td>
                              <td className="p-3">
                                <Badge variant="secondary">{invitation.role}</Badge>
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant={invitation.status === "pending" ? "outline" : "default"}
                                >
                                  {invitation.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right">
                                {invitation.status === "pending" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleCancelInvitation(invitation.id)}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg">
                      No pending invitations
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Create a new organization.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={newOrgData.name}
                onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                placeholder="My Organization"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-slug">Slug</Label>
              <div className="relative">
                <Input
                  id="org-slug"
                  value={newOrgData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-organization"
                  className={slugStatus === "taken" ? "border-destructive" : slugStatus === "available" ? "border-green-500" : ""}
                />
                {slugStatus === "checking" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Checking...
                  </span>
                )}
                {slugStatus === "available" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-green-600">
                    ✓ Available
                  </span>
                )}
                {slugStatus === "taken" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-destructive">
                    ✗ Taken
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                URL: /{newOrgData.slug || "my-organization"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateOrg} 
              disabled={createOrg.isPending || slugStatus === "taken" || slugStatus === "checking"}
            >
              {createOrg.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>Update organization details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-org-name">Name</Label>
              <Input
                id="edit-org-name"
                value={editOrgData.name}
                onChange={(e) => setEditOrgData({ ...editOrgData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-org-slug">Slug</Label>
              <Input
                id="edit-org-slug"
                value={editOrgData.slug}
                onChange={(e) => setEditOrgData({ ...editOrgData, slug: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrg} disabled={updateOrg.isPending}>
              {updateOrg.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedOrg?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrg} disabled={deleteOrg.isPending}>
              {deleteOrg.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join {selectedOrg?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={inviteMember.isPending}>
              {inviteMember.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.user?.name} from {selectedOrg?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={removeMember.isPending}>
              {removeMember.isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
