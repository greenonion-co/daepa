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
  confirmText = "확인",
  cancelText = "취소",
}: {
  title: string;
  description: string;
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirmAction: () => void;
  onExit: () => void;
  confirmText?: string;
  cancelText?: string;
}) => {
  useEffect(() => {
    return () => onExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogTitle className="p-0 pb-0">{title}</AlertDialogTitle>
        <AlertDialogDescription className="whitespace-pre-line">
          {description}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCloseAction}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmAction}>{confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Dialog;
