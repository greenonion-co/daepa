import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRegisterForm } from "../../hooks/useRegisterForm";
import { useFormStore } from "../../store/form";

const MorphAlert = () => {
  const { resetMorph } = useRegisterForm();
  const { showMorphResetAlert, setShowMorphResetAlert } = useFormStore();

  const closeAlert = () => {
    setShowMorphResetAlert(false);
  };

  return (
    <AlertDialog open={showMorphResetAlert}>
      <AlertDialogContent>
        <AlertDialogTitle>종 변경 안내</AlertDialogTitle>
        <AlertDialogDescription>
          종을 변경하면 선택된 모프가 초기화됩니다.
          <br />
          계속하시겠습니까?
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={closeAlert}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={resetMorph}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MorphAlert;
