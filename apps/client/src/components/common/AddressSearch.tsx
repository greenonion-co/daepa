"use client";

import { useDaumPostcodePopup } from "react-daum-postcode";

interface AddressSearchProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
}

const parseAddress = (value: string) => {
  const idx = value.indexOf(",");
  if (idx === -1) return { main: value, detail: "" };
  return { main: value.slice(0, idx), detail: value.slice(idx + 1).trimStart() };
};

const AddressSearch = ({
  value,
  onChange,
  placeholder = "주소를 검색하세요",
  className,
}: AddressSearchProps) => {
  const openPostcode = useDaumPostcodePopup();
  const { main, detail } = parseAddress(value);

  const handleClick = () => {
    openPostcode({
      onComplete: (data) => {
        const mainAddress = data.roadAddress || data.jibunAddress;
        onChange(detail ? `${mainAddress}, ${detail}` : mainAddress);
      },
    });
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDetail = e.target.value;
    onChange(newDetail ? `${main}, ${newDetail}` : main);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={main}
          placeholder={placeholder}
          className={className}
          onClick={handleClick}
        />
        <button
          type="button"
          onClick={handleClick}
          className="shrink-0 rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
        >
          주소 검색
        </button>
      </div>
      {main && (
        <input
          type="text"
          value={detail}
          onChange={handleDetailChange}
          placeholder="상세주소를 입력하세요"
          className={className}
        />
      )}
    </div>
  );
};

export default AddressSearch;
