import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchBreederProfile } from "./data";
import { DEFAULT_OG_IMAGE } from "@/lib/metadata";
import ShowcaseContent from "./components/ShowcaseContent";

interface ShowcasePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ShowcasePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchBreederProfile(username);

  if (!profile) {
    return { title: "브리더를 찾을 수 없습니다" };
  }

  const title = `${profile.name}의 쇼룸`;
  const description = `브리더 ${profile.name}의 개체목록을 확인해 보세요!`;
  const ogImage = profile.bannerImageUrl || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: profile.bannerImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShowcasePage({ params }: ShowcasePageProps) {
  const { username } = await params;
  const profile = await fetchBreederProfile(username);

  if (!profile) {
    notFound();
  }

  return <ShowcaseContent profile={profile} />;
}
