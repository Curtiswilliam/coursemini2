import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { DollarSign, Search, ShoppingCart } from "lucide-react";

export default function AdminOrders() {
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
  });

  const filtered = orders?.filter((o: any) =>
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
    o.status?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.amount || 0), 0) || 0;

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "default";
      case "PENDING": return "secondary";
      case "REFUNDED": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold">Orders & Revenue</h1>
          <p className="text-muted-foreground mt-1">Track all transactions</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${orders?.length ? (totalRevenue / orders.length).toFixed(2) : "0.00"}
                </p>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : filtered && filtered.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filtered.map((order: any) => (
                  <div key={order.id} className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{order.user?.name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{order.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{order.course?.title || "Unknown Course"}</span>
                        {order.coupon && <span>Coupon: {order.coupon.code}</span>}
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {order.originalAmount !== order.amount && (
                        <span className="text-xs text-muted-foreground line-through">${order.originalAmount?.toFixed(2)}</span>
                      )}
                      <span className="font-bold text-sm">${order.amount?.toFixed(2)}</span>
                      <Badge variant={statusColor(order.status) as any}>{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">Orders will appear here when students enroll in paid courses</p>
          </div>
        )}
      </div>
    </div>
  );
}
