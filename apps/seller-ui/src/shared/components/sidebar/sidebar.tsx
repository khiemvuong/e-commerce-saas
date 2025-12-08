'use client';

import useSeller from 'apps/seller-ui/src/hooks/useSeller';
import useSidebar from 'apps/seller-ui/src/hooks/useSidebar'
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react'
import Box from '../box';
import Link from 'next/link';
import { Sidebar } from './sidebar.styles';
import Logo from 'apps/seller-ui/src/assets/svgs/logo';
import SidebarItem from './sidebar.item';
import { BellPlus, BellRing, CalendarPlus, HandCoins, LayoutDashboard, ListOrdered, LogOut, MailCheck, PackageSearch, Settings, ShoppingBasket, TicketPercent} from 'lucide-react';
import SidebarMenu from './sidabar.menu';

const SidebarWrapper = () => {
    const {activeSidebar,setActiveSidebar} = useSidebar();
    const pathName = usePathname();
    const{seller} = useSeller();

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
                        <Logo />
                        <Box>
                            <h3 className = "text-xl font-medium text-[#ecedee]">{seller?.shop?.name}</h3>
                            <h5 className = "text-xs font-medium text-[#ecedee] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]">{seller?.shop?.address}</h5>
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
                        <SidebarMenu  title='Management'>
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
                        <SidebarMenu title='Products'>
                            <SidebarItem
                                title='Create Product'
                                icon={<ShoppingBasket fill={getIconColor('/create-products')} />}
                                isActive={activeSidebar === '/dashboard/create-products'}
                                href="/dashboard/create-products"
                            />
                            <SidebarItem
                                title='All Products'
                                icon={<PackageSearch fill={getIconColor('/all-products')} />}
                                isActive={activeSidebar === '/dashboard/all-products'}
                                href="/dashboard/all-products"
                            />
                        </SidebarMenu>

                        <SidebarMenu title='Events'>
                            <SidebarItem
                                title='Create Events'
                                icon={<CalendarPlus fill={getIconColor('/dashboard/create-events')} />}
                                isActive={activeSidebar === '/dashboard/create-events'}
                                href="/dashboard/create-events"
                            />
                            <SidebarItem
                                title='All Events'
                                icon={<BellPlus fill={getIconColor('/dashboard/all-events')} />}
                                isActive={activeSidebar === '/dashboard/all-events'}
                                href="/dashboard/all-events"
                            />
                        </SidebarMenu>
                        <SidebarMenu title='Controllers'>
                            <SidebarItem
                                title='Inbox'
                                icon={<MailCheck fill={getIconColor('/dashboard/inbox')} />}
                                isActive={activeSidebar === '/dashboard/inbox'}
                                href="/dashboard/inbox"
                            />
                            <SidebarItem
                                title='Settings'
                                icon={<Settings fill={getIconColor('/dashboard/settings')} />}
                                isActive={activeSidebar === '/dashboard/settings'}
                                href="/dashboard/settings"
                            />
                            <SidebarItem
                                title='Notifications'
                                icon={<BellRing fill={getIconColor('/dashboard/notifications')} />}
                                isActive={activeSidebar === '/dashboard/notifications'}
                                href="/dashboard/notifications"
                            />
                        </SidebarMenu>

                        <SidebarMenu title='Extras'>
                            <SidebarItem
                                title='Discount Codes'
                                icon={<TicketPercent fill={getIconColor('/dashboard/discount-codes')} />}
                                isActive={activeSidebar === '/dashboard/discount-codes'}
                                href="/dashboard/discount-codes"
                            />
                            <SidebarItem
                                title='Logout'
                                icon={<LogOut fill={getIconColor('/dashboard/logout')} />}
                                isActive={activeSidebar === '/dashboard/logout'}
                                href="/dashboard/logout"
                            />
                        </SidebarMenu>

                    </div>

                </Sidebar.Body>
            </div>


        </Box>
    )
}

export default SidebarWrapper