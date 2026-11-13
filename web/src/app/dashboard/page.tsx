import { getContent } from "@/lib/cms";
import { MeApp, type Site } from "@/components/me/MeApp";

// One entry point for every role: dancers, spectators, judges, MCs and the event team.
// The page is a client app; Supabase row-level security decides what each account can see and do.
export default async function Dashboard() {
  const c = await getContent();
  const site: Site = {
    feeIdr: c.settings.feeIdr,
    feeUsd: c.settings.feeUsd,
    paymentInfo: c.register.paymentInfo,
    rsvpOpen: c.settings.rsvpOpen,
    googleLogin: c.settings.googleLogin,
    categories: c.categories.list.map(({ slug, name, day, unit, prize, eligibility }) => ({ slug, name, day, unit, prize, eligibility })),
    days: c.event.days,
  };
  return <MeApp site={site} />;
}
