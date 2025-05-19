import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MorphAlert = ({
  isOpen,
  onCloseAction,
  onConfirmAction,
}: {
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirmAction: () => void;
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogTitle>종 변경 안내</AlertDialogTitle>
        <AlertDialogDescription>
          종을 변경하면 선택된 모프가 초기화됩니다.
          <br />
          계속하시겠습니까?
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCloseAction}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmAction}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MorphAlert;
