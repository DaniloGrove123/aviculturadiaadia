import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import { 
  Home, 
  ClipboardCheck,
  Package,
  DollarSign,
  Settings,
  Bell,
  Menu,
  X
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    console.log("Toggle sidebar", !sidebarOpen);
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    console.log("Close sidebar");
    setSidebarOpen(false);
  };

  const navItems = [
    { name: "Dashboard", href: "/", icon: <Home className="w-5 h-5" /> },
    { name: "Coletas", href: "/collections", icon: <ClipboardCheck className="w-5 h-5" /> },
    { name: "Estoque", href: "/stock", icon: <Package className="w-5 h-5" /> },
    { name: "Finanças", href: "/finances", icon: <DollarSign className="w-5 h-5" /> },
    { name: "Configurações", href: "/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // User's initials for avatar
  const getInitials = () => {
    if (!user || !user.name) return "U";
    return user.name.split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const renderSidebar = () => (
    <>
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold gradient-text">Avicultura Dia a Dia</h1>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={closeSidebar}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg 
                ${isActive 
                  ? "bg-primary/10 text-white border-l-4 border-primary" 
                  : "hover:bg-gray-800 text-gray-100"
                }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="font-medium text-white">{getInitials()}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-300">{user?.farmName}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-card border-r border-gray-800">
        {renderSidebar()}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 w-64 bg-card shadow-xl lg:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="absolute top-4 right-4">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={toggleSidebar}
                  className="rounded-full shadow-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {renderSidebar()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-card border-b border-gray-800 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center lg:hidden">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleSidebar}
                className="relative p-2 hover:bg-primary hover:text-white transition-colors border-primary animate-pulse hover:animate-none"
                aria-label="Abrir menu de navegação"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu de navegação</span>
              </Button>
              <h1 className="ml-2 text-xl font-bold lg:hidden gradient-text">Avicultura Dia a Dia</h1>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-6 w-6 text-gray-500" />
              </Button>
              {isMobile && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="font-medium text-white text-xs">{getInitials()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
