"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/useMobile";
import { DateTime } from "luxon";
import { generateTransferReport, type TransferReportData } from "../lib/generateTransferReport";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { toast } from "@/lib/toast";
import { useQuery } from "@tanstack/react-query";
import { userControllerGetUserPrivateInfo } from "@repo/api-client";

interface TransferReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportType = TransferReportData["type"];

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "transfer", label: "양도" },
  { value: "receive", label: "양수" },
  { value: "custody", label: "보관" },
];

const today = DateTime.now();

const TransferReportModal = ({ isOpen, onClose }: TransferReportModalProps) => {
  const isMobile = useIsMobile();

  const { data: privateInfo } = useQuery({
    queryKey: [userControllerGetUserPrivateInfo.name],
    queryFn: userControllerGetUserPrivateInfo,
    select: (response) => response.data.data,
  });

  const [type, setType] = useState<ReportType>("transfer");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone1, setSellerPhone1] = useState("");
  const [sellerPhone2, setSellerPhone2] = useState("");
  const [sellerPhone3, setSellerPhone3] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone1, setBuyerPhone1] = useState("");
  const [buyerPhone2, setBuyerPhone2] = useState("");
  const [buyerPhone3, setBuyerPhone3] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [scientificName, setScientificName] = useState("Correlophus ciliatus"); // 속눈썹도마뱀부치
  const [quantity, setQuantity] = useState("1");
  const [purpose, setPurpose] = useState("");
  const [reason, setReason] = useState("");
  const [year, setYear] = useState(today.toFormat("yyyy"));
  const [month, setMonth] = useState(today.toFormat("MM"));
  const [day, setDay] = useState(today.toFormat("dd"));
  const [reporter, setReporter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!privateInfo) return;

    const isSeller = type === "transfer";
    const phoneParts = privateInfo.phone?.split("-").map((s) => s.trim());

    // 이전 자동 채움 초기화
    if (isSeller) {
      setBuyerName("");
      setBuyerPhone1("");
      setBuyerPhone2("");
      setBuyerPhone3("");
      setBuyerAddress("");
    } else {
      setSellerName("");
      setSellerPhone1("010");
      setSellerPhone2("");
      setSellerPhone3("");
      setSellerAddress("");
    }

    const setName = isSeller ? setSellerName : setBuyerName;
    const setPhone1 = isSeller ? setSellerPhone1 : setBuyerPhone1;
    const setPhone2 = isSeller ? setSellerPhone2 : setBuyerPhone2;
    const setPhone3 = isSeller ? setSellerPhone3 : setBuyerPhone3;
    const setAddress = isSeller ? setSellerAddress : setBuyerAddress;

    if (privateInfo.realName) {
      setName(privateInfo.realName);
      setReporter(privateInfo.realName);
    }
    if (phoneParts?.length === 3) {
      setPhone1(phoneParts[0] ?? "");
      setPhone2(phoneParts[1] ?? "");
      setPhone3(phoneParts[2] ?? "");
    }
    if (privateInfo.address) {
      setAddress(privateInfo.address);
    }
  }, [privateInfo, type]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const data: TransferReportData = {
        type,
        seller: {
          name: sellerName,
          phone: `${sellerPhone1.trim()} - ${sellerPhone2.trim()} - ${sellerPhone3.trim()}`,
          address: sellerAddress,
        },
        buyer: {
          name: buyerName,
          phone: `${buyerPhone1.trim()} - ${buyerPhone2.trim()} - ${buyerPhone3.trim()}`,
          address: buyerAddress,
        },
        animal: { scientificName, quantity, purpose, reason },
        date: { year, month, day },
        reporter,
      };
      await generateTransferReport(data);
    } catch (e) {
      console.error("PDF 생성 실패:", e);
      toast.error("신고서 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${isMobile ? "sm:max-w-[95vw]" : "sm:max-w-[500px]"}`}
      >
        <DialogHeader>
          <DialogTitle>양도·양수·보관 신고서 작성</DialogTitle>
          {privateInfo && !privateInfo.realName && !privateInfo.phone && !privateInfo.address && (
            <p className="text-xs text-blue-500 dark:text-gray-400">
              *[내 정보]에 신고자 정보를 추가하여 편하게 사용하세요!
            </p>
          )}
        </DialogHeader>

        <div className="space-y-5">
          {/* 신고 유형 */}
          <div className="space-y-2">
            <Label>신고 유형</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 양도인 */}
          <fieldset className="space-y-2 rounded-lg border p-3">
            <legend className="px-2 text-sm font-semibold">양도인</legend>
            <div className="space-y-2">
              <Label>상호(성명)</Label>
              <Input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="성명 입력"
                className="text-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <div className="flex items-center gap-1">
                <Input
                  value={sellerPhone1}
                  onChange={(e) => setSellerPhone1(e.target.value)}
                  placeholder="00"
                  maxLength={3}
                  className="text-center text-blue-500"
                />
                <span>-</span>
                <Input
                  value={sellerPhone2}
                  onChange={(e) => setSellerPhone2(e.target.value)}
                  placeholder="0000"
                  maxLength={4}
                  className="text-center text-blue-500"
                />
                <span>-</span>
                <Input
                  value={sellerPhone3}
                  onChange={(e) => setSellerPhone3(e.target.value)}
                  placeholder="0000"
                  maxLength={4}
                  className="text-center text-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>주소</Label>
              <Input
                value={sellerAddress}
                onChange={(e) => setSellerAddress(e.target.value)}
                placeholder="주소 입력"
                className="text-blue-500"
              />
            </div>
          </fieldset>

          {/* 양수인(보관인) */}
          <fieldset className="space-y-2 rounded-lg border p-3">
            <legend className="px-2 text-sm font-semibold">양수인(보관인)</legend>
            <div className="space-y-2">
              <Label>상호(성명)</Label>
              <Input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="성명 입력"
                className="text-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <div className="flex items-center gap-1">
                <Input
                  value={buyerPhone1}
                  onChange={(e) => setBuyerPhone1(e.target.value)}
                  placeholder="00"
                  maxLength={3}
                  className="text-center text-blue-500"
                />
                <span>-</span>
                <Input
                  value={buyerPhone2}
                  onChange={(e) => setBuyerPhone2(e.target.value)}
                  placeholder="0000"
                  maxLength={4}
                  className="text-center text-blue-500"
                />
                <span>-</span>
                <Input
                  value={buyerPhone3}
                  onChange={(e) => setBuyerPhone3(e.target.value)}
                  placeholder="0000"
                  maxLength={4}
                  className="text-center text-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>주소</Label>
              <Input
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                placeholder="주소 입력"
                className="text-blue-500"
              />
            </div>
          </fieldset>

          {/* 야생동물 정보 */}
          <fieldset className="space-y-2 rounded-lg border p-3">
            <legend className="px-2 text-sm font-semibold">야생동물 정보</legend>
            <div className="space-y-2">
              <Label>학명</Label>
              <Input
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="학명 입력"
                className="text-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>수량</Label>
                <Input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="수량"
                  className="text-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label>용도</Label>
                <Input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="용도"
                  className="text-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>양도사유(보관사유)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="사유 입력"
                rows={3}
                className="text-blue-500"
              />
            </div>
          </fieldset>

          {/* 신고 정보 */}
          <fieldset className="space-y-2 rounded-lg border p-3">
            <legend className="px-2 text-sm font-semibold">신고 정보</legend>
            <div className="space-y-2">
              <Label>날짜</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1">
                  <Input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2025"
                    className="text-center"
                  />
                  <span className="text-sm">년</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    placeholder="01"
                    className="text-center"
                  />
                  <span className="text-sm">월</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    placeholder="01"
                    className="text-center"
                  />
                  <span className="text-sm">일</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>신고인</Label>
              <Input
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                placeholder="신고인 성명"
                className="text-blue-500"
              />
            </div>
          </fieldset>

          {/* 다운로드 버튼 */}
          <Button onClick={handleDownload} disabled={isGenerating} className="w-full" size="lg">
            {isGenerating ? (
              <>
                <Loader2Icon className="animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <DownloadIcon />
                신고서 다운로드
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferReportModal;
