"use client";

import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Globe, MoreVertical } from"lucide-react";

type SeoPreviewProps = {
 title: string;
 description: string;
 slug: string;
 baseUrl?: string;
};

export function SeoPreview({ title, description, slug, baseUrl ="https://yourdomain.com" }: SeoPreviewProps) {
 const displayTitle = title ||"Page Title - Site Name";
 const displayDescription = description ||"Please provide a meta description by editing the snippet below. If you don't, Google will try to find a relevant part of your content to show in the search results.";
 const displayUrl = `${baseUrl}/${slug}`;

 return (
 <Card className="bg-slate-50/50 border-dashed">
  <CardHeader className="pb-2">
  <CardTitle className="font-semibold uppercase tracking-wider text-muted-foreground">
   Google Search Results Preview
  </CardTitle>
  </CardHeader>
  <CardContent className="space-y-1">
  <div className="flex items-center gap-2 text-[14px] text-[#202124] mb-1">
   <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white border shadow-sm">
   <Globe className="h-4 w-4 text-slate-400" />
   </div>
   <div className="flex flex-col">
   <span className="text-[14px] leading-[20px]">Your Site</span>
   <span className="text-[12px] leading-[16px] text-[#5f6368] truncate max-w-[300px]">
    {displayUrl}
   </span>
   </div>
   <MoreVertical className="h-4 w-4 text-[#5f6368] ml-auto" />
  </div>
  
  <h3 className="text-[20px] leading-[26px] text-[#1a0dab] hover:underline cursor-pointer font-medium truncate">
   {displayTitle}
  </h3>
  
  <p className="text-[14px] leading-[22px] text-[#4d5156] line-clamp-2 mt-1">
   {displayDescription}
  </p>
  </CardContent>
 </Card>
 );
}
