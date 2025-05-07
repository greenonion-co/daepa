import { REGISTER_PAGE, USER_NAME } from "../../../constants";
import { useRegisterForm } from "../../hooks/useRegisterForm";

export const FormHeader = () => {
  const { currentPage, setCurrentPage } = useRegisterForm();
  return (
    <>
      {currentPage === REGISTER_PAGE.SECOND && (
        <button
          type="button"
          onClick={() => setCurrentPage(REGISTER_PAGE.FIRST)}
          className="absolute left-0 top-0 text-sm text-gray-400"
        >
          필수 정보 수정하기
        </button>
      )}
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-8 text-2xl">
          <span className="relative font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:bg-[#247DFE] after:opacity-20">
            {USER_NAME}
          </span>
          님 개체의
          <br />
          <span>등록 정보를 입력해주세요.</span>
          {currentPage === REGISTER_PAGE.FIRST && (
            <p className="text-sm text-gray-400">
              아래 항목은 <span className="font-bold text-red-500">필수</span> 등록 정보입니다.
            </p>
          )}
          {currentPage === REGISTER_PAGE.SECOND && (
            <p className="text-sm text-gray-400">
              아래 항목은 <span className="font-bold text-blue-500">선택</span> 등록 정보입니다.
            </p>
          )}
        </div>
      </div>
    </>
  );
};
