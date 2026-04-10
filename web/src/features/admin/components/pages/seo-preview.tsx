"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Globe, MoreVertical } from"lucide-react";

type SeoPreviewProps = {
 title: string;
 description: string;
 path: string;
 baseUrl?: string;
};

export function SeoPreview({ title, description, path, baseUrl }: SeoPreviewProps) {
 const [origin, setOrigin] = useState(baseUrl || "");

 useEffect(() => {
  if (baseUrl) {
   setOrigin(baseUrl);
   return;
  }

  if (typeof window !== "undefined") {
   setOrigin(window.location.origin);
  }
 }, [baseUrl]);

 const displayTitle = title ||"Page Title - Site Name";
 const displayDescription = description ||"Please provide a meta description by editing the snippet below. If you don't, Google will try to find a relevant part of your content to show in the search results.";
 const displayUrl = origin ? `${origin}${path === "/" ? "" : path}` : path;

 return (
 <Card className="border-dashed bg-muted/20">
  <CardHeader className="pb-2">
  <CardTitle className="font-semibold uppercase tracking-wider text-muted-foreground">
   Google Search Results Preview
  </CardTitle>
  </CardHeader>
  <CardContent className="space-y-1">
  <div className="mb-1 flex items-center gap-2 text-[14px] text-foreground">
         <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-background">   <Globe className="h-4 w-4 text-muted-foreground" />
   </div>
   <div className="flex flex-col">
   <span className="text-[14px] leading-[20px]">Your Site</span>
   <span className="max-w-[300px] truncate text-[12px] leading-[16px] text-muted-foreground">
    {displayUrl}
   </span>
   </div>
   <MoreVertical className="ml-auto h-4 w-4 text-muted-foreground" />
  </div>
  
  <h3 className="cursor-pointer truncate text-[20px] leading-[26px] font-medium text-primary hover:underline">
   {displayTitle}
  </h3>
  
  <p className="mt-1 line-clamp-2 text-[14px] leading-[22px] text-muted-foreground">
   {displayDescription}
  </p>
  </CardContent>
 </Card>
 );
}
