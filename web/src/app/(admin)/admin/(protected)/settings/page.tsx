import { NativeForm } from"@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { requireAdmin } from"@/lib/auth";
import { getAppTheme, type ThemePreset } from"@/lib/app-settings";

type AdminSettingsPageProps = {
 searchParams: Promise<{ saved?: string; error?: string }>;
};

const THEME_PRESETS: { id: ThemePreset; name: string; color: string }[] = [
  { id: "black", name: "Đen huyền bí", color: "bg-black" },
  { id: "pink", name: "Hồng quyến rũ", color: "bg-pink-500" },
];

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
 await requireAdmin();
 const theme = await getAppTheme();
 const params = await searchParams;
 const themeSaved = params.saved ==="theme";

 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
  <Card className="w-full">

  <CardHeader>

  <CardTitle>Giao diện</CardTitle>

  </CardHeader>

  <CardContent>

  <div className="space-y-6">

  <div className="space-y-4">

  <h3>Tùy chọn màu sắc</h3>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

  {THEME_PRESETS.map((preset) => (

  <NativeForm

  key={preset.id}

  action="/api/admin/settings/theme"

  method="POST"

  className="w-full"

  >

  <input type="hidden" name="theme" value={preset.id} />

  <button

  type="submit"

  className={`w-full flex flex-col gap-2 p-3 rounded-lg border transition-all hover:ring-2 hover:ring-primary/20 ${

  theme === preset.id

  ?"border-primary ring-2 ring-primary/20 bg-primary/5"

  :"border-border"

  }`}

  >

  <div className={`w-full h-12 rounded-md ${preset.color}`} />

  <span className="">{preset.name}</span>

  </button>

  </NativeForm>

  ))}

  </div>

  </div>

  </div>

  </CardContent>

  </Card>
 </section>
 );
}
