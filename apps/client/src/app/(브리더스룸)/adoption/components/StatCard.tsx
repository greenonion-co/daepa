import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  bgColor?: string;
}

const StatCard = ({ title, value, icon: Icon, bgColor }: StatCardProps) => (
  <Card className={cn(bgColor)}>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-sm font-medium text-gray-800">{title}</CardTitle>
      <Icon className="h-4 w-4" />
    </CardHeader>
    <CardContent className="font-bold">{value}</CardContent>
  </Card>
);

export default StatCard;
