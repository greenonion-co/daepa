import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect } from "react";

const Dialog = ({
  title,
  description,
  isOpen,
  onCloseAction,
  onConfirmAction,
  onExit,
}: {
  title: string;
  description: string;
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirmAction: () => void;
  onExit: () => void;
}) => {
  useEffect(() => {
    return () => onExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="rounded-4xl">
        <AlertDialogTitle className="p-4 pb-2">{title}</AlertDialogTitle>
        <AlertDialogDescription className="whitespace-pre-line px-4">
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
