import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Dialog = ({
  title,
  description,
  isOpen,
  onCloseAction,
  onConfirmAction,
}: {
  title: string;
  description: string;
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirmAction: () => void;
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription className="whitespace-pre-line">
          {description}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCloseAction}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmAction}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Dialog;
