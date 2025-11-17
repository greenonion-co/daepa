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
  PetAdoptionDtoLocation,
  UpdateAdoptionDto,
} from "@repo/api-client";
import { useForm, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
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
import { SALE_STATUS_KOREAN_INFO } from "../../constants";
import { isUndefined, omitBy } from "es-toolkit";
import { AdoptionEditFormDto } from "../types";
import UserList from "../../components/UserList";

const adoptionSchema = z.object({
  price: z.string().optional(),
  adoptionDate: z.date().optional(),
  memo: z.string().optional(),
  location: z.enum(["ONLINE", "OFFLINE"]).default("OFFLINE"),
  buyer: z.object({ userId: z.string().optional(), name: z.string().optional() }).optional(),
  status: z
    .enum([
      AdoptionDtoStatus.NFS,
      AdoptionDtoStatus.ON_SALE,
      AdoptionDtoStatus.ON_RESERVATION,
      AdoptionDtoStatus.SOLD,
      "UNDEFINED",
    ])
    .optional(),
});

type AdoptionFormData = z.infer<typeof adoptionSchema>;

interface EditAdoptionFormProps {
  adoptionData?: AdoptionEditFormDto | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const EditAdoptionForm = ({ adoptionData, onSubmit, onCancel }: EditAdoptionFormProps) => {
  const [showUserSelector, setShowUserSelector] = useState(false);

  const form = useForm({
    resolver: zodResolver(adoptionSchema),
    defaultValues: {
      price: adoptionData?.price ? adoptionData.price.toString() : "",
      memo: adoptionData?.memo ?? "",
      location: adoptionData?.location ?? PetAdoptionDtoLocation.OFFLINE,
      buyer: adoptionData?.buyer ?? {},
      adoptionDate: adoptionData?.adoptionDate ? new Date(adoptionData.adoptionDate) : undefined,
      status: adoptionData?.status ?? "UNDEFINED",
    },
  });

  const currentStatus = useWatch({
    control: form.control,
    name: "status",
  });

  const isAdoptionReservedOrSold =
    currentStatus === AdoptionDtoStatus.ON_RESERVATION || currentStatus === AdoptionDtoStatus.SOLD;

  // 상태가 변경될 때 buyer 필드와 adoptionDate 필드 초기화
  const handleStatusChange = (newStatus: AdoptionDtoStatus | "UNDEFINED") => {
    const previousStatus = form.getValues("status");

    // 이전 상태가 ON_RESERVATION 또는 SOLD였고, 새로운 상태가 그게 아닌 경우 buyer와 adoptionDate 초기화
    if (
      (previousStatus === AdoptionDtoStatus.ON_RESERVATION ||
        previousStatus === AdoptionDtoStatus.SOLD) &&
      newStatus !== AdoptionDtoStatus.ON_RESERVATION &&
      newStatus !== AdoptionDtoStatus.SOLD
    ) {
      if (form.getValues("buyer")?.userId) {
        form.setValue("buyer", {});
        setShowUserSelector(false);
      }
      if (form.getValues("adoptionDate")) {
        form.setValue("adoptionDate", undefined);
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

  const handleFormSubmit = async (data: AdoptionFormData) => {
    if (!adoptionData?.petId) {
      toast.error("펫 정보를 찾을 수 없습니다. 다시 선택해주세요.");
      return;
    }

    const petId = adoptionData.petId;
    const adoptionId = adoptionData?.adoptionId;

    const newAdoptionDto = omitBy(
      {
        petId,
        price: data.price ? Number(data.price) : undefined,
        adoptionDate: data.adoptionDate?.toISOString(),
        memo: data.memo,
        location: data.location,
        buyerId: data.buyer?.userId,
        status: data.status === "UNDEFINED" ? undefined : data.status,
      },
      isUndefined,
    );

    try {
      if (adoptionId) {
        await updateAdoption({ adoptionId, data: newAdoptionDto });
      } else {
        await createAdoption({ ...newAdoptionDto, petId });
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
                  <span className="text-xs text-red-500">(필수)</span>
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
                  <Input {...field} placeholder="가격을 입력하세요" type="number" />
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
                <FormLabel>
                  분양 날짜
                  {!isAdoptionReservedOrSold && (
                    <span className="text-xs text-neutral-500">
                      (예약 중 / 분양 완료 시 선택 가능)
                    </span>
                  )}
                </FormLabel>
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
                          format(field.value, "PPP", { locale: ko })
                        ) : (
                          <span>날짜를 선택하세요</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      defaultMonth={
                        field.value ||
                        (adoptionData?.adoptionDate
                          ? new Date(adoptionData.adoptionDate)
                          : undefined)
                      }
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
                <FormLabel>
                  입양자 선택
                  {!isAdoptionReservedOrSold && (
                    <span className="text-xs text-neutral-500">
                      (예약 중 / 분양 완료 시 선택 가능)
                    </span>
                  )}
                </FormLabel>
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
                        !isAdoptionReservedOrSold && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <div className="flex items-center">
                        <UserCircle className="mr-1 h-4 w-4" />
                        {field.value?.name ?? "사용자 선택하기"}
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
                              field.onChange({});
                            } else {
                              field.onChange(buyer);
                            }
                            setShowUserSelector(false);
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
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>거래 방식</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        field.value === PetAdoptionDtoLocation.OFFLINE ? "default" : "outline"
                      }
                      onClick={() => field.onChange(PetAdoptionDtoLocation.OFFLINE)}
                      className="h-10 flex-1"
                    >
                      오프라인
                    </Button>
                    <Button
                      type="button"
                      variant={
                        field.value === PetAdoptionDtoLocation.ONLINE ? "default" : "outline"
                      }
                      onClick={() => field.onChange(PetAdoptionDtoLocation.ONLINE)}
                      className="h-10 flex-1"
                    >
                      온라인
                    </Button>
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
                    {...field}
                    placeholder="분양 관련 메모를 입력하세요"
                    rows={3}
                    className="h-20"
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
