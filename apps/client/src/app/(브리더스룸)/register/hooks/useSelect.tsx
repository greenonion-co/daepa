import { useCallback } from "react";
import { FieldName } from "../types";
import { overlay } from "overlay-kit";
import { SELECTOR_CONFIGS } from "../../constants";
import Selector from "../../components/selector";

export const useSelect = () => {
  const handleSelect = useCallback(
    ({
      type,
      value,
      handleNext,
    }: {
      type: FieldName;
      value: string;
      handleNext: (value: { type: FieldName; value: string }) => void;
    }) => {
      if (type === "species" || type === "growth" || type === "sex" || type === "eggStatus") {
        const config = SELECTOR_CONFIGS[type];

        overlay.open(({ isOpen, close, unmount }) => {
          return (
            <Selector
              isOpen={isOpen}
              onCloseAction={close}
              onSelectAction={(value) => {
                handleNext({ type, value });
                close();
              }}
              selectList={config.selectList}
              title={config.title}
              currentValue={value}
              type={type}
              onExit={unmount}
            />
          );
        });
      }
    },
    [],
  );

  return { handleSelect };
};
