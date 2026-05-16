import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabase } from "../lib/supabase";

type Agency = { id: string; name: string; slug: string };
type Status = "loading" | "not-found" | "ready";

const inputClass = "w-full border rounded-lg p-3";

export default function PublicForm() {
  const { agencySlug } = useParams();
  const [status, setStatus] = useState<Status>("loading");
  const [agency, setAgency] = useState<Agency | null>(null);
  const [fields, setFields] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchAgency() {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("slug", agencySlug)
        .single();

      if (error) {
        setStatus("not-found");
      } else {
        setAgency(data);
        setStatus("ready");
      }
    }
    fetchAgency();
  }, [agencySlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agency) return;

    setSubmitting(true);
    setSubmitError("");

    const { error } = await supabase.from("contacts").insert({
      agency_id: agency.id,
      ...fields,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSuccess(true);
    setFields({ name: "", email: "", message: "" });
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Agency not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Contact {agency?.name}</h1>
        <p className="text-gray-500 mb-6">Leave your message below</p>

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            Message sent successfully
          </div>
        )}

        {submitError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            className={inputClass}
            value={fields.name}
            onChange={(e) => setFields({ ...fields, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className={inputClass}
            value={fields.email}
            onChange={(e) => setFields({ ...fields, email: e.target.value })}
            required
          />
          <textarea
            placeholder="Message"
            className={`${inputClass} h-32`}
            value={fields.message}
            onChange={(e) => setFields({ ...fields, message: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white rounded-lg p-3"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}

