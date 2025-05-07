"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FOOD_BADGE_COLORS,
  FOOD_BADGE_TEXT_COLORS,
  GENDER_KOREAN_INFO,
  SALE_KOREAN_INFO,
  SPECIES_KOREAN_INFO,
} from "../../constants";
import { FOOD, Pet } from "@/types/pet";

interface PetDetailProps {
  pet: Pet;
}

const PetDetail = ({ pet }: PetDetailProps) => {
  if (!pet) {
    return <div>펫을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{pet.name}</h1>
        <Button variant="outline" asChild>
          <Link href="/pet">목록으로</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem
              label="종"
              value={SPECIES_KOREAN_INFO[pet.species as keyof typeof SPECIES_KOREAN_INFO]}
            />
            <InfoItem
              label="성별"
              value={GENDER_KOREAN_INFO[pet.sex as keyof typeof GENDER_KOREAN_INFO]}
            />
            {/* <InfoItem label="크기" value={pet.size} /> */}
            <InfoItem label="무게" value={`${pet.weight}g`} />
            <InfoItem label="생년월일" value={formatDate(pet.birthdate || "")} />
            <InfoItem
              label="모프"
              value={
                <div className="flex flex-wrap gap-1">
                  {pet.morphs?.map((morph) => <Badge key={morph}>{morph}</Badge>)}
                </div>
              }
            />
            <InfoItem
              label="특징"
              value={
                <div className="flex flex-wrap gap-1">
                  {pet.traits?.map((trait) => (
                    <Badge key={trait} variant="outline">
                      {trait}
                    </Badge>
                  ))}
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* 사육 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>사육 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem
              label="먹이"
              value={
                <div className="flex flex-wrap gap-1">
                  {pet.foods?.map((food) => (
                    <Badge
                      key={food}
                      className={`font-bold ${FOOD_BADGE_COLORS[food as FOOD]} ${
                        FOOD_BADGE_TEXT_COLORS[food as FOOD]
                      }`}
                    >
                      {food}
                    </Badge>
                  ))}
                </div>
              }
            />
            <InfoItem label="번식 가능" value={pet.mating?.status || "-"} />
            <InfoItem
              label="번식 횟수"
              value={pet.mating?.deliveryCount ? `${pet.mating.deliveryCount}회` : "-"}
            />
            <InfoItem
              label="페어링"
              value={
                pet.mating?.pair ? (
                  <div className="flex gap-2">
                    {pet.mating.pair.map((pair) => (
                      <Button key={pair.pet_id} variant="ghost" asChild>
                        <Link href={`/pet/${pair.pet_id}`}>{pair.name}</Link>
                      </Button>
                    ))}
                  </div>
                ) : (
                  "-"
                )
              }
            />
            <InfoItem
              label="판매 상태"
              value={SALE_KOREAN_INFO[pet.sales?.status as keyof typeof SALE_KOREAN_INFO] || "-"}
            />
          </CardContent>
        </Card>

        {/* 혈통 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>혈통 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem
              label="어미"
              value={
                pet.mother ? (
                  <Button variant="ghost" asChild>
                    <Link href={`/pet/${pet.mother.pet_id}`}>{pet.mother.name}</Link>
                  </Button>
                ) : (
                  "-"
                )
              }
            />
            <InfoItem
              label="부"
              value={
                pet.father ? (
                  <Button variant="ghost" asChild>
                    <Link href={`/pet/${pet.father.pet_id}`}>{pet.father.name}</Link>
                  </Button>
                ) : (
                  "-"
                )
              }
            />
          </CardContent>
        </Card>

        {/* 메모 */}
        <Card>
          <CardHeader>
            <CardTitle>메모</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{pet.desc || "-"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
    <dd className="mt-1 text-sm">{value}</dd>
  </div>
);

export default PetDetail;
