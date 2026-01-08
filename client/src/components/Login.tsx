import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Phone, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { useApp } from '@/store/AppContext';

export function Login() {
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.success && data.user) {
        localStorage.setItem('buzz-token', data.token);
        localStorage.setItem('buzz-user-id', String(data.user.id));
        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: { isAuthenticated: true, userId: String(data.user.id) },
        });
        navigate('/app');
      }
    },
    onError: (err) => {
      setError(err.message || 'אימות נכשל');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!serialNumber.trim()) {
      setError('נדרש מספר אישי');
      return;
    }

    loginMutation.mutate({ serialNumber: serialNumber.trim() });
  };

  return (
    <div className="min-h-screen bg-buzz-dark dot-grid flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 safe-area-top">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AtSign className="h-4 w-4" />
          <span className="font-mono text-xs tracking-wider">SYS.V.4.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-buzz-green status-online" />
          <span className="text-sm font-medium">מקוון</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/../public/BUZZ.png" 
            alt="לוגו באזז" 
            className="h-36 w-auto animate-fade-in"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-center uppercase">
          התחברות לבאזז
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          הזדהות באמצעות מספר אישי סידורי (מ.א.ס)
        </p>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="serial">מספר אישי</Label>
              <span className="text-xs font-mono text-buzz-purple bg-buzz-purple/10 px-2 py-0.5 rounded">
                חובה
              </span>
            </div>
            <div className="relative">
              <Input
                id="serial"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                className="font-mono text-base pe-8"
                autoComplete="off"
                autoCapitalize="characters"
                dir="ltr"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <span className="h-2 w-2 rounded-full bg-buzz-purple block" />
              </div>
            </div>
            {error && (
              <p className="text-sm text-buzz-red">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            size="xl"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="ms-2 h-5 w-5 animate-spin" />
                מאמת...
              </>
            ) : (
              <>
                כניסה למערכת
                <ArrowLeft className="me-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>

        {/* Help text */}
        <div className="mt-8 flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span className="text-sm">
            בעיה בהתחברות? התקשר למוקד החירום *5765
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 safe-area-bottom">
        <div className="flex justify-center gap-4 mb-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 w-16 rounded-full ${
                i === 3 ? 'bg-buzz-purple' : 'bg-buzz-dark-border'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground font-mono tracking-wider">
          חיבור מאובטח V4.2.0
        </p>
      </footer>
    </div>
  );
}
