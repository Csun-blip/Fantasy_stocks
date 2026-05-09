import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateRoomForm from '@/components/room/CreateRoomForm';

export const metadata = { title: 'Create Room — Fantasy Stocks' };

export default async function CreateRoomPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Create a Room</h1>
        <p className="text-muted mt-1 text-sm">Set up your competition and invite friends</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
        <CreateRoomForm />
      </div>
    </div>
  );
}
