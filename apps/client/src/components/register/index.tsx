"use client";

import { useState, useEffect } from "react";
import ParentSearch from "@/components/register/components/selector/parent";
import { FORM_STEPS, OPTION_STEPS, USER_NAME } from "./constants";
import { FORM_STEP } from "./types";
import { PhotoViewer } from "./components/PhotoViewer";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useSelector } from "./hooks";

export default function RegisterPage() {
  const { openSelector, openMorphSelector } = useSelector();
  const [currentPage, setCurrentPage] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showMorphResetAlert, setShowMorphResetAlert] = useState(false);
  const [isParentSearchOpen, setIsParentSearchOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const currentStepData = FORM_STEPS[currentStep] as FORM_STEP;

  const handleSpeciesSelectorOpen = () => {
    openSelector({
      title: "종 선택",
      selectList: ["레오파드 게코", "크레스티드 게코"],
      currentValue: formData.species as string,
      onSelect: (species) => {
        if (handleSpeciesSelect(species)) {
          const newFormData = { ...formData, species };
          setFormData(newFormData);
          handleNext(newFormData);
        }
      },
    });
  };

  const handleMorphSelectorOpen = () => {
    openMorphSelector({
      species: formData.species as string,
      currentMorphs: Array.isArray(formData.morph) ? formData.morph : [],
      onSelect: (morphs) => {
        const newFormData = { ...formData, morph: morphs };
        setFormData(newFormData);
        handleNext(newFormData);
      },
    });
  };

  const handleSizeSelectorOpen = () => {
    openSelector({
      title: "크기 선택",
      selectList: ["베이비", "아성체", "준성체", "성체"],
      currentValue: formData.size as string,
      onSelect: (size) => {
        const newFormData = { ...formData, size };
        setFormData(newFormData);
        handleNext(newFormData);
      },
    });
  };

  const handleGenderSelectorOpen = () => {
    openSelector({
      title: "성별 선택",
      selectList: ["수컷", "암컷", "미구분"],
      currentValue: formData.gender as string,
      onSelect: (gender) => {
        const newFormData = { ...formData, gender };
        setFormData(newFormData);
      },
    });
  };

  useEffect(() => {
    if (currentPage === 0) {
      switch (currentStep) {
        case 0:
          handleSpeciesSelectorOpen();
          break;
        case 1:
          handleMorphSelectorOpen();
          break;
        case 2:
          handleSizeSelectorOpen();
          break;
        case 3:
          handleGenderSelectorOpen();
          break;
        default:
          break;
      }
    }
  }, [currentStep]);

  const validateStep = (formData: Record<string, string | string[]>) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.entries(formData).forEach(([key, value]) => {
      const field = FORM_STEPS.find((step) => step.fields.some((field) => field.name === key));
      if (field) {
        if (field.fields.some((field) => field.required && !value)) {
          newErrors[key] = "필수 입력 항목입니다.";
          isValid = false;
        } else if (
          field.fields.some((field) => field.validation && !field.validation(value as string))
        ) {
          newErrors[key] = "유효하지 않은 값입니다.";
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = (formData: Record<string, string | string[]>) => {
    if (currentPage === 1) {
      console.log("등록하기");
      return;
    }

    if (
      !validateStep(formData) ||
      currentStep !== Object.keys(formData).length - 1 ||
      FORM_STEPS.length === Object.keys(formData).length
    )
      return;

    setCompletedSteps((prev) => [...prev, currentStep]);
    setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1));
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(formData)) {
      console.log("Form submitted:", formData);
    }
  };

  const handleSpeciesSelect = (newSpecies: string) => {
    if (
      formData.species !== newSpecies &&
      formData.morph &&
      Array.isArray(formData.morph) &&
      formData.morph.length > 0
    ) {
      setShowMorphResetAlert(true);
      setSelectedSpecies(newSpecies);
      return false;
    }
    return true;
  };

  const handleMorphReset = () => {
    setFormData((prev) => ({ ...prev, species: selectedSpecies || "", morph: [] }));
    setShowMorphResetAlert(false);
    setSelectedSpecies(null);
  };

  const handleMorphResetCancel = () => {
    setShowMorphResetAlert(false);
  };

  const handleMorphRemove = (morph: string) => {
    setFormData((prev) => ({
      ...prev,
      morph: (prev.morph as string[]).filter((m) => m !== morph),
    }));
  };

  const renderField = (field: FORM_STEP["fields"][0]) => {
    const value = formData[field.name] || "";
    const error = errors[field.name];

    const inputClassName = `text-[20px] w-full border-b-[1.2px] border-b-gray-200 h-9 pr-1 text-left ${error && "border-b-red-500"}`;

    switch (field.type) {
      case "select":
        return (
          <button
            type="button"
            className={inputClassName + `${value ? "font-semibold" : "text-gray-400"}`}
            onClick={handleGenderSelectorOpen}
          >
            {value || "성별을 선택해주세요"}
          </button>
        );
      case "textarea":
        return (
          <textarea
            className={`w-full rounded-xl bg-gray-100 p-2 text-left text-[20px] focus:outline-none focus:ring-0`}
            rows={4}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          />
        );
      case "file":
        return (
          <div>
            <p className="text-sm text-blue-500">최대 3장까지 업로드 가능합니다.</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="photo-upload"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  const newPhotos = [...((formData.photo as string[]) || [])];
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
                    setFormData({ ...formData, photo: updatedPhotos });
                  });
                }
              }}
            />
            {formData.photo && (formData.photo as string[]).length > 0 ? (
              <PhotoViewer
                photos={formData.photo as string[]}
                onDelete={(index) => {
                  const updatedPhotos = [...(formData.photo as string[])];
                  updatedPhotos.splice(index, 1);
                  setFormData({ ...formData, photo: updatedPhotos });
                }}
              />
            ) : (
              <label
                htmlFor="photo-upload"
                className="flex h-[130px] w-full cursor-pointer items-center justify-center rounded-2xl bg-gray-100"
              >
                <div className="text-center">
                  <AddIcon fontSize="large" className="text-gray-400" />
                </div>
              </label>
            )}
          </div>
        );
      case "species":
        return (
          <button
            type="button"
            className={inputClassName + `${value ? "font-semibold" : "text-gray-400"}`}
            onClick={handleSpeciesSelectorOpen}
          >
            {value || "종을 선택해주세요"}
          </button>
        );
      case "morph":
        return (
          <div className="flex flex-col gap-2">
            <button type="button" className={inputClassName} onClick={handleMorphSelectorOpen}>
              <span className="text-gray-400">모프를 선택해주세요</span>
            </button>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(formData.morph) &&
                formData.morph.length > 0 &&
                formData.morph.map((morph) => (
                  <div
                    className={`mb-2 flex items-center gap-2 rounded-full bg-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[#D9E1EC]`}
                    key={morph}
                  >
                    <span>{morph}</span>
                    <button type="button" onClick={() => handleMorphRemove(morph)}>
                      <CloseIcon fontSize="small" className="text-white" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        );
      case "size":
        return (
          <button
            type="button"
            className={inputClassName + `${value ? "font-semibold" : "text-gray-400"}`}
            onClick={handleSizeSelectorOpen}
          >
            {value || "크기를 선택해주세요"}
          </button>
        );
      case "text":
        return (
          <input
            type="text"
            className={`${inputClassName} focus:outline-none focus:ring-0`}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          />
        );
      case "number":
        return (
          <div className="relative">
            <input
              type="tel"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              className={`${inputClassName} focus:outline-none focus:ring-0`}
              value={value}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
                  setFormData({ ...formData, [field.name]: inputValue });
                }
              }}
              onKeyPress={(e) => {
                if (!/[0-9.]/.test(e.key)) {
                  e.preventDefault();
                }
                if (e.key === "." && (value as string).includes(".")) {
                  e.preventDefault();
                }
              }}
              min="0"
            />
            <p className="absolute bottom-2 right-1 text-xl text-gray-400">g</p>
          </div>
        );
      case "parentSearch":
        return (
          <div className="flex gap-2">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-blue-500">부</span>
              <button
                type="button"
                className="flex h-[calc(min(50vw,320px)-24px)] w-[calc(min(50vw,320px)-24px)] items-center justify-center rounded-2xl bg-gray-100 text-[#D9E1EC]"
                onClick={() => setIsParentSearchOpen(true)}
              >
                <SearchIcon fontSize="large" className="text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-bold text-blue-500">모</span>
              <button
                type="button"
                className="flex h-[calc(min(50vw,320px)-24px)] w-[calc(min(50vw,320px)-24px)] items-center justify-center rounded-2xl bg-gray-100 text-[#D9E1EC]"
                onClick={() => setIsParentSearchOpen(true)}
              >
                <SearchIcon fontSize="large" className="text-gray-400" />
              </button>
            </div>
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            className={inputClassName}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          />
        );
    }
  };

  return (
    <div className="min-h-screen py-8 shadow-xl">
      {currentPage === 1 && (
        <button
          type="button"
          onClick={() => setCurrentPage(0)}
          className="absolute left-0 top-0 text-sm text-gray-400"
        >
          필수 정보 수정하기
        </button>
      )}
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-8 text-2xl">
          <span className="font-bold">{USER_NAME}</span>님 개체의
          <br />
          <span>등록 정보를 입력해주세요.</span>
          {currentPage === 0 && (
            <p className="text-sm text-gray-400">
              아래 항목은 <span className="font-bold text-red-500">필수</span> 등록 정보입니다.
            </p>
          )}
          {currentPage === 1 && (
            <p className="text-sm text-gray-400">
              아래 항목은 <span className="font-bold text-blue-500">선택</span> 등록 정보입니다.
            </p>
          )}
        </div>

        {currentPage === 0 && (
          <>
            {currentStep < FORM_STEPS.length && (
              <div className="space-y-1 pb-4">
                <h2 className="text-lg text-gray-500">{currentStepData.title}</h2>
                {currentStepData.fields.map((field) => (
                  <div key={field.name}>
                    {renderField(field)}
                    {errors[field.name] && (
                      <div className="flex items-center gap-1">
                        <InfoOutlineIcon fontSize="small" className="text-red-500" />
                        <p className="text-sm font-semibold text-red-500">{errors[field.name]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mb-20 space-y-4">
              {[...completedSteps].reverse().map((stepIndex) => {
                const step = FORM_STEPS[stepIndex] as FORM_STEP;
                return (
                  <div key={step.title}>
                    <h2 className="text-lg text-gray-500">{step.title}</h2>
                    {step.fields.map((field) => (
                      <div key={field.name}>
                        {renderField(field)}
                        {errors[field.name] && (
                          <div className="flex items-center gap-1">
                            <InfoOutlineIcon fontSize="small" className="text-red-500" />
                            <p className="text-sm font-semibold text-red-500">
                              {errors[field.name]}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </form>
          </>
        )}

        {currentPage === 1 && (
          <form className="mb-20 space-y-4">
            {OPTION_STEPS.map((step) => (
              <div key={step.title} className="mb-6 space-y-2">
                <h2 className="text-lg text-gray-500">{step.title}</h2>
                {step.fields.map((field) => (
                  <div key={field.name}>{renderField(field)}</div>
                ))}
              </div>
            ))}
          </form>
        )}

        <ParentSearch
          isOpen={isParentSearchOpen}
          onClose={() => setIsParentSearchOpen(false)}
          onSelect={(value) => setFormData({ ...formData, parentSearch: value })}
        />

        {showMorphResetAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="m-2 w-[300px] rounded-xl bg-white p-6">
              <h3 className="mb-4 text-lg font-bold">종 변경 안내</h3>
              <p className="mb-6 text-gray-600">
                종을 변경하면 선택된 모프가 초기화됩니다.
                <br />
                계속하시겠습니까?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700"
                  onClick={handleMorphResetCancel}
                >
                  취소
                </button>
                <button
                  className="flex-1 rounded-lg bg-[#247DFE] px-4 py-2 font-semibold text-white"
                  onClick={() => handleMorphReset()}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[640px] bg-white p-4 shadow-lg">
          <div className="">
            <button
              type="button"
              onClick={() => {
                if (!validateStep(formData)) return;

                if (currentStep === FORM_STEPS.length - 1) {
                  setCurrentPage(1);
                } else {
                  handleNext(formData);
                }
              }}
              className="h-13 w-full cursor-pointer rounded-2xl bg-[#247DFE] text-lg font-bold text-white"
            >
              {currentPage === 1 ? "등록하기" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
