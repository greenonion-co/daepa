"use client";

import ProfileSection from "./components/ProfileSection";
import AccountInfoSection from "./components/AccountInfoSection";
import ReporterInfoSection from "./components/ReporterInfoSection";
// import AppSettingsSection from "./components/AppSettingsSection";
import HelpSection from "./components/HelpSection";
import AccountManagementSection from "./components/AccountManagementSection";

const SettingsPage = () => {
  return (
    <div className="min-h-screen">
      <div>
        <ProfileSection />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
          <AccountInfoSection />
          <ReporterInfoSection />
          {/*<AppSettingsSection />*/}
          <HelpSection />
          <AccountManagementSection />
        </div>

        {/* 버전 정보 */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-400 dark:text-gray-500">버전 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
