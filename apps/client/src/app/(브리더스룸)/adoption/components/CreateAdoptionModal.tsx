"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, ArrowLeft, User } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SALE_STATUS_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import {
  adoptionControllerCreateAdoption,
  adoptionControllerUpdateAdoption,
  brPetControllerFindAll,
  PetDto,
  PetDtoSaleStatus,
} from "@repo/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const adoptionSchema = z.object({
  price: z.string().optional(),
  adoptionDate: z.date().optional(),
  memo: z.string().optional(),
  location: z.enum(["online", "offline"]).default("offline"),
  buyerId: z.string().optional(),
});

type AdoptionFormData = z.infer<typeof adoptionSchema>;

interface CreateAdoptionModalProps {
  isOpen: boolean;
  saleStatus?: PetDtoSaleStatus;
  pet?: PetDto;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAdoptionModal = ({
  isOpen,
  saleStatus,
  pet,
  onClose,
  onSuccess,
}: CreateAdoptionModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(pet ? 2 : 1);
  const [selectedPet, setSelectedPet] = useState<PetDto | null>(pet || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showUserSelector, setShowUserSelector] = useState(false);
  const { ref, inView } = useInView();
  const itemPerPage = 10;

  const shouldShowAdvancedFields =
    pet && (saleStatus === "ON_RESERVATION" || saleStatus === "SOLD");

  const {
    data: pets,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    enabled: !pet,
    queryKey: [brPetControllerFindAll.name],
    queryFn: ({ pageParam = 1 }) =>
      brPetControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.data.data),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const form = useForm<AdoptionFormData>({
    resolver: zodResolver(adoptionSchema),
    defaultValues: {
      price: pet?.adoption?.price ? pet.adoption.price.toString() : "",
      memo: (pet?.adoption?.memo as string) || "",
      location: (pet?.adoption?.location as "online" | "offline") || "offline",
      buyerId: (pet?.adoption?.buyerId as string) || "",
      adoptionDate: pet?.adoption?.adoptionDate ? new Date(pet.adoption.adoptionDate) : undefined,
    },
  });

  const onSubmit = async (data: AdoptionFormData) => {
    if (!selectedPet) return;

    setIsSubmitting(true);
    try {
      const newAdoptionDto = {
        petId: selectedPet.petId,
        price: data.price ? Number(data.price) : undefined,
        ...(data.adoptionDate && {
          adoptionDate: data.adoptionDate.toISOString(),
        }),
        ...(data.memo && {
          memo: data.memo,
        }),
        ...(data.location && {
          location: data.location,
        }),
        ...(data.buyerId && {
          buyerId: data.buyerId,
        }),
        ...(saleStatus && {
          saleStatus: saleStatus,
        }),
      };

      if (selectedPet.adoption?.adoptionId) {
        await adoptionControllerUpdateAdoption(selectedPet.adoption.adoptionId, newAdoptionDto);
      } else {
        await adoptionControllerCreateAdoption(newAdoptionDto);
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("분양 등록 실패:", error);
      toast.error("분양 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPet(null);
    setSearchQuery("");
    setUserSearchQuery("");
    setShowUserSelector(false);
    form.reset();
    onClose();
  };

  const handlePetSelect = (pet: PetDto) => {
    setSelectedPet(pet);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedPet(null);
  };

  const filteredPets = pets?.filter(
    (pet) =>
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.owner.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{step === 1 ? "분양할 펫 선택" : "분양 정보 입력"}</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          // 1단계: 펫 선택
          <div className="space-y-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="펫 이름이나 주인 이름으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredPets?.map((pet) => (
                  <div
                    key={pet.petId}
                    className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg border p-3"
                    onClick={() => handlePetSelect(pet)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{pet.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {SPECIES_KOREAN_INFO[pet.species]} | {pet.owner.name}
                      </div>
                      {pet.sex && (
                        <Badge variant="secondary" className="mt-1">
                          {pet.sex === "M" ? "수컷" : pet.sex === "F" ? "암컷" : "미구분"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {hasNextPage && (
                  <div ref={ref} className="h-20 text-center">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" />
                      </div>
                    ) : (
                      <div className="text-muted-foreground">더 불러오는 중...</div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          // 2단계: 분양 정보 입력
          <div>
            <div className="bg-muted mb-4 rounded-lg p-3">
              <div className="text-sm font-medium">{selectedPet.name}</div>
              <div className="text-muted-foreground text-sm">
                {SPECIES_KOREAN_INFO[selectedPet.species]} | {selectedPet.owner.name}
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                {shouldShowAdvancedFields && (
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
                                (pet?.adoption?.adoptionDate
                                  ? new Date(pet.adoption.adoptionDate)
                                  : undefined)
                              }
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* 입양자 선택 - pet이 있고 saleStatus가 ON_RESERVATION 또는 SOLD인 경우에만 표시 */}
                {shouldShowAdvancedFields && (
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
                )}

                {/* 거래 방식 - pet이 있고 saleStatus가 ON_RESERVATION 또는 SOLD인 경우에만 표시 */}
                {shouldShowAdvancedFields && (
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
                              variant={field.value === "offline" ? "default" : "outline"}
                              onClick={() => field.onChange("offline")}
                              className="flex-1"
                            >
                              오프라인
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === "online" ? "default" : "outline"}
                              onClick={() => field.onChange("online")}
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
                )}

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

                <div className="flex gap-2 pt-4">
                  {!pet && (
                    <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      뒤로
                    </Button>
                  )}
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting
                      ? "등록 중..."
                      : selectedPet?.adoption?.adoptionId
                        ? `${SALE_STATUS_KOREAN_INFO[saleStatus]}으로 수정`
                        : "등록하기"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdoptionModal;
