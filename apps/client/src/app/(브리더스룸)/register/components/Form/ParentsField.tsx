import { useState } from "react";
import { useFormStore } from "../../store/form";
import SearchIcon from "@mui/icons-material/Search";
import ParentSearchSelector from "../selector/parent";

const SearchButton = ({ label, openSelector }: { label: string; openSelector: () => void }) => {
  const buttonStyle =
    "flex h-[calc(min(50vw,320px)-24px)] w-[calc(min(50vw,320px)-24px)] items-center justify-center rounded-2xl bg-gray-100 text-[#D9E1EC]";

  return (
    <div className="flex flex-col gap-2">
      <span className="font-bold text-blue-500">{label}</span>
      <button type="button" className={buttonStyle} onClick={openSelector}>
        <SearchIcon fontSize="large" className="text-gray-400" />
      </button>
    </div>
  );
};

const ParentsField = () => {
  const [isParentSearchOpen, setIsParentSearchOpen] = useState(false);
  const { formData, setFormData } = useFormStore();

  const openSelector = () => {
    setIsParentSearchOpen(true);
  };

  return (
    <>
      <div className="flex gap-2">
        <div className="flex gap-2">
          <SearchButton label="부" openSelector={openSelector} />
          <SearchButton label="모" openSelector={openSelector} />
        </div>

        <ParentSearchSelector
          isOpen={isParentSearchOpen}
          onClose={() => setIsParentSearchOpen(false)}
          onSelect={(value) => setFormData({ ...formData, parentSearch: value })}
        />
      </div>
    </>
  );
};

export default ParentsField;
