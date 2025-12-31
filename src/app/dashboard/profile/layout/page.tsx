import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { publicProfile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProfileLayoutEditor } from "@/components/profile/ProfileLayoutEditor";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customize Layout | QT Statistics',
  description: 'Drag and drop to rearrange your public profile.',
};

export default async function LayoutEditorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const profile = await db
    .select({
      layoutConfig: publicProfile.layoutConfig,
    })
    .from(publicProfile)
    .where(eq(publicProfile.userId, session.user.id))
    .limit(1)
    .then(res => res[0]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
       <div className="mb-6">
           <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-1">Page Layout</h1>
           <p className="text-zinc-500 text-sm">Customize how your public profile looks to fans.</p>
       </div>
       <ProfileLayoutEditor initialLayout={profile?.layoutConfig as any[]} />
    </div>
  );
}
