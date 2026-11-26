import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";

import { toast } from "../hooks/use-toast";
import { orderService } from "../services/orderService";
import { addressService } from "../services/addressService";

import type { OrderResponse, AddressResponse } from "../types";
import { OrderStatus } from "../types";

import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  HelpCircle,
  CheckCircle,
  Loader2,
  Clock,
  Archive,
  Truck,
  XCircle,
} from "lucide-react";
import { cn } from "../lib/utils";

import { OrderStatusBadge } from "../lib/badgeUtils";
import { OrderTrackingMap } from "../components/OrderTrackingMap";

import { LatLngTuple } from "leaflet";
import { websiteConfig } from "../config/website";

const STORE_COORDS: LatLngTuple = [
  websiteConfig.contact.coordinates.lat,
  websiteConfig.contact.coordinates.lng,
];

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [address, setAddress] = useState<AddressResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ==============================
  // Fetch đơn hàng + địa chỉ
  // ==============================
  const fetchOrderDetails = useCallback(
    async (orderId: string) => {
      setLoading(true);
      try {
        const orderRes = await orderService.getOrderById(orderId);

        if (orderRes.success && orderRes.data) {
          setOrder(orderRes.data);

          try {
            const addressRes = await addressService.getAddressById(
              orderRes.data.addressId
            );
            if (addressRes.success) setAddress(addressRes.data);
          } catch (e) {
            console.error("Failed to fetch address", e);
          }
        } else throw new Error(orderRes.message);
      } catch (e) {
        toast({
          title: "Lỗi",
          description: e.message || "Không tìm thấy đơn hàng",
          variant: "destructive",
        });
        navigate("/orders");
      }

      setLoading(false);
    },
    [navigate]
  );

  useEffect(() => {
    if (id) fetchOrderDetails(id);
  }, [id, fetchOrderDetails]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("vi-VN") + "₫";

  // ==============================
  // Lấy dữ liệu map
  // ==============================
  const getMapProps = () => {
    if (!order || !address || !address.latitude || !address.longitude)
      return null;

    const userCoords: LatLngTuple = [address.latitude, address.longitude];

    let shipperCoords: LatLngTuple | undefined = undefined;

    if (
      order.status === OrderStatus.SHIPPED &&
      order.latitude &&
      order.longitude
    ) {
      shipperCoords = [order.latitude, order.longitude];
    }

    return { storeCoords: STORE_COORDS, userCoords, shipperCoords };
  };

  const mapProps = getMapProps();

  // ==============================
  // Xác nhận đã nhận hàng
  // ==============================
  const handleConfirmDelivery = async () => {
    if (!id) return;

    setConfirmLoading(true);

    try {
      const res = await orderService.deliverOrder(id);

      if (res.success && res.data) {
        setOrder(res.data);
        toast({
          title: "Thành công",
          description: "Đơn hàng đã được xác nhận giao hàng.",
        });
      } else throw new Error(res.message);
    } catch (e) {
      toast({
        title: "Lỗi",
        description: e.message,
        variant: "destructive",
      });
    }

    setConfirmLoading(false);
  };

  // ==============================
  // Loading Skeleton
  // ==============================
  if (loading || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-10 flex-1">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Skeleton className="h-20 w-full mb-6 rounded-xl" />
          <Skeleton className="h-64 w-full mb-6 rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </main>
        <Footer />
      </div>
    );
  }

  // Tiến trình đơn: thứ tự là thông tin thật (chờ → xử lý → giao → nhận)
  const progressSteps = [
    { status: OrderStatus.PENDING, label: "Chờ xử lý", Icon: Clock },
    { status: OrderStatus.PROCESSING, label: "Đang xử lý", Icon: Archive },
    { status: OrderStatus.SHIPPED, label: "Đang giao", Icon: Truck },
    { status: OrderStatus.DELIVERED, label: "Đã giao", Icon: CheckCircle },
  ];
  const currentStep = progressSteps.findIndex((step) => step.status === order.status);
  const isStopped = currentStep === -1; // Đã hủy / hoàn tiền

  // ==============================
  // Render chính
  // ==============================
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" aria-label="Quay lại danh sách đơn hàng" onClick={() => navigate("/orders")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div>
                <h1 className="text-2xl font-bold md:text-3xl">
                  Đơn hàng <span className="font-mono text-xl font-medium text-muted-foreground md:text-2xl">#{String(order.id).slice(0, 8).toUpperCase()}</span>
                </h1>
                <p className="font-mono text-xs text-muted-foreground">
                  Ngày đặt: {new Date(order.orderDate).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            {/* trạng thái + nút xác nhận */}
            <div className="flex flex-wrap items-center gap-3">
              <OrderStatusBadge status={order.status} />

              {order.status === OrderStatus.SHIPPED && (
                <Button variant="glow" onClick={handleConfirmDelivery} disabled={confirmLoading}>
                  {confirmLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <CheckCircle />
                  )}
                  Xác nhận đã nhận hàng
                </Button>
              )}
            </div>
          </div>

          {/* Dải tiến trình đơn hàng */}
          <Card className="mb-6">
            <CardContent className="p-5">
              {isStopped ? (
                <div className="flex items-center gap-3 text-sm">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
                    <XCircle className="h-4 w-4" />
                  </span>
                  <span className="text-muted-foreground">
                    Đơn hàng đã dừng xử lý ({order.status === OrderStatus.REFUNDED ? "đã hoàn tiền" : "đã hủy"}).
                  </span>
                </div>
              ) : (
                <ol className="grid grid-cols-4 gap-2">
                  {progressSteps.map(({ status, label, Icon }, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;
                    return (
                      <li key={status} className="relative flex flex-col items-center gap-2 text-center">
                        {/* Đoạn nối tới bước tiếp theo */}
                        {i < progressSteps.length - 1 && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-[17px] h-0.5 rounded-full",
                              i < currentStep ? "bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--plasma)))]" : "bg-border"
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "relative grid h-9 w-9 place-items-center rounded-full border transition-all",
                            done && "border-primary/50 bg-primary/15 text-primary",
                            active && "border-primary bg-primary text-primary-foreground shadow-glow-sm",
                            !done && !active && "border-border bg-field text-muted-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className={cn("text-xs", active ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {/* Sản phẩm */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-primary" />
                    Sản phẩm
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Tổng</TableHead>
                        {order.status === OrderStatus.DELIVERED && (
                          <TableHead className="text-right">Đánh giá</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {order.details.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="min-w-[10rem] font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell className="font-mono text-xs">x{item.quantity}</TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums">
                            {formatCurrency(item.priceEach)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums">
                            {formatCurrency(item.priceEach * item.quantity)}
                          </TableCell>

                          {order.status === OrderStatus.DELIVERED && (
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `/products/${
                                      item.productVariantId.split("-")[0]
                                    }`
                                  )
                                }
                              >
                                Viết đánh giá
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Separator className="my-4" />

                  {/* Tổng tiền */}
                  <dl className="ml-auto max-w-xs space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Tạm tính</dt>
                      <dd className="font-mono tabular-nums">
                        {formatCurrency(order.totalAmount - order.shippingFee)}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Phí vận chuyển</dt>
                      <dd className="font-mono tabular-nums">
                        {formatCurrency(order.shippingFee)}
                      </dd>
                    </div>

                    <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                      <dt className="font-semibold text-foreground">Tổng cộng</dt>
                      <dd className="font-display text-2xl font-semibold tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Thanh toán */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Thông tin thanh toán
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Phương thức: </span>
                    {order.paymentMethodId === 1
                      ? "Thanh toán khi nhận hàng (COD)"
                      : "Thanh toán qua Ví"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* THEO DÕI ĐƠN */}
            <div className="space-y-6 lg:sticky lg:top-32 lg:col-span-1">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Theo dõi đơn hàng
                  </CardTitle>
                </CardHeader>

                {/* isolate: giữ z-index của Leaflet bên dưới header dính */}
                <CardContent className="isolate h-80 w-full border-y border-border p-0">
                  {mapProps ? (
                    <OrderTrackingMap {...mapProps} className="rounded-none" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-field">
                      <HelpCircle className="mb-2 h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Không có dữ liệu vị trí
                      </p>
                    </div>
                  )}
                </CardContent>

                {address && (
                  <CardContent className="space-y-1 pt-4 text-sm">
                    <p className="font-semibold">
                      {address.recipientFullName}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {address.recipientPhone}
                    </p>
                    <p className="text-muted-foreground">
                      {`${address.note || ""} ${address.district}, ${address.city}`}
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderDetail;
