import Link from"next/link";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { requireAdmin } from"@/lib/auth";
import { getMenus } from"@/lib/menu";

export default async function AdminMenusIndex() {

 await requireAdmin();
 const menus = await getMenus();

 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
 <Card className="w-full">
 <CardHeader>
 <CardTitle>Available Menus</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {menus.map((menu) => (
 <div
 key={menu.id}
 className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
 >
 <div>
 <h3>{menu.label } ({menu.name })</h3>
 </div>
 <Link href={`/admin/menus/${menu.id}` }>
 <Button variant="outline" size="sm">Edit Menu Items</Button>
 </Link>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </section>
 ); }
