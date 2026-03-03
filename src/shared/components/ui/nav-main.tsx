import { Link } from "react-router-dom"
import { type Icon, IconChevronRight } from "@tabler/icons-react"
import * as Collapsible from "@radix-ui/react-collapsible"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/shared/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: Icon
  isActive?: boolean
}

type NavGroup = {
  title: string
  icon?: Icon
  isActive?: boolean
  items: NavItem[]
}

export function NavMain({
  items,
  groups,
}: {
  items?: NavItem[]
  groups?: NavGroup[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {/* Render individual items */}
          {items?.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title} 
                isActive={item.isActive}
                asChild
              >
                <Link to={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Render collapsible groups */}
          {groups?.map((group) => (
            <Collapsible.Root 
              key={group.title} 
              asChild 
              defaultOpen={true}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <Collapsible.Trigger asChild>
                  <SidebarMenuButton tooltip={group.title}>
                    {group.icon && <group.icon />}
                    <span>{group.title}</span>
                    <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <SidebarMenuSub>
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={item.isActive}>
                          <Link to={item.url}>
                            {item.icon && <item.icon className="size-4" />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </Collapsible.Content>
              </SidebarMenuItem>
            </Collapsible.Root>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
