import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { IconUserCircle } from "@tabler/icons-react"
import { useAuth } from "@/shared/context/AuthContext"

export default function AccountPage() {
    const { user } = useAuth()

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            <div>
                <h1 className="text-2xl font-bold">Account</h1>
                <p className="text-muted-foreground">Manage your account details</p>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <IconUserCircle className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <CardTitle>{user?.name ?? "User"}</CardTitle>
                        <CardDescription>{user?.email ?? ""}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        Account management features coming soon
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
