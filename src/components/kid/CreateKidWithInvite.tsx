// filepath: src/components/kid/CreateKidWithInvite.tsx
import { useState } from 'react';
import { rpcCreateKidWithInvite } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const CreateKidWithInvite = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    const { data, error } = await rpcCreateKidWithInvite(name, email || undefined);
    setLoading(false);
    if (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Create failed', description: error.message });
      return;
    }
    const kidId = data?.[0]?.kid_id;
    const token = data?.[0]?.token;
    if (token) {
      const link = `${window.location.origin}/accept-invite?token=${token}`;
      setInviteLink(link);
      toast({ title: 'Kid created', description: 'Invitation link generated.' });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <input className="border px-2 py-1 w-full" placeholder="Kid name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border px-2 py-1 w-full" placeholder="Kid email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Creating...' : 'Create Kid & Invite'}</button>
      </form>
      {inviteLink && (
        <div className="p-2 border rounded bg-muted text-sm break-all">
          Invitation link: <a className="underline" href={inviteLink}>{inviteLink}</a>
        </div>
      )}
    </div>
  );
};
