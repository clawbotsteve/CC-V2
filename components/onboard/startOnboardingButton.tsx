// 'use client';

// import { useOnboardingStore } from '@/hooks/use-onboarding-store';
// import { Rocket } from 'lucide-react';
// import { Button } from '../ui/button';

// export function StartTourButton() {
//   const { startTour } = useOnboardingStore();

//   return (
//     <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
//       <Button
//         onClick={startTour}
//         className={`
//           rounded-full px-6 py-6 shadow-xl text-white font-bold text-lg
//           bg-gradient-to-r from-blue-500 to-purple-600
//           hover:from-blue-600 hover:to-purple-700
//           transform transition-all duration-800
//           animate-bounce hover:animate-none hover:transition-all hover:duration-200 hover:scale-105 hover:-translate-y-1
//         `}
//       >
//         <Rocket className="mr-2 h-5 w-5" />
//         Start Tour
//       </Button>
//     </div>
//   );
// }
