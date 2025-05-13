"use client";

import { cn } from "@/lib/utils";
import { FORM_STEPS, OPTION_STEPS, REGISTER_PAGE, SELECTOR_CONFIGS } from "../../constants";
import { FormHeader } from "../components/Form/FormHeader";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { FieldName, FormStep } from "../types";
import { useFormStore } from "../store/form";
import Selector from "../components/selector";
import { overlay } from "overlay-kit";
import InfoOutline from "@mui/icons-material/InfoOutline";
import MorphSelector from "../components/selector/morph";
import Close from "@mui/icons-material/Close";
import SubmitButton from "../components/Form/SubmitButton";
import MorphAlert from "../components/Form/MorphAlert";
import { useEffect, use } from "react";
import FileField from "../components/Form/FileField";
import ParentsField from "../components/Form/ParentsField";
import NumberField from "../components/Form/NumberField";
import { useSidebar } from "@/components/ui/sidebar";

export default function RegisterPage({ params }: { params: Promise<{ funnel: string }> }) {
  const { handleNext, goNext } = useRegisterForm();
  const { formData, step, errors, setFormData } = useFormStore();
  const { state, isMobile } = useSidebar();

  const resolvedParams = use(params);
  const funnel = Number(resolvedParams.funnel);
  const visibleSteps = FORM_STEPS.slice(-step - 1);

  useEffect(() => {
    if (funnel === REGISTER_PAGE.SECOND) return;
    const currentStep = FORM_STEPS[FORM_STEPS.length - step - 1];
    if (!currentStep) return;

    const { field } = currentStep;
    if (formData[field.name]) return;

    if (field.type === "select") {
      handleSelect(field.name);
    } else if (field.type === "multipleSelect") {
      handleMorphSelect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleSelect = (type: FieldName) => {
    const config = SELECTOR_CONFIGS[type];

    overlay.open(({ isOpen, close }) => (
      <Selector
        isOpen={isOpen}
        onCloseAction={close}
        onSelectAction={(value) => {
          handleNext({ type, value });
          close();
        }}
        selectList={config.selectList}
        title={config.title}
        currentValue={formData[type]}
      />
    ));
  };

  const handleMorphSelect = () => {
    overlay.open(({ isOpen, close }) => (
      <MorphSelector
        isOpen={isOpen}
        onCloseAction={close}
        onSelectAction={(value) => {
          handleNext({ type: "morph", value });
          close();
        }}
      />
    ));
  };

  const handleMorphRemove = (morph: string) => {
    setFormData((prev) => ({
      ...prev,
      morph: (prev.morph as string[]).filter((m) => m !== morph),
    }));
  };

  const renderField = (field: FormStep["field"]) => {
    const { name, placeholder, type } = field;
    const value = formData[name];
    const error = errors[name];
    const inputClassName = `text-[20px] w-full border-b-[1.2px] border-b-gray-200 h-9 pr-1 text-left focus:outline-none focus:ring-0 text-gray-400 dark:border-b-gray-600 dark:text-gray-400 ${error && "border-b-red-500"}`;

    switch (type) {
      case "file":
        return <FileField />;
      case "number":
        return <NumberField inputClassName={inputClassName} field={field} value={value} />;
      case "parentSearch":
        return <ParentsField />;
      case "textarea":
        return (
          <textarea
            className={`w-full rounded-xl bg-gray-100 p-4 text-left text-[20px] focus:outline-none focus:ring-0 dark:bg-gray-600/50 dark:text-white`}
            rows={4}
            value={value}
            onChange={(e) => handleNext({ type: field.name, value: e.target.value })}
          />
        );
      case "select":
        return (
          <button
            className={cn(inputClassName, `${value && "font-semibold text-black"}`)}
            onClick={() => handleSelect(name)}
          >
            {value || placeholder}
          </button>
        );
      case "multipleSelect":
        return (
          <div className="flex flex-col gap-2">
            <button className={inputClassName} onClick={handleMorphSelect}>
              {placeholder}
            </button>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(formData.morph) &&
                formData.morph.length > 0 &&
                formData.morph.map((morph) => (
                  <div
                    className={`mb-2 flex items-center gap-2 rounded-full bg-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[#D9E1EC]`}
                    key={morph}
                  >
                    <span>{morph}</span>
                    <button type="button" onClick={() => handleMorphRemove(morph)}>
                      <Close fontSize="small" className="text-white" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            className={cn(inputClassName, "text-black dark:text-white")}
            value={value || ""}
            onChange={(e) => handleNext({ type: field.name, value: e.target.value })}
          />
        );
    }
  };
  return (
    <div className="relative mx-auto min-h-screen max-w-[640px] p-4 pb-20">
      <FormHeader funnel={funnel} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {funnel === REGISTER_PAGE.FIRST && (
          <>
            {visibleSteps.map((step) => {
              const { title, field } = step;
              return (
                <div key={title}>
                  <h2 className="text-lg text-gray-500">{title}</h2>
                  {renderField(field)}
                  {errors[field.name] && (
                    <div className="flex items-center gap-1">
                      <InfoOutline fontSize="small" className="text-red-500" />
                      <p className="text-sm font-semibold text-red-500">{errors[field.name]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {funnel === REGISTER_PAGE.SECOND && (
          <>
            {OPTION_STEPS.map((step) => (
              <div key={step.title} className="mb-6 space-y-2">
                <h2 className="text-lg text-gray-500">{step.title}</h2>
                <div key={step.field.name}>{renderField(step.field)}</div>
              </div>
            ))}
          </>
        )}
      </form>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] dark:bg-black",
          !isMobile && state === "expanded" && "ml-[255px]",
        )}
      >
        <div className="mx-auto max-w-[640px]">
          <SubmitButton label="다음" onClick={() => goNext()} />
        </div>
      </div>

      <MorphAlert />
    </div>
  );
}
