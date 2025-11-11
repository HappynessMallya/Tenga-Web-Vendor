import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function PartnerAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to business tab since office creation is now there
    router.replace('/(tabs)/business');
  }, [router]);

  return null;
}
