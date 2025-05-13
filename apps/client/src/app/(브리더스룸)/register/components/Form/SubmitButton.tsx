const SubmitButton = ({ label, onClick }: { label: string; onClick: () => void }) => {
  return (
    <button
      type="submit"
      className="h-12 w-full cursor-pointer rounded-2xl bg-[#247DFE] text-lg font-bold text-white"
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default SubmitButton;
