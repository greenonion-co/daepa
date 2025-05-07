import { FormStep } from "../types";

import { ReactNode } from "react";
import { FORM_STEPS } from "../../constants";
import InfoOutline from "@mui/icons-material/InfoOutline";

const StepForm = ({
  currentStep,
  completedSteps,
  currentStepData,
  renderField,
  errors,
  handleSubmit,
}: {
  currentStep: number;
  completedSteps: number[];
  currentStepData: FormStep;
  renderField: (field: FormStep["fields"]) => ReactNode;
  errors: Record<string, string>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) => {
  return (
    <>
      {currentStep < FORM_STEPS.length && (
        <div className="space-y-1 pb-4">
          <h2 className="text-lg text-gray-500">{currentStepData.title}</h2>
          <div key={currentStepData.fields.name}>
            {renderField(currentStepData.fields)}
            {errors[currentStepData.fields.name] && (
              <div className="flex items-center gap-1">
                <InfoOutline fontSize="small" className="text-red-500" />
                <p className="text-sm font-semibold text-red-500">
                  {errors[currentStepData.fields.name]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-20 space-y-4">
        {[...completedSteps].reverse().map((stepIndex) => {
          const step = FORM_STEPS[stepIndex] as FormStep;
          return (
            <div key={step.title}>
              <h2 className="text-lg text-gray-500">{step.title}</h2>
              <div key={step.fields.name}>
                {renderField(step.fields)}
                {errors[step.fields.name] && (
                  <div className="flex items-center gap-1">
                    <InfoOutline fontSize="small" className="text-red-500" />
                    <p className="text-sm font-semibold text-red-500">{errors[step.fields.name]}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </form>
    </>
  );
};

export default StepForm;
