import React from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/auth-context";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const history = useHistory();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    history.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar maxWidth="xl" className="border-b border-divider">
        <NavbarBrand>
          <Link to="/dashboard" className="flex items-center gap-2">
            <Icon icon="lucide:book-open" width={24} height={24} className="text-primary" />
            <p className="font-bold text-inherit">Компилятор</p>
          </Link>
        </NavbarBrand>
        <NavbarContent justify="end">
          {isAdmin && (
            <NavbarItem>
              <Button 
                as={Link}
                to="/admin"
                color="primary"
                variant={location.pathname.startsWith("/admin") ? "solid" : "flat"}
                startContent={<Icon icon="lucide:settings" />}
              >
                Панель администратора
              </Button>
            </NavbarItem>
          )}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="primary"
                name={user?.name}
                size="sm"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">{user?.email}</p>
              </DropdownItem>
              <DropdownItem key="dashboard" as={Link} to="/dashboard">
                Курсы
              </DropdownItem>
              {isAdmin && (
                <DropdownItem key="admin" as={Link} to="/admin">
                  Панель администратора
                </DropdownItem>
              )}
              <DropdownItem key="logout" color="danger" onPress={handleLogout}>
                Выход
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      </Navbar>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
    {/* <footer className="py-6 border-t border-divider">
        <div className="container mx-auto px-4 text-center text-default-500">
          &copy; {new Date().getFullYear()} Компилятор
        </div>
      </footer> */}
    </div>
  );
};