import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PageContainer({
  children,
  scrollable = true
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className='h-[calc(100dvh-4rem)] w-full'>
          <div className='flex flex-1 p-0 min-w-0 max-w-full overflow-x-hidden'>{children}</div>
        </ScrollArea>
      ) : (
        <div className='flex flex-1 p-0 h-[calc(100dvh-4rem)] min-w-0 max-w-full overflow-x-hidden'>{children}</div>
      )}
    </>
  );
}
