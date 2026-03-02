import { UserProfile } from '@clerk/nextjs';

export const metadata = {
  title: 'Dashboard : Profile'
};

export default async function Page() {
  return (
    <div className='flex w-full flex-col p-4'>
      <UserProfile />
    </div>
  );
}
