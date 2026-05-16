import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

type Contact = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "contacted" | "discarded";
  created_at: string;
};

const statusOptions = ["new", "contacted", "discarded"] as const;

const statusColors: Record<Contact["status"], string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-green-100 text-green-700",
  discarded: "bg-gray-100 text-gray-500",
};

export default function Inbox() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      setContacts(data ?? []);
      setLoading(false);
    }

    fetchContacts();

    // Realtime: subscribe to new inserts, dedup against initial fetch
    const channel = supabase
      .channel("inbox-contacts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contacts" },
        (payload) => {
          const incoming = payload.new as Contact;
          setContacts((prev) => {
            if (prev.some((c) => c.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function updateStatus(id: string, status: string) {
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: status as Contact["status"] } : c))
    );
    await supabase.from("contacts").update({ status }).eq("id", id);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            Sign out
          </button>
        </div>

        {contacts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
            No contacts yet
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{contact.name}</span>
                    <span className="text-gray-400 text-sm">{contact.email}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{contact.message}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(contact.created_at).toLocaleString()}
                  </p>
                </div>

                <select
                  value={contact.status}
                  onChange={(e) => updateStatus(contact.id, e.target.value)}
                  className={`rounded-lg px-2 py-1 text-sm font-medium border-0 shrink-0 cursor-pointer ${statusColors[contact.status]}`}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
