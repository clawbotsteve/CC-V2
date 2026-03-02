// import { Placement } from 'react-joyride';
// import { OnboardingStep } from './types';
// import React from 'react';
// import { TooltipContent } from './TooltipContent';

// export const onboardingSteps: OnboardingStep[] = [
//   {
//     target: 'body',
//     content: (
//       <TooltipContent
//         title="👋 Welcome to CoreGen!"
//         description="Let’s take a quick product tour to help you set up and start creating your own AI-generated content."
//         teaser="Click next to begin the tour."
//       />
//     ),
//     placement: 'center' as Placement,
//     path: '/dashboard',
//     disableBeacon: true,
//     spotlightClicks: false,
//     group: 'intro',
//     hideCloseButton: true,
//     disableOverlayClose: true,
//     disableScrolling: true,
//   },
//   {
//     target: '#influencers',
//     title: 'Train Your Model',
//     content: (
//       <TooltipContent
//         description="This is where you start training your own LoRA AI model. You’ll upload images of your subject to generate personalized content."
//         teaser="Click next to open the training dashboard."
//       />
//     ),
//     placement: 'auto',
//     path: '/dashboard',
//     data: {
//       next: '/tools/influencers'
//     },
//     group: 'intro',
//     disableBeacon: true,
//     spotlightClicks: false,
//     disableOverlayClose: true,
//     disableScrolling: true,
//   },
//   {
//     target: '#createLoraForm',
//     title: 'Upload Photos',
//     content: (
//       <TooltipContent
//         description="Upload 8–15 clear and diverse photos of your subject for best results."
//         list={[
//           'Different poses and expressions',
//           'Various backgrounds and lighting conditions',
//           'Avoid blurry, low-res, or duplicate photos',
//         ]}
//         teaser="Click next after uploading your photos."
//       />
//     ),
//     placement: 'left' as Placement,
//     path: '/tools/influencers',
//     data: {
//       prev: '/dashboard',
//       next: '/tools/influencers'
//     },
//     group: 'model',
//     disableBeacon: true,
//     spotlightClicks: true,
//     disableOverlayClose: true,
//     disableScrolling: true,
//     hideFooter: true,
//   },
//   {
//     target: 'body',
//     title: 'Training in Queue',
//     content: (
//       <TooltipContent
//         description="Your training job is now in queue. Once it’s done, you’ll be able to start generating images using your trained model."
//         teaser="Click next to move to the image generation section."
//       />
//     ),
//     placement: 'center' as Placement,
//     data: { previous: '/tools/influencers', next: '/tools/influencers' },
//     group: 'model',
//     disableBeacon: true,
//     spotlightClicks: false,
//     disableOverlayClose: true,
//     disableScrolling: true,
//   },
//   {
//     target: 'body',
//     title: 'Unlock Model Training',
//     content: (
//       <TooltipContent
//         description={
//           <>
//             Want to train your own AI model? <strong>Upgrade to Pro</strong> to unlock photo uploads and model creation features.
//           </>
//         }
//         teaser="Click next to view upgrade options."
//       />
//     ),
//     placement: 'center' as Placement,
//     data: { previous: '/dashboard', next: '/settings/billing' },
//     group: 'model',
//     disableBeacon: true,
//     spotlightClicks: false,
//     disableOverlayClose: true,
//     disableScrolling: true,
//   },
//   {
//     target: 'body',
//     title: 'Generate an Image',
//     content: (
//       <TooltipContent
//         description="Once your model is ready, you can start generating images using custom prompts."
//         teaser="Click next to open the image generator."
//       />
//     ),
//     placement: 'center' as Placement,
//     data: { previous: '/tools/influencers', next: '/tools/image-generation' },
//     group: 'image',
//     disableBeacon: true,
//     spotlightClicks: false,
//     disableOverlayClose: true,
//     disableScrolling: true,
//   },
//   {
//     target: 'body',
//     title: 'Customize Your Image',
//     content: (
//       <TooltipContent
//         description="Try different styles, moods, and prompt settings to bring your AI-generated visuals to life."
//         teaser="Click next to continue."
//       />
//     ),
//     placement: 'center' as Placement,
//     data: { previous: '/tools/influencers', next: '/tools/image-generation' },
//     group: 'image',
//     disableBeacon: true,
//     spotlightClicks: false,
//     disableOverlayClose: true,
//     disableScrolling: true,
//   },
//   {
//     target: 'body',
//     title: 'Generate a Video',
//     content: (
//       <TooltipContent
//         description="As a Pro user, you can animate your AI images into short videos. Ideal for marketing, content creation, or social media."
//         teaser="Click next to begin video generation."
//       />
//     ),
//     placement: 'center' as Placement,
//     data: { previous: '/tools/image-generation', next: '/tools/video-generation' },
//     group: 'video',
//     disableBeacon: true,
//     spotlightClicks: false,
//     disableOverlayClose: true,
//   },
//   {
//     target: 'body',
//     title: '🎉 You Did It!',
//     content: (
//       <TooltipContent
//         title="Congratulations!"
//         description="You've completed the setup and created your first AI video. You're now ready to explore, create, and grow with CoreGen."
//         teaser="Click Finish to exit the tour and start creating."
//       />
//     ),
//     placement: 'center' as Placement,
//     data: { previous: '/tools/image-generation' },
//     group: 'done',
//     disableBeacon: true,
//     spotlightClicks: false,
//     disableOverlayClose: true,
//     disableScrolling: true,
//   },
// ];


// // export const onboardingSteps: OnboardingStep[] = [
// //   // === GROUP: WELCOME ===
// //   {
// //     target: 'body',
// //     content: (
// //       <TooltipContent
// //         title="👋 Welcome to CoreGen!"
// //         description="Let’s take a quick product tour to help you set up and start creating your own AI-generated content."
// //         teaser="Click next to begin the tour."
// //       />
// //     ),
// //     placement: 'center' as Placement,
// //     disableBeacon: true,
// //     spotlightClicks: false,
// //     path: '/dashboard',
// //     data: { next: '/dashboard' },
// //     group: 'intro',
// //     hideFooter: false,
// //     hideCloseButton: false,
// //     disableOverlayClose: true,
// //     disableScrolling: true,
// //   },
// //   {
// //     target: '#influencers',
// //     title: 'Train Your Model',
// //     content: (
// //       <TooltipContent
// //         description="This is where you start training your own LoRA AI model. You’ll upload images of your subject to generate personalized content."
// //         teaser="Click next to open the training dashboard."
// //       />
// //     ),
// //     placement: 'center' as Placement,
// //     path: '/dashboard',
// //     data: { next: '/tools/influencers' },
// //     group: 'intro',
// //     disableBeacon: true,
// //     spotlightClicks: false,
// //     disableOverlayClose: true,
// //     disableScrolling: true,
// //     hideCloseButton: true,
// //     hideFooter: false,
// //   },

// //   // === GROUP: MODEL TRAINING (PRO USERS ONLY) ===
// //   {
// //     target: '#createLoraJoyride',
// //     title: 'Upload Photos',
// //     content: (
// //       <TooltipContent
// //         description="Upload 8–15 clear and diverse photos of your subject for best results."
// //         list={[
// //           'Different poses and expressions',
// //           'Various backgrounds and lighting conditions',
// //           'Avoid blurry, low-res, or duplicate photos',
// //         ]}
// //         teaser="Click next after uploading your photos."
// //       />
// //     ),
// //     placement: 'center' as Placement,
// //     path: '/tools/influencers',
// //     data: { previous: '/dashboard', next: '/tools/influencers' },
// //     // condition: (ctx) => ctx.userPlan === 'pro',
// //     group: 'model',
// //     disableBeacon: true,
// //     spotlightClicks: true,
// //     disableOverlayClose: true,
// //     disableScrolling: true,
// //     hideFooter: true,
// //     hideCloseButton: false,
// //   },
// //   {
// //     target: 'body',
// //     title: 'Training in Queue',
// //     content: (
// //       <TooltipContent
// //         description="Your training job is now in queue. Once it’s done, you’ll be able to start generating images using your trained model."
// //         teaser="Click next to move to the image generation section."
// //       />
// //     ),
// //     placement: 'center' as Placement,
// //     path: '/tools/influencers',
// //     data: { previous: '/tools/influencers', next: '/tools/influencers' },
// //     // condition: (ctx) => ctx.userPlan === 'pro',
// //     group: 'model',
// //     disableBeacon: true,
// //     spotlightClicks: false,
// //     disableOverlayClose: true,
// //     disableScrolling: true,
// //     hideFooter: false,
// //     hideCloseButton: false,
// //   },

// //   // === GROUP: MODEL TRAINING (FREE USERS ONLY) ===
// //   {
// //     target: '#upgrade-lora',
// //     title: 'Unlock Model Training',
// //     content: (
// //       <TooltipContent
// //         description={
// //           <>
// //             Want to train your own AI model? <strong>Upgrade to Pro</strong> to unlock photo uploads and model creation features.
// //           </>
// //         }
// //         teaser="Click next to view upgrade options."
// //       />
// //     ),
// //     placement: 'center' as Placement,
// //     path: '/settings/billing',
// //     data: { previous: '/dashboard', next: '/settings/billing' },
// //     // condition: (ctx) => ctx.userPlan !== 'pro',
// //     group: 'model',
// //     disableBeacon: true,
// //     spotlightClicks: false,
// //     disableOverlayClose: true,
// //     disableScrolling: true,
// //     hideFooter: false,
// //     hideCloseButton: false,
// //   },

// //   // === GROUP: IMAGE GENERATION ===
// //   {
// //     target: '#generate-image',
// //     title: 'Generate an Image',
// //     content: (
// //       <TooltipContent
// //         description="Once your model is ready, you can start generating images using custom prompts."
// //         teaser="Click next to open the image generator."
// //       />
// //     ),
// //     placement: 'center' as Placement,
// //     path: '/tools/influencers',
// //     data: { previous: '/tools/influencers', next: '/tools/image-generation' },
// //     group: 'image',
// //     disableBeacon: true,
// //     spotlightClicks: false,
// //     disableOverlayClose: true,
// //     disableScrolling: true,
// //     hideFooter: false,
// //     hideCloseButton: true,
// //   },
// //   {
// //     target: 'body',
// //     title: 'Customize Your Image',
// //     content: (
// //       <TooltipContent
// //         description="Try different styles, moods, and prompt settings to bring your AI-generated visuals to life."
// //         teaser="Click next to continue."
// //       />
// //     ),
// //     placement: 'center' as Placement,
// //     path: '/tools/image-generation',
// //     data: { previous: '/tools/influencers', next: '/tools/image-generation' },
// //     group: 'image',
// //     disableBeacon: true,
// //     spotlightClicks: false,
// //     disableOverlayClose: true,
// //     disableScrolling: true,
// //     hideFooter: false,
// //     hideCloseButton: false,
// //   },

// //   // === GROUP: VIDEO GENERATION (PRO USERS ONLY) ===
// //   {
// //     target: '#video-tab',
// //     title: 'Generate a Video',
// //     content: (
// //       <TooltipContent
// //         description="As a Pro user, you can animate your AI images into short videos. Ideal for marketing, content creation, or social media."
// //         teaser="Click next to begin video generation."
// //       />
// //     ),
// //     placement: 'center' as Placement,
// //     path: '/tools/video-generation',
// //     data: { previous: '/tools/image-generation', next: '/tools/video-generation' },
// //     // condition: (ctx) => ctx.userPlan === 'pro',
// //     group: 'video',
// //     disableBeacon: true,
// //     spotlightClicks: false,
// //     disableOverlayClose: true,
// //     hideFooter: false,
// //   },

// //   // === GROUP: DONE ===
// //   {
// //     target: 'body',
// //     title: '🎉 You Did It!',
// //     content: (
// //       <TooltipContent
// //         title="Congratulations!"
// //         description="You've completed the setup and created your first AI video. You're now ready to explore, create, and grow with CoreGen."
// //         teaser="Click Finish to exit the tour and start creating."
// //       />
// //     ),
// //     placement: 'center' as Placement,
// //     path: '/tools/video-generation',
// //     data: { previous: '/tools/image-generation' },
// //     group: 'done',
// //     disableBeacon: true,
// //     spotlightClicks: false,
// //     disableOverlayClose: true,
// //     disableScrolling: true,
// //     hideFooter: false,
// //     hideCloseButton: false,
// //   },
// // ];
