import { useState } from "react"
import {
  IconBuilding,
  IconCheck,
  IconChevronDown,
  IconPlus,
  IconLogout,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Skeleton } from "@/shared/components/ui/skeleton"

import {
  useOrganizations,
  useCreateOrganization,
  useSetActiveOrganization,
  useActiveMember,
  useLeaveOrganization,
} from "@/features/Admin/hooks/useOrganizations"

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
}

export function OrganizationSwitcher() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newOrgData, setNewOrgData] = useState({ name: "", slug: "" })

  // Queries
  const { data: organizations, isLoading: orgsLoading } = useOrganizations()
  const { data: activeMember } = useActiveMember()

  // Mutations
  const createOrg = useCreateOrganization()
  const setActiveOrg = useSetActiveOrganization()
  const leaveOrg = useLeaveOrganization()

  // Cast organizations to proper type
  const orgsList = (organizations ?? []) as Organization[]

  // Find active organization
  const activeOrg = orgsList.find(
    (org) => org.id === (activeMember as { organizationId?: string })?.organizationId
  )

  const handleSetActive = async (orgId: string) => {
    try {
      await setActiveOrg.mutateAsync(orgId)
      toast.success("Switched organization")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to switch organization")
    }
  }

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

  const handleLeaveOrg = async (orgId: string) => {
    try {
      await leaveOrg.mutateAsync(orgId)
      toast.success("Left organization")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to leave organization")
    }
  }

  if (orgsLoading) {
    return <Skeleton className="h-9 w-40" />
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <IconBuilding className="h-4 w-4" />
              <span className="truncate max-w-[120px]">
                {activeOrg?.name ?? "Select Organization"}
              </span>
            </div>
            <IconChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {orgsList.length === 0 ? (
            <DropdownMenuItem disabled>
              No organizations
            </DropdownMenuItem>
          ) : (
            orgsList.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSetActive(org.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4" />
                  <span className="truncate">{org.name}</span>
                </div>
                {activeOrg?.id === org.id && (
                  <IconCheck className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Create Organization
          </DropdownMenuItem>
          {activeOrg && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleLeaveOrg(activeOrg.id)}
                className="text-destructive"
              >
                <IconLogout className="mr-2 h-4 w-4" />
                Leave {activeOrg.name}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to collaborate with your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="orgName">Name</Label>
              <Input
                id="orgName"
                value={newOrgData.name}
                onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                placeholder="My Organization"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="orgSlug">Slug</Label>
              <Input
                id="orgSlug"
                value={newOrgData.slug}
                onChange={(e) => setNewOrgData({ ...newOrgData, slug: e.target.value })}
                placeholder="my-organization"
              />
              <p className="text-sm text-muted-foreground">
                This will be used in URLs: /org/{newOrgData.slug || "my-organization"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrg} disabled={createOrg.isPending}>
              {createOrg.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
