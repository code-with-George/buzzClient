import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';

export function TopBar() {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const handleLogout = () => {
    localStorage.removeItem('buzz-token');
    localStorage.removeItem('buzz-user-id');
    // LOGOUT action resets ALL state (including calculations, config, etc.)
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  return (
    <div className="absolute top-4 right-4 left-4 z-10 safe-area-top">
      <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <img 
          src="/../public/BUZZ.png" 
          alt="לוגו באזז" 
          className="h-8 w-auto"
        />

        {/* Logout button */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors tap-target text-muted-foreground hover:text-foreground"
        >
          <span className="text-sm font-medium">התנתק</span>
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
