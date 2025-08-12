import { Form } from "@/components/ui/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, User } from "lucide-react";
import {
  adoptionControllerCreateAdoption,
  adoptionControllerUpdate,
  AdoptionDtoStatus,
  CreateAdoptionDto,
  PetAdoptionDtoLocation,
  UpdateAdoptionDto,
} from "@repo/api-client";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const adoptionSchema = z.object({
  price: z.string().optional(),
  adoptionDate: z.date().optional(),
  memo: z.string().optional(),
  location: z.enum(["ONLINE", "OFFLINE"]).default("OFFLINE"),
  buyerId: z.string().optional(),
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
  handleClose: () => void;
  handleCancel: () => void;
}

const EditAdoptionForm = ({ adoptionData, handleClose, handleCancel }: EditAdoptionFormProps) => {
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const form = useForm({
    resolver: zodResolver(adoptionSchema),
    defaultValues: {
      price: adoptionData?.price ? adoptionData.price.toString() : "",
      memo: adoptionData?.memo ?? "",
      location: adoptionData?.location ?? PetAdoptionDtoLocation.OFFLINE,
      buyerId: adoptionData?.buyerId ?? adoptionData?.buyer?.userId ?? "",
      adoptionDate: adoptionData?.adoptionDate ? new Date(adoptionData.adoptionDate) : undefined,
      status: adoptionData?.status ?? "UNDEFINED",
    },
  });

  const { mutateAsync: updateAdoption, isPending: isUpdatingAdoption } = useMutation({
    mutationFn: ({ adoptionId, data }: { adoptionId: string; data: UpdateAdoptionDto }) =>
      adoptionControllerUpdate(adoptionId, data),
    onSuccess: () => {
      toast.success("분양 정보가 성공적으로 업데이트되었습니다.");
      handleClose();
    },
    onError: (error) => {
      console.error("분양 수정 실패:", error);
      toast.error("분양 수정에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const { mutateAsync: createAdoption, isPending: isCreatingAdoption } = useMutation({
    mutationFn: (data: CreateAdoptionDto) => adoptionControllerCreateAdoption(data),
    onSuccess: () => {
      toast.success("분양 정보가 성공적으로 생성되었습니다.");
      handleClose();
    },
    onError: (error) => {
      console.error("분양 생성 실패:", error);
      toast.error("분양 생성에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const onSubmit = async (data: AdoptionFormData) => {
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
        buyerId: data.buyerId,
        status: data.status === "UNDEFINED" ? undefined : data.status,
      },
      isUndefined,
    );

    if (adoptionId) {
      await updateAdoption({ adoptionId, data: newAdoptionDto });
    } else {
      await createAdoption({ ...newAdoptionDto, petId });
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>분양 상태</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="분양 상태를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNDEFINED" disabled>
                        미정
                      </SelectItem>
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
                <FormLabel>분양 날짜</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
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
            name="buyerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>입양자 선택 (선택사항)</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUserSelector(!showUserSelector)}
                      className="w-full justify-start"
                    >
                      <User className="mr-2 h-4 w-4" />
                      {field.value ? "선택된 사용자" : "사용자 선택하기"}
                    </Button>

                    {showUserSelector && (
                      <div className="space-y-2 rounded-lg border p-3">
                        <div className="relative">
                          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                          <Input
                            placeholder="사용자 이름이나 이메일로 검색..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2"></div>
                        </ScrollArea>
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
                      className="flex-1"
                    >
                      오프라인
                    </Button>
                    <Button
                      type="button"
                      variant={
                        field.value === PetAdoptionDtoLocation.ONLINE ? "default" : "outline"
                      }
                      onClick={() => field.onChange(PetAdoptionDtoLocation.ONLINE)}
                      className="flex-1"
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
                  <Textarea {...field} placeholder="분양 관련 메모를 입력하세요" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isUpdatingAdoption || isCreatingAdoption}>
              {isUpdatingAdoption || isCreatingAdoption ? "저장 중..." : "저장"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditAdoptionForm;
