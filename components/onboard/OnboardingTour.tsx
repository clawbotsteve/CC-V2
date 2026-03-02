// 'use client';

// import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
// import { useOnboardingStore } from '@/hooks/use-onboarding-store';
// import { handleJoyride } from './handleJoyride';
// import { useTheme } from 'next-themes';
// import { usePathname, useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// export default function OnboardingJoyride() {
//   const { resolvedTheme } = useTheme()
//   const router = useRouter();
//   const pathname = usePathname();
//   const store = useOnboardingStore()
//   const {
//     context,
//     steps,
//     status,
//     currentStepIndex,
//     redirectPath,
//     resumeTour,
//     setRedirectPath,
//     setStepIndex,
//     updateContext,
//   } = useOnboardingStore();

//   // Prepare dynamic locale to override next button label per step
//   const locale = {
//     back: 'Back',
//     close: 'Close',
//     last: 'Finish',
//     next: 'Next',
//     skip: 'Skip',
//   };

//   const handleJoyrideCallback = (data: CallBackProps) => {
//     const {
//       action,
//       index,
//       lifecycle,
//       size,
//       status,
//       step,
//       type
//     } = data
//     // console.log({
//     //   action,
//     //   type,
//     //   lifecycle,
//     //   status,
//     //   index,
//     //   size,
//     //   step,
//     // })
//     handleJoyride(data, store)
//   }

//   //* Resume the tour once it's on new page after redirecting
//   useEffect(() => {
//     if (
//       redirectPath &&
//       pathname === redirectPath &&
//       context?.isRedirecting &&
//       status === STATUS.PAUSED &&
//       Array.isArray(steps) &&
//       steps.length > 0
//     ) {
//       const stepIndexRaw = context.direction === 'next' ? currentStepIndex + 1 : currentStepIndex - 1;
//       const stepIndex = Math.min(Math.max(stepIndexRaw, 0), steps.length - 1);
//       const step = steps[stepIndex];

//       // console.debug('Onboarding resume check:', {
//       //   redirectPath,
//       //   pathname,
//       //   isRedirecting: context.isRedirecting,
//       //   status,
//       //   stepIndexRaw,
//       //   stepIndex,
//       //   step,
//       // });

//       if (!step || !step.target) {
//         console.warn('⚠️ No valid nextStep or target defined.');
//         return;
//       }

//       let elapsed = 0;
//       const maxWait = 5000; // 5 seconds max
//       const interval = setInterval(() => {
//         const targetElement = document.querySelector(step.target as string);

//         // console.debug('Checking for target element:', {
//         //   selector: step.target,
//         //   found: !!targetElement,
//         //   elapsed,
//         // });

//         if (targetElement) {
//           clearInterval(interval);

//           setRedirectPath(null);
//           updateContext({ isRedirecting: false, direction: undefined });

//           setStepIndex(stepIndex);
//           resumeTour();
//         }

//         elapsed += 200;
//         if (elapsed >= maxWait) {
//           clearInterval(interval);
//         }
//       }, 200);

//       return () => clearInterval(interval);
//     }
//   }, [redirectPath, pathname, context?.isRedirecting, status, steps, currentStepIndex]);



//   //* Redirect to new path based on action fired on handleJoyride @47
//   useEffect(() => {
//     if (
//       redirectPath &&
//       pathname !== redirectPath &&
//       context?.isRedirecting
//     ) {
//       router.push(redirectPath);
//     }
//   }, [redirectPath, pathname, context, router, setRedirectPath]);

//   console.log({
//     currentStepIndex, status
//   })

//   return (
//     <Joyride
//       steps={steps}
//       run={status === STATUS.RUNNING}
//       stepIndex={currentStepIndex}
//       callback={handleJoyrideCallback}
//       locale={locale}
//       showProgress
//       showSkipButton
//       continuous
//       disableOverlayClose
//       scrollToFirstStep
//       styles={{
//         options: {
//           arrowColor: resolvedTheme === 'dark' ? '#1a202c' : '#e3ffeb',
//           backgroundColor: resolvedTheme === 'dark' ? '#1a202c' : '#e3ffeb',
//           overlayColor: resolvedTheme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)',
//           primaryColor: resolvedTheme === 'dark' ? '#f7fafc' : '#000',
//           textColor: resolvedTheme === 'dark' ? '#cbd5e1' : '#004a14',
//           // width: 500,
//           zIndex: 1000,
//         },
//         buttonNext: {
//           backgroundColor: resolvedTheme === 'dark' ? '#111827' : '#c6f6d5', // darker tone
//           color: resolvedTheme === 'dark' ? '#e5e7eb' : '#1a202c', // ensure text is readable
//           border: '1px solid #00000020',
//           transition: 'background-color 0.2s ease, color 0.2s ease',
//         },
//       }}
//     />
//   );
// }
