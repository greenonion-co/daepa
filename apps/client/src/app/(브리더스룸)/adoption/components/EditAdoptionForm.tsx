"use client";

import { Form } from "@/components/ui/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown, ChevronUp, UserCircle } from "lucide-react";
import {
  adoptionControllerCreateAdoption,
  adoptionControllerUpdate,
  AdoptionDtoStatus,
  CreateAdoptionDto,
  PetAdoptionDtoMethod,
  UpdateAdoptionDto,
} from "@repo/api-client";
import { useForm, useWatch } from "react-hook-form";
import { cn, getChangedFields } from "@/lib/utils";
import { DateTime } from "luxon";
import { Calendar } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADOPTION_METHOD_KOREAN_INFO, SALE_STATUS_KOREAN_INFO } from "../../constants";
import { isUndefined, omitBy } from "es-toolkit";
import { AdoptionEditFormDto } from "../types";
import UserList from "../../components/UserList";
import { isNumber } from "es-toolkit/compat";

const adoptionSchema = z.object({
  price: z.string().optional(),
  adoptionDate: z.date().optional().nullable(),
  memo: z.string().optional(),
  method: z.enum(["PICKUP", "DELIVERY", "WHOLESALE", "EXPORT"]).optional().nullable(),
  buyer: z
    .object({ userId: z.string().optional(), name: z.string().optional() })
    .optional()
    .nullable(),
  status: z
    .enum([
      AdoptionDtoStatus.NONE,
      AdoptionDtoStatus.NFS,
      AdoptionDtoStatus.ON_SALE,
      AdoptionDtoStatus.ON_RESERVATION,
      AdoptionDtoStatus.SOLD,
    ])
    .optional(),
});

type AdoptionFormData = z.infer<typeof adoptionSchema>;

interface EditAdoptionFormProps {
  adoptionData?: AdoptionEditFormDto | null;
  onSubmit: (updated?: boolean) => void;
  onCancel: () => void;
}

const EditAdoptionForm = ({ adoptionData, onSubmit, onCancel }: EditAdoptionFormProps) => {
  const [showUserSelector, setShowUserSelector] = useState(false);

  const form = useForm({
    resolver: zodResolver(adoptionSchema),
    defaultValues: {
      price: isNumber(adoptionData?.price) ? adoptionData.price.toString() : "",
      memo: adoptionData?.memo ?? "",
      method: adoptionData?.method ?? undefined,
      buyer: adoptionData?.buyer ?? {},
      adoptionDate: adoptionData?.adoptionDate ? new Date(adoptionData.adoptionDate) : undefined,
      status: adoptionData?.status ?? undefined,
    },
  });

  const currentStatus = useWatch({
    control: form.control,
    name: "status",
  });

  const isAdoptionReservedOrSold =
    currentStatus === AdoptionDtoStatus.ON_RESERVATION || currentStatus === AdoptionDtoStatus.SOLD;

  // 상태가 변경될 때 buyer 필드와 adoptionDate 필드 초기화
  const handleStatusChange = (newStatus: AdoptionDtoStatus) => {
    const previousStatus = form.getValues("status");

    // 이전 상태가 ON_RESERVATION 또는 SOLD였고, 새로운 상태가 그게 아닌 경우 buyer와 adoptionDate 초기화
    if (
      (previousStatus === AdoptionDtoStatus.ON_RESERVATION ||
        previousStatus === AdoptionDtoStatus.SOLD) &&
      newStatus !== AdoptionDtoStatus.ON_RESERVATION &&
      newStatus !== AdoptionDtoStatus.SOLD
    ) {
      if (form.getValues("buyer")?.userId) {
        form.setValue("buyer", null);
        setShowUserSelector(false);
      }
      if (form.getValues("adoptionDate")) {
        form.setValue("adoptionDate", null);
      }
    }

    form.setValue("status", newStatus);
  };

  const { mutateAsync: updateAdoption, isPending: isUpdatingAdoption } = useMutation({
    mutationFn: ({ adoptionId, data }: { adoptionId: string; data: UpdateAdoptionDto }) =>
      adoptionControllerUpdate(adoptionId, data),
  });

  const { mutateAsync: createAdoption, isPending: isCreatingAdoption } = useMutation({
    mutationFn: (data: CreateAdoptionDto) => adoptionControllerCreateAdoption(data),
  });

  const ADOPTION_FIELDS = ["price", "adoptionDate", "memo", "method", "buyer", "status"] as const;

  const convertFormDataToDto = (formData: AdoptionFormData) => ({
    price: formData.price === "" || !formData.price ? undefined : Number(formData.price),
    adoptionDate: formData.adoptionDate?.toISOString(),
    memo: formData.memo,
    method: formData.method,
    buyer: formData.buyer,
    status: formData.status,
  });

  const handleFormSubmit = async (data: AdoptionFormData) => {
    if (!adoptionData?.petId) {
      toast.error("펫 정보를 찾을 수 없습니다. 다시 선택해주세요.");
      return;
    }

    const { petId, adoptionId } = adoptionData;

    try {
      if (adoptionId) {
        // 수정 케이스: 변경된 필드만 감지
        const formValues = convertFormDataToDto(data);
        const originalValues = {
          price: adoptionData.price,
          adoptionDate: adoptionData.adoptionDate
            ? new Date(adoptionData.adoptionDate).toISOString()
            : undefined,
          memo: adoptionData.memo,
          method: adoptionData.method,
          buyer: adoptionData.buyer,
          status: adoptionData.status,
        };

        const changedFields = getChangedFields(originalValues, formValues, {
          fields: ADOPTION_FIELDS,
          customComparers: {
            buyer: (orig: unknown, curr: unknown) => {
              const origBuyer = orig as typeof adoptionData.buyer;
              const currBuyer = curr as typeof data.buyer;
              return origBuyer?.userId === currBuyer?.userId;
            },
          },
          convertUndefinedToNull: true,
        });

        if (!Object.keys(changedFields).length) {
          toast.info("변경된 사항이 없습니다.");
          onSubmit(false);
          return;
        }

        // 변경된 필드만 추출하여 API 호출
        const updateDto: Record<string, unknown> = {};
        if ("price" in changedFields) {
          if (data.price && !/^\d+$/.test(data.price)) {
            toast.error("분양 가격은 숫자만 입력할 수 있습니다.");
            return;
          }
          updateDto.price = data.price === "" || !data.price ? null : Number(data.price);
        }
        if ("adoptionDate" in changedFields) {
          updateDto.adoptionDate = data.adoptionDate?.toISOString() ?? null;
        }
        if ("memo" in changedFields) {
          updateDto.memo = data.memo ?? null;
        }
        if ("method" in changedFields) {
          updateDto.method = data.method ?? null;
        }
        if ("buyer" in changedFields) {
          updateDto.buyerId = data.buyer?.userId ?? null;
        }
        if ("status" in changedFields) {
          updateDto.status = data.status ?? null;
        }

        await updateAdoption({ adoptionId, data: updateDto as UpdateAdoptionDto });
      } else {
        // 생성 케이스: 입력값만 전송
        const createDto = omitBy(
          {
            petId,
            ...convertFormDataToDto(data),
            buyerId: data.buyer?.userId,
          },
          isUndefined,
        );

        await createAdoption(createDto as CreateAdoptionDto);
      }

      toast.success("분양 정보가 성공적으로 생성되었습니다.");
      onSubmit();
    } catch (error) {
      console.error("분양 생성 실패:", error);
      toast.error("분양 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  분양 상태
                  <span className="text-xs text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select onValueChange={handleStatusChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="분양 상태를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AdoptionDtoStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {SALE_STATUS_KOREAN_INFO[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>분양 가격</FormLabel>
                <FormControl>
                  <Input
                    placeholder="가격을 입력하세요"
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="adoptionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>분양 날짜</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant={"outline"}
                        disabled={!isAdoptionReservedOrSold}
                        className={cn(
                          "h-10 w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                          !isAdoptionReservedOrSold && "cursor-not-allowed opacity-50",
                        )}
                      >
                        {field.value ? (
                          DateTime.fromJSDate(field.value).toFormat("yyyy년 M월 d일")
                        ) : (
                          <span>
                            {isAdoptionReservedOrSold
                              ? "날짜를 선택하세요"
                              : "예약 중・분양 완료 시 선택 가능"}
                          </span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => field.onChange(date ?? null)}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="buyer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>입양자 선택</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (isAdoptionReservedOrSold) {
                          setShowUserSelector(!showUserSelector);
                        }
                      }}
                      disabled={!isAdoptionReservedOrSold}
                      className={cn(
                        "flex h-10 w-full items-center justify-between bg-gray-800 text-white",
                        !isAdoptionReservedOrSold && "cursor-not-allowed text-gray-300 opacity-50",
                      )}
                    >
                      <div className="flex items-center">
                        <UserCircle className="mr-1 h-4 w-4" />
                        {isAdoptionReservedOrSold
                          ? (field.value?.name ?? "사용자 선택하기")
                          : "예약 중・분양 완료 시 선택 가능"}
                      </div>
                      {showUserSelector ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </Button>

                    {showUserSelector && isAdoptionReservedOrSold && (
                      <div className="rounded-lg border p-2">
                        <UserList
                          selectedUserId={field.value?.userId}
                          onSelect={(buyer) => {
                            // 현재 선택된 사용자와 동일한 사용자를 클릭하면 빈값으로 초기화
                            if (field.value?.userId === buyer.userId) {
                              field.onChange(null);
                              setShowUserSelector(false);
                            } else {
                              field.onChange(buyer);
                              setShowUserSelector(false);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>거래 방식</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    {Object.values(PetAdoptionDtoMethod).map((method) => (
                      <Button
                        key={method}
                        type="button"
                        variant={field.value === method ? "default" : "outline"}
                        onClick={() => {
                          if (field.value === method) {
                            field.onChange(null);
                          } else {
                            field.onChange(method);
                          }
                        }}
                        className="h-10 flex-1"
                      >
                        {ADOPTION_METHOD_KOREAN_INFO[method]}
                      </Button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="memo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메모</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="분양 관련 메모를 입력하세요"
                    rows={3}
                    className="h-20"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isUpdatingAdoption || isCreatingAdoption}>
              {isUpdatingAdoption || isCreatingAdoption ? "저장 중..." : "저장"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditAdoptionForm;
