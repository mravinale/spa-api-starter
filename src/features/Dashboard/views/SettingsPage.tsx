import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { IconSettings } from "@tabler/icons-react"

export default function SettingsPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your application preferences</p>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <IconSettings className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <CardTitle>Settings</CardTitle>
                        <CardDescription>
                            This page is under construction. Application settings will be available here soon.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        Coming soon
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
