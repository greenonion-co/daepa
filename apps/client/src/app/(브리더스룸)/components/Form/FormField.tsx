import { cn } from "@/lib/utils";
import { FieldName, FormErrors, FormStep } from "../../register/types";
import FileField from "./FileField";
import NumberField from "./NumberField";
import Close from "@mui/icons-material/Close";
import ParentLink from "../../pet/components/ParentLink";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { toast } from "sonner";
import { CalendarIcon, InfoIcon } from "lucide-react";
import { useSelect } from "../../register/hooks/useSelect";
import { FormData } from "../../register/store/pet";
import { PetParentDtoWithMessage } from "../../pet/store/parentLink";
import { usePathname } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
interface FormFieldProps {
  label?: string;
  field: FormStep["field"];
  formData: FormData;
  errors?: FormErrors;
  disabled?: boolean;
  handleChange: (value: { type: FieldName; value: any }) => void;
  handleMultipleSelect?: (type: FieldName) => void;
}

export const FormField = ({
  label,
  field,
  formData,
  errors = {},
  disabled,
  handleChange,
  handleMultipleSelect,
}: FormFieldProps) => {
  const { handleSelect } = useSelect();
  const { name, placeholder, type } = field;
  const value = formData[name as keyof FormData];
  const isRegister = usePathname().includes("register");

  const error = errors?.[name];

  const inputClassName = cn(
    `text-[16px] w-full h-9 pr-1 text-left focus:outline-none focus:ring-0 text-gray-400 dark:text-gray-400
    transition-all duration-300 ease-in-out placeholder:text-gray-400 flex items-center `,
    !disabled && "border-b-[1.2px] border-b-gray-200 focus:border-b-[1.8px] focus:border-[#1A56B3]",
    error && "border-b-red-500 focus:border-b-red-500",
  );

  const handleSelectParent = (type: "father" | "mother", value: PetParentDtoWithMessage) => {
    handleChange({ type, value });
    toast.success("부모 선택이 완료되었습니다.");
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
              // TODO: 로그인/회원가입 후 현재 유저 아이디 전달
              currentPetOwnerId={"ADMIN"}
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
              // TODO: 로그인/회원가입 후 현재 유저 아이디 전달
              currentPetOwnerId={"ADMIN"}
            />
          </div>
        );
      case "textarea": {
        const maxLength = 500;
        const currentLength = (value as string)?.length || 0;

        return (
          <div className="relative pt-2">
            <textarea
              name={name}
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
          <div
            className={cn(inputClassName, `${value && "text-black"}`)}
            onClick={() => {
              if (!isRegister && name === "species") {
                toast.error("종은 변경할 수 없습니다.");
                return;
              }

              handleSelect({
                type: name,
                value: value as string,
                handleNext: handleChange,
              });
            }}
          >
            {name === "sex"
              ? (GENDER_KOREAN_INFO[value as string as keyof typeof GENDER_KOREAN_INFO] ??
                placeholder)
              : name === "species"
                ? (SPECIES_KOREAN_INFO[value as string as keyof typeof SPECIES_KOREAN_INFO] ??
                  placeholder)
                : ((value as string) ?? placeholder)}
          </div>
        );
      case "multipleSelect":
        return (
          <div className="flex flex-col gap-2">
            {!disabled && (
              <div className={inputClassName} onClick={() => handleMultipleSelect?.(name)}>
                {placeholder}
              </div>
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
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <button
                data-field-name={field.name}
                className={cn(
                  inputClassName,
                  "flex w-full items-center justify-between",
                  value && "text-black",
                )}
              >
                {value ? format(new Date(value), "yyyy년 MM월 dd일") : placeholder}
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  if (date) {
                    handleChange({ type: field.name, value: date.toISOString() });

                    const trigger = document.querySelector(
                      `button[data-field-name="${field.name}"]`,
                    );
                    if (trigger) {
                      (trigger as HTMLButtonElement).click();
                    }
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      default:
        return (
          <input
            disabled={disabled}
            name={name}
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
      {error && (
        <div className="mt-1 flex items-center gap-1">
          <InfoIcon className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
};
