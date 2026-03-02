// import { OnboardingStore } from '@/hooks/use-onboarding-store';
// import { CallBackProps, ACTIONS, EVENTS, STATUS } from 'react-joyride';

// export function handleJoyride(data: CallBackProps, store: OnboardingStore) {
//   const {
//     action,
//     index,
//     status,
//     type,
//     step,
//     lifecycle,
//     origin,
//     controlled,
//     size,
//   } = data;

//   const currentStep = store.steps[index];
//   const nextStep = store.steps[index + 1];
//   const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

//   // ----- HANDLE EVENTS -----

//   switch (type) {
//     case EVENTS.TOUR_START:
//       break;

//     case EVENTS.STEP_BEFORE:
//       break;

//     case EVENTS.BEACON:
//       break;

//     case EVENTS.TOOLTIP:
//       break;

//     case EVENTS.STEP_AFTER:

//       switch (action) {

//         //* Go to next Step
//         case ACTIONS.NEXT:

//           //* check if next is a new route
//           if (
//             currentStep?.path &&
//             currentStep.data?.next &&
//             currentStep.path !== currentStep.data?.next
//           ) {
//             store.pauseAndRedirect(currentStep.data?.next, 'next')
//             break;
//           }

//           //* otherwise proceed
//           store.nextStep();
//           break;


//         //* Go to previous step
//         case ACTIONS.PREV:
//           if (index > 0) {

//             //* check if prev is a new route
//             if (
//               currentStep?.path &&
//               currentStep.data?.prev &&
//               currentStep.path !== currentStep.data?.prev
//             ) {
//               store.pauseAndRedirect(currentStep.data?.prev, 'prev')
//               break;
//             }

//             //* otherwise, proceed
//             store.prevStep();
//           }
//           break;

//         //* Uncharted
//         case ACTIONS.SKIP:
//           break;

//         //* Close button on top
//         case ACTIONS.CLOSE:
//           store.pauseTour()
//           break;

//         default:
//           break;
//       }

//       break;

//     //* Skip button, finish tour immidiately
//     case EVENTS.TOUR_END:
//       store.finishTour()
//       break;

//     case EVENTS.TOUR_STATUS:
//       break;

//     case EVENTS.TARGET_NOT_FOUND:
//       store.pauseTour();
//       store.updateContext({
//         missingTargetStep: store.currentStepIndex,
//         missingTarget: step?.target,
//       });

//       console.error(`[Joyride] Target not found for step ${store.currentStepIndex}:`, step?.target);
//       break;

//     case EVENTS.ERROR:
//       console.error('[Joyride] Error event:', data);

//       break;
//   }
// }
