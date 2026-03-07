import React, { ReactNode } from 'react';

type TabId = 'overview' | 'posts' | 'calendar' | 'ideas' | 'analytics' | 'google' | 'settings';

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, onLogout, activeTab, onTabChange }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems: { icon: string; label: string; tab: TabId }[] = [
    { icon: '📊', label: 'Dashboard', tab: 'overview' },
    { icon: '📱', label: 'Conteúdo', tab: 'posts' },
    { icon: '📅', label: 'Calendário', tab: 'calendar' },
    { icon: '💡', label: 'Ideias', tab: 'ideas' },
    { icon: '📈', label: 'Analytics', tab: 'analytics' },
    { icon: '⚙️', label: 'Configurações', tab: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para Desktop */}
      <aside className="hidden md:flex md:flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">FA</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Marketing Hub</h1>
                <p className="text-xs text-gray-500">Fernanda Psicologia</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => onTabChange?.(item.tab)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${
                  activeTab === item.tab
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">FM</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Fernanda Mangia</p>
                <p className="text-xs text-gray-500 truncate">CRP XX/XXXXX</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top Bar Mobile */}
        <div className="sticky top-0 z-10 md:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Marketing Hub</h1>
            </div>
            <button onClick={onLogout} className="p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <h1 className="text-lg font-semibold text-gray-900">Menu</h1>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => {
                      onTabChange?.(item.tab);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.tab
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © 2026 Fernanda Abreu Mangia - Psicologia. Marketing Hub v1.0
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
