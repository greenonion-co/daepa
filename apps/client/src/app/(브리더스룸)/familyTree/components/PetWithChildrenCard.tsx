"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Users, ChevronUp } from "lucide-react";
import { ParentWithChildrenDto, PetDtoSex, PetDtoSpecies } from "@repo/api-client";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import Link from "next/link";

interface PetWithChildrenCardProps {
  pet: ParentWithChildrenDto;
}

export function PetWithChildrenCard({ pet }: PetWithChildrenCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getSexColor = (sex?: string) => {
    switch (sex) {
      case "M":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "F":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="bg-muted/20 w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Link href={`/pet/${pet.parent.petId}`} className="flex flex-1 items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage alt={pet.parent.petId} />
              <AvatarFallback className="text-center text-sm" />
            </Avatar>
            <div className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2">
                {pet.parent.name}
                <div className="text-sm font-light text-gray-500">| {pet.parent.owner?.name}</div>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {SPECIES_KOREAN_INFO[pet.parent.species as PetDtoSpecies]}
                </Badge>
                <Badge className={getSexColor(pet.parent.sex)}>
                  {GENDER_KOREAN_INFO[pet.parent.sex as PetDtoSex]}
                </Badge>
                {pet.childrenCount && pet.childrenCount > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {pet.childrenCount}마리
                  </Badge>
                )}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              disabled={!pet.children || pet.children.length === 0}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && pet.children && pet.children.length > 0 && (
        <CardContent>
          <div className="space-y-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              자식 개체 목록 ({pet.children.length}마리)
            </div>
            <div className="flex flex-col gap-4">
              {pet.children.map((child) => (
                <Link
                  key={child.petId}
                  href={`/pet/${child.petId}`}
                  className="group flex items-center gap-3 rounded-lg border p-3 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage alt={child.petId} />
                    <AvatarFallback className="text-sm" />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{child.name}</div>
                    <div className="mt-1 flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {SPECIES_KOREAN_INFO[child.species as PetDtoSpecies]}
                      </Badge>
                      <Badge className={`text-xs ${getSexColor(child.sex)}`}>
                        {GENDER_KOREAN_INFO[child.sex as PetDtoSex]}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
