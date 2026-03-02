import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchBreederProfile } from "./data";
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
  const description = `${profile.name}의 개체 ${profile.petCount}마리`;

  return {
    title,
    description,
    openGraph: { title, description },
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
