import { usePetStore } from "../../register/store/pet";
import { PhotoViewer } from "./PhotoViewer";

import Add from "@mui/icons-material/Add";

const FileField = () => {
  const { formData, setFormData } = usePetStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newPhotos = [...((formData.photos as string[]) || [])];
      const promises = files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((results) => {
        const updatedPhotos = [...newPhotos, ...results].slice(0, 3);
        setFormData({ ...formData, photos: updatedPhotos });
      });
    }
  };

  const handleDelete = (index: number) => {
    const updatedPhotos = [...(formData.photos as string[])];
    updatedPhotos.splice(index, 1);
    setFormData({ ...formData, photos: updatedPhotos });
  };

  return (
    <>
      <p className="pb-1 text-sm text-blue-500">최대 3장까지 업로드 가능합니다.</p>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="photo-upload"
        multiple
        onChange={handleFileChange}
      />
      {formData.photos && (formData.photos as string[]).length > 0 ? (
        <PhotoViewer photos={formData.photos as string[]} onDelete={handleDelete} />
      ) : (
        <label
          htmlFor="photo-upload"
          className="flex h-[130px] w-full cursor-pointer items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-600/50"
        >
          <div className="text-center">
            <Add fontSize="large" className="text-gray-400" />
          </div>
        </label>
      )}
    </>
  );
};

export default FileField;
