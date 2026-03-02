// 'use client'

// import { create } from 'zustand'
// import { persist } from 'zustand/middleware'
// import { STATUS, LIFECYCLE } from 'react-joyride'
// import { OnboardingStep } from '@/components/onboard/types'
// import { onboardingSteps } from '@/components/onboard/steps'

// export type OnboardingStatus = (typeof STATUS)[keyof typeof STATUS]
// export type OnboardingLifecycle = (typeof LIFECYCLE)[keyof typeof LIFECYCLE]

// export interface OnboardingStore {
//   key: string
//   steps: OnboardingStep[]
//   currentStepIndex: number
//   status: OnboardingStatus
//   lifecycle: OnboardingLifecycle
//   context: Record<string, any>
//   redirectPath: string | null

//   startTour: () => void;
//   pauseTour: () => void;
//   resumeTour: () => void;
//   resetTour: () => void;
//   finishTour: () => void;
//   nextStep: () => void;
//   prevStep: () => void;
//   goToStep: (index: number) => void;
//   skipTour: () => void;

//   setStepIndex: (index: number) => void;

//   updateStatus: (status: OnboardingStatus) => void
//   updateLifecycle: (lifecycle: OnboardingLifecycle) => void
//   updateContext: (context: Record<string, any>) => void
//   skipGroup: (group: string) => void

//   setRedirectPath: (path: string | null) => void
//   pauseAndRedirect: (path: string, direction: 'next' | 'prev') => void

//   // computed getter:
//   currentStep?: OnboardingStep
// }

// export const useOnboardingStore = create<OnboardingStore>()(
//   persist(
//     (set, get) => ({
//       key: '',
//       steps: onboardingSteps,
//       currentStepIndex: 0,
//       status: STATUS.IDLE,
//       lifecycle: LIFECYCLE.READY,
//       context: {},
//       redirectPath: '',

//       startTour: () => {
//         set({ currentStepIndex: 0, status: STATUS.RUNNING })
//       },

//       pauseTour: () => {
//         set({ status: STATUS.PAUSED })
//       },

//       resumeTour: () => {
//         set({ status: STATUS.RUNNING })
//       },

//       resetTour: () => {
//         set({ currentStepIndex: 0, status: STATUS.IDLE, lifecycle: LIFECYCLE.TOOLTIP })
//       },

//       finishTour: () => {
//         set({ status: STATUS.FINISHED });
//       },

//       nextStep: () => {
//         const { currentStepIndex, steps } = get();
//         if (currentStepIndex + 1 < steps.length) {
//           set({ currentStepIndex: currentStepIndex + 1 });
//         } else {
//           set({ status: STATUS.FINISHED });
//         }
//       },

//       prevStep: () => {
//         const { currentStepIndex } = get();
//         if (currentStepIndex > 0) {
//           set({ currentStepIndex: currentStepIndex - 1 });
//         }
//       },

//       goToStep: (index: number) => {
//         const { steps } = get();
//         if (index >= 0 && index < steps.length) {
//           set({ currentStepIndex: index });
//         }
//       },

//       skipTour: () => {
//         set({ status: STATUS.SKIPPED });
//       },

//       setStepIndex: (index) => set({ currentStepIndex: index }),

//       updateStatus: (status) => set({ status }),

//       updateLifecycle: (lifecycle) => set({ lifecycle }),

//       updateContext: (context) => {
//         const current = get().context
//         if (!isShallowEqual(current, context)) set({ context })
//       },

//       skipGroup: (group: string) => {
//         const { steps, currentStepIndex } = get()
//         const nextIndex = steps.findIndex(
//           (step, idx) => idx > currentStepIndex && step.group !== group
//         )
//         if (nextIndex !== -1) {
//           set({ currentStepIndex: nextIndex })
//         } else {
//           set({ status: STATUS.FINISHED })
//         }
//       },

//       // use a util
//       setRedirectPath: (path) => set({ redirectPath: path }),

//       // use in handleJoyride
//       pauseAndRedirect: (path: string, direction: 'next' | 'prev') => {
//         const { pauseTour, updateContext } = get();
//         pauseTour();
//         updateContext({ isRedirecting: true, direction: direction });
//         set({ redirectPath: path });
//       },

//       // computed getter inside the store
//       get currentStep() {
//         const state = get()
//         return state.steps[state.currentStepIndex]
//       },
//     }),
//     {
//       name: 'onboarding-store',
//       partialize: (state) => ({
//         key: state.key,
//         context: state.context,
//         currentStepIndex: state.currentStepIndex,
//         status: state.status,
//         lifecycle: state.lifecycle,
//       }),
//     }
//   )
// )

// const isShallowEqual = (obj1: Record<string, any>, obj2: Record<string, any>) => {
//   const keys1 = Object.keys(obj1)
//   const keys2 = Object.keys(obj2)
//   if (keys1.length !== keys2.length) return false
//   for (const key of keys1) {
//     if (obj1[key] !== obj2[key]) return false
//   }
//   return true
// }
