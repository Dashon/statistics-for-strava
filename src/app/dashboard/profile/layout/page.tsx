import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ModularProfile } from "@/components/profile/ModularProfile";
import { getFeaturedProfile } from "@/app/actions/modular-profile";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Profile | QT.run',
  description: 'Customize your public athlete profile.',
};

export default async function LayoutEditorPage() {
  const session = await auth() as any;
  const userId = session?.user?.id || session?.userId;
  if (!userId) redirect("/");

  // Fetch the data just like the public page
  // We don't have a username here, so we look up by userId
  // But getFeaturedProfile expects a username.
  // So we should probably just redirect to their public profile username because that's where the WYSIWYG editor lives now.
  
  // Actually, let's just redirect to the public profile (if they have a username) or dashboard if not.
  // The editor is now integrated into the public view.
  
  return redirect(`/dashboard/profile/public`); 
}
