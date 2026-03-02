import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';
import { BookUser, Check, CreditCard, ListTodo, LoaderCircleIcon, LockKeyhole } from 'lucide-react';

const steps = [
  { title: 'User Details', icon: BookUser },
  { title: 'Payment Info', icon: CreditCard },
  { title: 'Auth OTP', icon: LockKeyhole },
  { title: 'Preview Form', icon: ListTodo },
];

const stepGroups = [
  { title: 'Create LoRA', icon: BookUser, subSteps: [1, 2] },
  { title: 'Generate Images', icon: CreditCard, subSteps: [3, 4] },
  { title: 'Enhance Photos', icon: LockKeyhole, subSteps: [5, 6] },
  { title: 'Generate Videos', icon: ListTodo, subSteps: [7, 8] },
  { title: 'Finalize & Export', icon: Check, subSteps: [9] }, // example last step
];


export default function Component() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div></div>
  );
}


const getProgressStep = (currentStep: number) => {
  for (let i = 0; i < stepGroups.length; i++) {
    if (stepGroups[i].subSteps.includes(currentStep)) {
      return i + 1; // progress step index (1 to 5)
    }
  }
  return 1; // fallback
}
