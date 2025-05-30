import { cn } from "@/lib/utils";
import { FieldName, FormData, FormErrors, FormStep } from "../../register/types";
import FileField from "./FileField";
import NumberField from "./NumberField";
import Close from "@mui/icons-material/Close";
import ParentLink from "../../pet/components/ParentLink";
import { useRegisterForm } from "../../register/hooks/useRegisterForm";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { toast } from "sonner";
import { PetSummaryDto } from "@repo/api-client";
import { InfoIcon } from "lucide-react";
interface FormFieldProps {
  label?: string;
  field: FormStep["field"];
  formData: FormData;
  errors: FormErrors;
  disabled?: boolean;
  handleChange: (value: {
    type: FieldName;
    value: string | string[] | PetSummaryDto | null;
  }) => void;
}

export const FormField = ({
  label,
  field,
  formData,
  errors,
  disabled,
  handleChange,
}: FormFieldProps) => {
  const { handleSelect, handleMultipleSelect } = useRegisterForm();
  const { name, placeholder, type } = field;
  const value = formData[name];

  const error = errors[name];
  const inputClassName = cn(
    `text-[16px] w-full h-9 pr-1 text-left focus:outline-none focus:ring-0 text-gray-400 dark:text-gray-400
    transition-all duration-300 ease-in-out placeholder:text-gray-400`,
    !disabled && "border-b-[1.2px] border-b-gray-200 focus:border-b-[2px] focus:border-[#1A56B3]",
    error && "border-b-red-500",
  );

  const handleSelectParent = (
    type: "father" | "mother",
    value: PetSummaryDto & { message: string },
  ) => {
    handleChange({ type, value });
    toast.success("부모 선택 해제가 완료되었습니다.");
  };

  const handleUnlink = (type: "father" | "mother") => {
    handleChange({ type, value: null });
    toast.success("부모 선택 해제가 완료되었습니다.");
  };

  const renderField = () => {
    switch (type) {
      case "file":
        return <FileField />;
      case "number":
        return disabled && !value ? (
          <div className="h-9 w-full text-left text-gray-400">-</div>
        ) : (
          <NumberField
            disabled={disabled}
            inputClassName={inputClassName}
            field={field}
            value={String(value || "")}
            setValue={handleChange}
            placeholder={placeholder}
          />
        );
      case "parentSearch":
        return (
          <div className="flex gap-2">
            <ParentLink
              label="부"
              data={formData.father}
              onSelect={(item) => {
                handleSelectParent("father", item);
              }}
              onUnlink={() => {
                handleUnlink("father");
              }}
            />
            <ParentLink
              label="모"
              data={formData.mother}
              onSelect={(item) => {
                handleSelectParent("mother", item);
              }}
              onUnlink={() => {
                handleUnlink("mother");
              }}
            />
          </div>
        );
      case "textarea": {
        const maxLength = 600;
        const currentLength = (value as string)?.length || 0;

        return (
          <div className="relative pt-2">
            <textarea
              className={`min-h-[160px] w-full rounded-xl bg-gray-100 p-4 text-left text-[18px] focus:outline-none focus:ring-0 dark:bg-gray-600/50 dark:text-white`}
              value={String(value || "")}
              maxLength={maxLength}
              onChange={(e) => handleChange({ type: field.name, value: e.target.value })}
              disabled={disabled}
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            {!disabled && (
              <div className="absolute bottom-4 right-4 text-sm text-gray-500">
                {currentLength}/{maxLength}
              </div>
            )}
          </div>
        );
      }
      case "select":
        return (
          <button
            className={cn(inputClassName, `${value && "text-black"}`)}
            disabled={disabled}
            onClick={() => handleSelect(name)}
          >
            {name === "sex"
              ? (GENDER_KOREAN_INFO[value as string as keyof typeof GENDER_KOREAN_INFO] ??
                placeholder)
              : name === "species"
                ? (SPECIES_KOREAN_INFO[value as string as keyof typeof SPECIES_KOREAN_INFO] ??
                  placeholder)
                : ((value as string) ?? placeholder)}
          </button>
        );
      case "multipleSelect":
        return (
          <div className="flex flex-col gap-2">
            {!disabled && (
              <button className={inputClassName} onClick={() => handleMultipleSelect(name)}>
                {placeholder}
              </button>
            )}
            <div className="flex flex-wrap gap-1">
              {Array.isArray(value) &&
                value.length > 0 &&
                value.map((item) => (
                  <div
                    className={cn(
                      `mb-2 flex items-center gap-2 rounded-full border-2 border-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[14px] font-semibold text-[#1A56B3]`,
                      disabled &&
                        "rounded-xl border-gray-200 bg-gray-100 text-black dark:bg-gray-600/50 dark:text-white",
                    )}
                    key={item}
                  >
                    <span>{item}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => {
                          handleChange({
                            type: name,
                            value: (value || []).filter((m) => m !== item),
                          });
                        }}
                      >
                        <Close fontSize="small" className="text-[#1A56B3]" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        );
      default:
        return (
          <input
            disabled={disabled}
            type={field.type}
            className={cn(inputClassName, "text-black dark:text-white")}
            value={String(value || "")}
            placeholder={placeholder}
            onChange={(e) => handleChange({ type: field.name, value: e.target.value })}
          />
        );
    }
  };

  return (
    <div className="flex flex-col">
      {label && <h2 className="text-lg text-gray-500">{label}</h2>}
      {field?.info ? (
        <div className="mb-2 flex items-center gap-1">
          <InfoIcon className="h-3.5 w-3.5 text-green-600" />
          <p className="text-sm text-green-600">{field.info}</p>
        </div>
      ) : (
        <div className="h-1" />
      )}
      {renderField()}
    </div>
  );
};
