import Close from "@mui/icons-material/Close";
import { useFormStore } from "../../store/form";

const MorphField = ({
  inputClassName,
  handleMorphSelectorOpen,
}: {
  inputClassName: string;
  handleMorphSelectorOpen: () => void;
}) => {
  const { formData, setFormData } = useFormStore();
  const handleMorphRemove = (morph: string) => {
    setFormData((prev) => ({
      ...prev,
      morph: (prev.morph as string[]).filter((m) => m !== morph),
    }));
  };

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className={inputClassName} onClick={handleMorphSelectorOpen}>
        <span className="text-gray-400">모프를 선택해주세요</span>
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
};

export default MorphField;
