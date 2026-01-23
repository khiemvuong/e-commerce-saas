'use client';

import useAdmin from "apps/admin-ui/src/app/hooks/useAdmin";
import useSidebar from "apps/admin-ui/src/app/hooks/useSidebar";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { useLogout } from '../../../hooks/useLogout';
import Box from "../box";
import { Sidebar } from "./sidebar.styles";
import Link from "next/link";
import Logo from "apps/admin-ui/src/app/assets/svgs/logo";
import SidebarItem from "./sidebar.item";
import { BellRingIcon, CalendarPlus, FileClock, HandCoins, LayoutDashboard, ListOrdered, LogOut, PencilRuler, Settings, Shield, ShoppingBasket, Store, Users } from "lucide-react";
import SidebarMenu from "./sidabar.menu";

const SidebarWrapper = () => {
    const {activeSidebar,setActiveSidebar} = useSidebar();
    const pathName = usePathname();
    const{admin} = useAdmin();
    const { logout, isLoggingOut } = useLogout();

    useEffect(() => {
        setActiveSidebar(pathName);
    }, [pathName,setActiveSidebar])

    const getIconColor = (route:string) => {
        return activeSidebar === route ? '#0085ff' : '#969696';
    }

    return (
        <Box
            css={
                {
                    height:"100vh",
                    zIndex:202,
                    position: "sticky",
                    top:0,
                    overflowY: "scroll",
                    scrollbarWidth: "none",
                }
            }
            className ="sidebar-wrapper"
        >
            <Sidebar.Header>
                <Box>
                    <Link
                        href={"/"} className = "flex justify-center gap-2"
                    >
                        {/* <Logo /> */}
                        <Logo />
                        <Box>
                            <h3 className = "text-xl font-medium text-[#ecedee]">{admin?.name}</h3>
                            <h5 className = "text-xs font-medium text-[#ecedee] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]">{admin?.email}</h5>
                        </Box>
                    </Link>
                </Box>
            </Sidebar.Header>
            <div className = "block my-3 h-full">
                <Sidebar.Body className="body sidebar">
                    <SidebarItem
                        title='Dashboard'
                        icon={<LayoutDashboard fill={getIconColor('/dashboard')} />}
                        isActive={activeSidebar === '/dashboard'}
                        href="/dashboard"
                    />
                    <div className="mt-2 block">
                        <SidebarMenu  title='Main Menu'>
                            <SidebarItem
                                title='Orders'
                                icon={<ListOrdered fill={getIconColor('/orders')} />}
                                isActive={activeSidebar === '/dashboard/orders'}
                                href="/dashboard/orders"
                            />
                            <SidebarItem
                                title='Payments'
                                icon={<HandCoins fill={getIconColor('/payments')} />}
                                isActive={activeSidebar === '/dashboard/payments'}
                                href="/dashboard/payments"
                            />
                            
                        </SidebarMenu>
                        <SidebarItem
                            title='Products'
                            icon={<ShoppingBasket fill={getIconColor('/dashboard/products')} />}
                            isActive={activeSidebar === '/dashboard/products'}
                            href="/dashboard/products"
                        />
                        <SidebarItem
                            title='Events'
                            icon={<CalendarPlus fill={getIconColor('/dashboard/events')} />}
                            isActive={activeSidebar === '/dashboard/events'}
                            href="/dashboard/events"
                        />
                        <SidebarItem
                            title='Users'
                            icon={<Users fill={getIconColor('/dashboard/users')} />}
                            isActive={activeSidebar === '/dashboard/users'}
                            href="/dashboard/users"
                        />
                        <SidebarItem
                            title='Sellers'
                            icon={<Store fill={getIconColor('/dashboard/sellers')} />}
                            isActive={activeSidebar === '/dashboard/sellers'}
                            href="/dashboard/sellers"
                        />

                        <SidebarMenu title='Controllers'>
                            <SidebarItem
                                title='Loggers'
                                icon={<FileClock fill={getIconColor('/dashboard/loggers')} />}
                                isActive={activeSidebar === '/dashboard/loggers'}
                                href="/dashboard/loggers"
                            />
                            <SidebarItem
                                title='Management'
                                icon={<Settings fill={getIconColor('/dashboard/management')} />}
                                isActive={activeSidebar === '/dashboard/management'}
                                href="/dashboard/management"
                            />
                            <SidebarItem
                                title='Notifications'
                                icon={<BellRingIcon fill={getIconColor('/dashboard/notifications')} />}
                                isActive={activeSidebar === '/dashboard/notifications'}
                                href="/dashboard/notifications"
                            />
                        </SidebarMenu>
                        <SidebarMenu title='Customization'>
                            <SidebarItem
                                title='All Customization'
                                icon={<PencilRuler fill={getIconColor('/dashboard/customization')} />}
                                isActive={activeSidebar === '/dashboard/customization'}
                                href="/dashboard/customization"
                            />
                        </SidebarMenu>
                        {/*Extras*/}
                        <SidebarMenu title='Extras'>
                            <SidebarItem
                                title='Security Settings'
                                icon={<Shield fill={getIconColor('/dashboard/settings')} />}
                                isActive={activeSidebar === '/dashboard/settings'}
                                href="/dashboard/settings"
                            />
                            <div 
                                className="cursor-pointer"
                                onClick={() => !isLoggingOut && logout()}
                            >
                                <SidebarItem
                                    title={isLoggingOut ? 'Logging out...' : 'Logout'}
                                    icon={<LogOut fill={getIconColor('/dashboard/logout')} />}
                                    isActive={false}
                                    href="#"
                                />
                            </div>
                        </SidebarMenu>
                    </div>

                </Sidebar.Body>
            </div>


        </Box>
    )
}

export default SidebarWrapper