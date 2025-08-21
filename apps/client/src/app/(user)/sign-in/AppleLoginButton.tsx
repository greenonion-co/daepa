import { useState } from "react";

const AppleLoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL ?? ""}/sign-in/auth`;

    try {
      const AppleID = (window as any).AppleID;
      if (!AppleID?.auth) {
        setIsLoading(false);
        return;
      }

      await AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? "",
        scope: "email",
        redirectURI: REDIRECT_URI,
        usePopup: true,
      });

      await AppleID.auth.signIn();
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="mb-2 flex h-[46px] w-full cursor-pointer items-center justify-center gap-3 rounded-[12px] bg-black"
      onClick={handleAppleLogin}
    >
      <span className="font-semibold text-white">Apple로 시작하기</span>
    </div>
  );
};

export default AppleLoginButton;
