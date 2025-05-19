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
interface FormFieldProps {
  field: FormStep["field"];
  formData: FormData;
  errors: FormErrors;
  disabled?: boolean;
  handleChange: (value: { type: FieldName; value: string | string[] | PetSummaryDto }) => void;
}

export const FormField = ({ field, formData, errors, disabled, handleChange }: FormFieldProps) => {
  const { handleSelect, handleMultipleSelect } = useRegisterForm();
  const { name, placeholder, type } = field;
  const value = formData[name];

  const error = errors[name];
  const inputClassName = cn(
    `text-[20px] w-full  h-9 pr-1 text-left focus:outline-none focus:ring-0 text-gray-400 dark:border-b-gray-600 dark:text-gray-400`,
    !disabled && " border-b-[1.2px] border-b-gray-200",
    error && "border-b-red-500",
  );

  const handleSelectParent = (type: "father" | "mother", value: PetSummaryDto) => {
    handleChange({ type, value });
    toast.success("부모 선택 해제가 완료되었습니다.");
  };

  const handleUnlink = (type: "father" | "mother") => {
    handleChange({ type, value: null });
    toast.success("부모 선택 해제가 완료되었습니다.");
  };

  switch (type) {
    case "file":
      return <FileField />;
    case "number":
      return (
        <NumberField
          disabled={disabled}
          inputClassName={inputClassName}
          field={field}
          value={value || ""}
          setValue={handleChange}
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
    case "textarea":
      return (
        <textarea
          className={`w-full rounded-xl bg-gray-100 p-4 text-left text-[18px] focus:outline-none focus:ring-0 dark:bg-gray-600/50 dark:text-white`}
          rows={4}
          value={value || ""}
          onChange={(e) => handleChange({ type: field.name, value: e.target.value })}
          disabled={disabled}
        />
      );
    case "select":
      return (
        <button
          className={cn(inputClassName, `${value && "font-semibold text-black"}`)}
          disabled={disabled}
          onClick={() => {
            handleSelect(name);
          }}
        >
          {name === "sex"
            ? GENDER_KOREAN_INFO[value as keyof typeof GENDER_KOREAN_INFO]
            : name === "species"
              ? SPECIES_KOREAN_INFO[value as keyof typeof SPECIES_KOREAN_INFO]
              : value || placeholder}
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
                  className={`mb-2 flex items-center gap-2 rounded-full bg-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[#D9E1EC]`}
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
                      <Close fontSize="small" className="text-white" />
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
          value={value || ""}
          onChange={(e) => handleChange({ type: field.name, value: e.target.value })}
        />
      );
  }
};
