import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/apiClient';

const RegisterHeader = () => {
  const [restaurantName, setRestaurantName] = useState<string>('');

  useEffect(() => {
    api
      .get<{ success: boolean; data: { name?: string } | null }>('/api/restaurant')
      .then((res) => { if (res.data?.name) setRestaurantName(res.data.name); })
      .catch(() => {});
  }, []);

  return (
    <div className="mb-6 flex justify-center">
      <Button variant="ghost" asChild className="flex items-center gap-2">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" />
          <span>{restaurantName || 'Restaurant'}</span>
        </Link>
      </Button>
    </div>
  );
};

export default RegisterHeader;
