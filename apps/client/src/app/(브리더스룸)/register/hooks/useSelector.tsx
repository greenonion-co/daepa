import { overlay } from "overlay-kit";
import Selector from "@/app/(브리더스룸)/register/components/selector";
import MorphSelector from "../components/selector/morph";

export function useSelector() {
  const openSelector = ({
    title,
    selectList,
    currentValue,
    onSelect,
  }: {
    title: string;
    selectList: string[];
    currentValue?: string;
    onSelect: (value: string) => void;
  }) => {
    return overlay.open(({ isOpen, close }) => (
      <Selector
        title={title}
        isOpen={isOpen}
        onClose={close}
        onSelect={(value) => {
          onSelect(value);
          close();
        }}
        currentValue={currentValue}
        selectList={selectList}
      />
    ));
  };

  const openMorphSelector = ({
    species,
    currentMorphs,
    onSelect,
  }: {
    species: string;
    currentMorphs?: string[];
    onSelect: (value: string[]) => void;
  }) => {
    return overlay.open(({ isOpen, close }) => (
      <MorphSelector
        isOpen={isOpen}
        onClose={close}
        species={species}
        currentMorphs={currentMorphs}
        onSelect={onSelect}
      />
    ));
  };

  return { openSelector, openMorphSelector };
}
