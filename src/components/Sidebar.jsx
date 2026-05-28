import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileText,
  Settings,
  LogOut as LogOutIcon,
  X,
  Users,
  Database,
  ClipboardList,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle,
  ShoppingCart,
  FilePlus2,
  Search,
  Pencil,
  LayoutGrid,
  FilePlus,
  ClipboardCheck,
  Tags,
  Cpu,
  HelpCircle,
  TrendingUp,
  UserCheck,
  History,
  PackageSearch,
  Truck,
  Package,
  CreditCard,
  Ban,
  Warehouse,
  Coins,
  Receipt,
  Blocks
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import parekhLogo from '../Assets/images.png';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const adminMenuItems = [
    { path: '/dashboard',           icon: TrendingUp,     label: 'Dashboard' },
    { path: '/create-indent',       icon: FilePlus,       label: 'Inventory Form' },
    { path: '/master',              icon: LayoutGrid,     label: 'Item Details' },
    { path: '/settings',            icon: Settings,       label: 'Settings' },
  ];

  const employeeMenuItems = [
    { path: '/create-indent', icon: FilePlus,   label: 'Inventory Form' },
    { path: '/master',        icon: LayoutGrid, label: 'Item Details' },
  ];

  const menuItems = user?.role?.toUpperCase() === 'ADMIN' ? adminMenuItems : employeeMenuItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 sm:w-72 lg:w-56 2xl:w-60 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden bg-white p-0.5 border border-slate-100 shadow-sm flex-shrink-0">
                <img
                  src={parekhLogo}
                  alt="Parekh Gallerium Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-bold text-sky-600 tracking-tight">Parekh Gallerium</span>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-sky-50 rounded-lg">
              <X size={20} className="text-sky-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
            {menuItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.isNested ? (
                  <div className="space-y-1">
                    <button
                      onClick={item.onToggle}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group hover:bg-sky-50 hover:text-sky-700 border-l-4 border-transparent`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="font-medium leading-tight whitespace-nowrap">{item.label}</span>
                      </div>
                      {item.isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {item.isOpen && (
                      <div className="pl-9 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={onClose}
                            className={({ isActive }) => `
                              flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200
                              ${isActive 
                                ? 'bg-sky-50 text-sky-700' 
                                : 'text-gray-600 hover:bg-sky-50/50 hover:text-sky-700'}
                            `}
                          >
                            <span className="text-sm leading-tight whitespace-nowrap font-black">{sub.label}</span>
                            {sub.count > 0 && (
                              <span className="bg-sky-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                                {sub.count}
                              </span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group
                      ${isActive 
                        ? 'bg-sky-50 text-sky-700 border-l-4 border-sky-600' 
                        : 'text-gray-700 hover:bg-sky-50/40 hover:text-sky-700 border-l-4 border-transparent'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="font-black leading-tight whitespace-nowrap">{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span className="bg-sky-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                        {item.count}
                      </span>
                    )}
                  </NavLink>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-slate-100 bg-sky-50/30">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white transition-all font-semibold shadow-sm"
            >
              <LogOutIcon size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;