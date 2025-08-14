// filepath: src/pages/AcceptInvite.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { rpcClaimKidInvitation } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function AcceptInvite() {
  const [search] = useSearchParams();
  const token = search.get('token') || '';
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (!user) return; // wait until logged in / registration done
  }, [token, user]);

  const claim = async () => {
    if (!token) return;
    setLoading(true);
    const { data, error } = await rpcClaimKidInvitation(token);
    setLoading(false);
    if (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Invite failed', description: error.message });
      return;
    }
    const kidId = data?.[0]?.kid_id;
    toast({ title: 'Invitation accepted', description: 'Your account is now linked.' });
    if (kidId) navigate(`/kid/${kidId}`);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Accept Invitation</h1>
      {!token && <p>Invalid invitation link.</p>}
      {token && !user && <p>Please sign up or log in first, then click claim.</p>}
      {token && user && (
        <button disabled={loading} onClick={claim} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          {loading ? 'Claiming...' : 'Claim Invitation'}
        </button>
      )}
    </div>
  );
}
