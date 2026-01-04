"use client";

import { useState } from "react";
import { CustomerAnalysisDto, CustomerDetailDto } from "@repo/api-client";
import { ChartCard } from "./index";
import { formatPrice } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

interface CustomerAnalysisCardProps {
  data: CustomerAnalysisDto;
}

const CustomerAnalysisCard = ({ data }: CustomerAnalysisCardProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (data.totalCustomers === 0) return null;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <ChartCard title="고객 분석">
      <div className="flex flex-col justify-between gap-4 p-2">
        <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] text-gray-600 dark:text-gray-300">
          <span>
            평균 구매 횟수:{" "}
            <span className="font-bold text-gray-800 dark:text-gray-100">{data.averagePurchaseCount}회</span>
          </span>
          <span>
            고객당 평균 지출:{" "}
            <span className="font-bold text-gray-800 dark:text-gray-100">
              {formatPrice(data.averageCustomerSpending)}
            </span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <AnalysisItem label="총 고객 수" value={`${data.totalCustomers}명`} />
          <AnalysisItem label="재입양 고객" value={`${data.repeatCustomers}명`} />
          <AnalysisItem label="재입양율" value={`${data.repeatRate}%`} />
        </div>

        {/* 고객 목록 섹션 */}
        <div className="mt-2 flex flex-col gap-2">
          {/* 상위 고객 */}
          {data.topCustomers && data.topCustomers.length > 0 && (
            <CustomerSection
              title="분양가 기준 고객 TOP 10"
              icon={<Image src="/assets/lizard_face.png" alt="lizard" width={30} height={30} />}
              customers={data.topCustomers}
              isExpanded={expandedSection === "top"}
              onToggle={() => toggleSection("top")}
              showRank
            />
          )}

          {/* 재구매 고객 */}
          {data.repeatCustomerList && data.repeatCustomerList.length > 0 && (
            <CustomerSection
              title="재입양 고객 TOP 10"
              icon={<Image src="/assets/lizard_face_2.png" alt="lizard" width={30} height={30} />}
              customers={data.repeatCustomerList}
              isExpanded={expandedSection === "repeat"}
              onToggle={() => toggleSection("repeat")}
            />
          )}
        </div>
      </div>
    </ChartCard>
  );
};

export default CustomerAnalysisCard;

const AnalysisItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg bg-gradient-to-r from-blue-200/25 to-purple-200/25 p-3 text-center dark:from-blue-900/30 dark:to-purple-900/30">
      <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-sm font-[600] text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
};

interface CustomerSectionProps {
  title: string;
  icon: React.ReactNode;
  customers: CustomerDetailDto[];
  isExpanded: boolean;
  onToggle: () => void;
  showRank?: boolean;
}

const CustomerSection = ({
  title,
  icon,
  customers,
  isExpanded,
  onToggle,
  showRank,
}: CustomerSectionProps) => {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-900">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2 font-semibold">
          {icon}
          <span className="text-[15px] text-gray-800 dark:text-gray-100">{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-300 ease-in-out dark:text-gray-400 ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Animated content wrapper using CSS grid */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: isExpanded ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-3">
            <div className="max-h-60 overflow-y-auto">
              {customers.map((customer, index) => (
                <div
                  key={customer.userId}
                  className={`flex items-center justify-between py-2 transition-all duration-300 last:border-b-0 ${
                    isExpanded ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                  }`}
                  style={{
                    transitionDelay: isExpanded ? `${index * 50}ms` : "0ms",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {showRank && (
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400"
                            : index === 1
                              ? "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                              : index === 2
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}
                    <span className="font-[500] text-gray-800 dark:text-gray-100">{customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{customer.purchaseCount}회</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(customer.totalSpending)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
