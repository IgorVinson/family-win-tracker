// filepath: src/components/family/CreateFamilyInvite.tsx
import { toast } from "@/hooks/use-toast";
import { rpcCreateFamilyInvitation } from "@/integrations/supabase/client";
import { useState } from "react";

export const CreateFamilyInvite = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await rpcCreateFamilyInvitation(
      email || undefined
    );
    setLoading(false);
    if (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Invite failed",
        description: error.message,
      });
      return;
    }
    const token = data?.[0]?.token;
    if (token) {
      const link = `${window.location.origin}/accept-invite?token=${token}`;
      setInviteLink(link);
      toast({
        title: "Family invitation created",
        description: "Invitation link generated.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <input
          className="border px-2 py-1 w-full"
          placeholder="Email (optional)"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Creating..." : "Invite Family Member"}
        </button>
      </form>
      {inviteLink && (
        <div className="p-2 border rounded bg-muted text-sm break-all">
          Invitation link:{" "}
          <a className="underline" href={inviteLink}>
            {inviteLink}
          </a>
        </div>
      )}
    </div>
  );
};
