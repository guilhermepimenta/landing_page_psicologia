import React, { ReactNode } from 'react';

type TabId = 'overview' | 'posts' | 'calendar' | 'ideas' | 'analytics' | 'google' | 'instagram' | 'messages' | 'settings';

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  alertsCount?: number;
  unreadCount?: number;
}

const NAV_GROUPS = [
  {
    label: 'Criação & Gestão',
    items: [
      { icon: '📊', label: 'Dashboard', tab: 'overview' as TabId },
      { icon: '📋', label: 'Posts', tab: 'posts' as TabId },
      { icon: '📅', label: 'Calendário', tab: 'calendar' as TabId },
      { icon: '💡', label: 'Ideias', tab: 'ideas' as TabId },
    ],
  },
  {
    label: 'Analytics & Métricas',
    items: [
      { icon: '📈', label: 'Analytics', tab: 'analytics' as TabId },
      { icon: '📱', label: 'Instagram', tab: 'instagram' as TabId },
      { icon: '🔍', label: 'Google', tab: 'google' as TabId },
    ],
  },
  {
    label: 'Relacionamento',
    items: [
      { icon: '✉️', label: 'Mensagens', tab: 'messages' as TabId },
    ],
  },
];

const BOTTOM_NAV = [
  { icon: '📊', label: 'Início', tab: 'overview' as TabId },
  { icon: '📋', label: 'Conteúdo', tab: 'posts' as TabId },
  { icon: '📈', label: 'Analytics', tab: 'analytics' as TabId },
  { icon: '✉️', label: 'Mensagens', tab: 'messages' as TabId },
  { icon: '⚙️', label: 'Config', tab: 'settings' as TabId },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  onLogout,
  activeTab,
  onTabChange,
  alertsCount = 0,
  unreadCount = 0,
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-gray-100 shrink-0">
        <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">FA</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900 leading-tight">Marketing Hub</h1>
          <p className="text-xs text-gray-400">Fernanda Psicologia</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.tab;
                const badge =
                  item.tab === 'analytics' && alertsCount > 0 ? alertsCount :
                  item.tab === 'messages' && unreadCount > 0 ? unreadCount : 0;
                return (
                  <button
                    key={item.tab}
                    onClick={() => { onTabChange?.(item.tab); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge > 0 && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
                        item.tab === 'analytics' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Configurações separada */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1.5">
            Sistema
          </p>
          <button
            onClick={() => { onTabChange?.('settings'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="text-base">⚙️</span>
            <span>Configurações</span>
          </button>
        </div>
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-100 p-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-xs">FM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Fernanda Mangia</p>
            <p className="text-xs text-gray-400 truncate">CRP XX/XXXXX</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-shrink-0 fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200">
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="md:pl-56 flex flex-col min-h-screen">

        {/* Top bar mobile */}
        <div className="sticky top-0 z-10 md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-bold text-gray-900">Marketing Hub</span>
          </div>
          <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            {children}
          </div>
        </main>

        {/* Bottom nav mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 md:hidden bg-white border-t border-gray-200 flex">
          {BOTTOM_NAV.map((item) => {
            const isActive = activeTab === item.tab;
            const badge =
              item.tab === 'analytics' && alertsCount > 0 ? alertsCount :
              item.tab === 'messages' && unreadCount > 0 ? unreadCount : 0;
            return (
              <button
                key={item.tab}
                onClick={() => onTabChange?.(item.tab)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative ${
                  isActive ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
                {badge > 0 && (
                  <span className="absolute top-1.5 right-1/4 translate-x-1/2 text-[9px] font-bold bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
