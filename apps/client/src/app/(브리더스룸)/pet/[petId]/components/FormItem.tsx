const FormItem = ({ label, content }: { label: string; content: React.ReactNode }) => {
  return (
    <div className="flex gap-3 text-[14px]">
      <div className="flex min-w-[60px] pt-[6px]">{label}</div>
      <div className="flex flex-1">{content}</div>
    </div>
  );
};

export default FormItem;
