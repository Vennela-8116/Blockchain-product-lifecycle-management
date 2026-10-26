import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Squares2X2Icon,
  PlusCircleIcon,
  BuildingOffice2Icon,
  CircleStackIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  WrenchScrewdriverIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const role = user?.role || 'owner';

  // Navigation configurations per role
  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: Squares2X2Icon },
    { name: 'Register Product', path: '/admin/products/new', icon: PlusCircleIcon },
    { name: 'Service Centers', path: '/admin/service-centers', icon: BuildingOffice2Icon },
  ];

  const serviceCenterLinks = [
    { name: 'Dashboard & Log', path: '/service-center', icon: WrenchScrewdriverIcon },
  ];

  const ownerLinks = [
    { name: 'My Products', path: '/owner', icon: CubeIcon },
  ];

  let links = ownerLinks;
  if (role === 'admin') links = adminLinks;
  if (role === 'serviceCenter') links = serviceCenterLinks;

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-300 border border-violet-700/60">Admin</span>;
      case 'serviceCenter':
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/60">Service Center</span>;
      default:
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">Owner</span>;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-navy-800 border-r border-navy-700 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Logo & Close Button */}
        <div>
          <div className="h-16 px-6 border-b border-navy-700 flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
                  RepairChain
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-cyan-500/80 font-mono -mt-1">
                  Blockchain Passport
                </span>
              </div>
            </NavLink>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Nav Links */}
          <div className="px-3 py-6 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Workspace Menu
            </div>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => onClose && onClose()}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-navy-700/60'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}

            {/* Quick Public Explorer Link */}
            <div className="pt-4 border-t border-navy-700/60 mt-4">
              <NavLink
                to="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-navy-700/40 transition-colors"
              >
                <ShieldCheckIcon className="w-4 h-4 text-violet-400" />
                <span>Public Passport Portal</span>
              </NavLink>
            </div>
          </div>
        </div>

        {/* Bottom: User Card & Logout */}
        <div className="p-4 border-t border-navy-700 bg-navy-900/40">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'user@repairchain.io'}</p>
            </div>
            {getRoleBadge(role)}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-2 text-red-300 hover:text-red-200 hover:bg-red-950/40 hover:border-red-800 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
