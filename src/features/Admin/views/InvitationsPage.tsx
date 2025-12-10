import { useState } from "react"
import {
  IconCheck,
  IconX,
  IconMail,
  IconBuilding,
  IconClock,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"

import {
  useUserInvitations,
  useAcceptInvitation,
  useRejectInvitation,
} from "../hooks/useOrganizations"

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
  organizationId: string
  organization?: {
    id: string
    name: string
    slug: string
    logo?: string
  }
}

export function InvitationsPage() {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null)
  const [actionType, setActionType] = useState<"accept" | "reject">("accept")

  // Queries
  const { data: invitations, isLoading } = useUserInvitations()

  // Mutations
  const acceptInvitation = useAcceptInvitation()
  const rejectInvitation = useRejectInvitation()

  const handleAction = async () => {
    if (!selectedInvitation) return

    try {
      if (actionType === "accept") {
        await acceptInvitation.mutateAsync(selectedInvitation.id)
        toast.success("Invitation accepted! You are now a member of the organization.")
      } else {
        await rejectInvitation.mutateAsync(selectedInvitation.id)
        toast.success("Invitation rejected.")
      }
      setConfirmDialogOpen(false)
      setSelectedInvitation(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${actionType} invitation`)
    }
  }

  const openConfirmDialog = (invitation: Invitation, action: "accept" | "reject") => {
    setSelectedInvitation(invitation)
    setActionType(action)
    setConfirmDialogOpen(true)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isExpired = (date: Date) => {
    return new Date(date) < new Date()
  }

  // Cast invitations to proper type
  const invitationsList = (invitations ?? []) as Invitation[]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Invitations</h1>
          <p className="text-muted-foreground">
            Manage your pending organization invitations
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : invitationsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconMail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No pending invitations</h3>
            <p className="text-muted-foreground text-center mt-2">
              You don't have any pending organization invitations at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invitationsList.map((invitation) => {
            const expired = isExpired(invitation.expiresAt)
            return (
              <Card key={invitation.id} className={expired ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <IconBuilding className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">
                      {invitation.organization?.name ?? "Organization"}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    /{invitation.organization?.slug ?? "unknown"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <Badge variant="secondary" className="capitalize">
                      {invitation.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={expired ? "destructive" : "outline"}>
                      {expired ? "Expired" : invitation.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconClock className="h-4 w-4" />
                    <span>
                      {expired ? "Expired on" : "Expires"} {formatDate(invitation.expiresAt)}
                    </span>
                  </div>
                  {!expired && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1"
                        onClick={() => openConfirmDialog(invitation, "accept")}
                        disabled={acceptInvitation.isPending}
                      >
                        <IconCheck className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => openConfirmDialog(invitation, "reject")}
                        disabled={rejectInvitation.isPending}
                      >
                        <IconX className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "accept" ? "Accept Invitation" : "Reject Invitation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "accept"
                ? `Are you sure you want to join ${selectedInvitation?.organization?.name ?? "this organization"}? You will become a ${selectedInvitation?.role} of the organization.`
                : `Are you sure you want to reject the invitation from ${selectedInvitation?.organization?.name ?? "this organization"}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {actionType === "accept" ? "Accept" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
