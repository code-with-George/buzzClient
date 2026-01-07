import { CheckCircle } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';

export function ResultActions() {
  const { dispatch } = useApp();

  // Handle end - reset and go back to main screen
  const handleEnd = () => {
    dispatch({ type: 'RESET_DEPLOYMENT' });
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 safe-area-bottom">
      <div className="mx-4 mb-4">
        <Button
          size="xl"
          onClick={handleEnd}
          className="w-full"
        >
          <CheckCircle className="ms-2 h-5 w-5" />
          סיום
        </Button>
      </div>
    </div>
  );
}
