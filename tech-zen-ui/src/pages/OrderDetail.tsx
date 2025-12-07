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
} from "lucide-react";

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
        <main className="container mx-auto px-4 py-8 flex-1">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-40 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  // ==============================
  // Render chính
  // ==============================
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate("/orders")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div>
                <h1 className="text-3xl font-bold">
                  Chi tiết đơn hàng #{String(order.id).slice(0, 8)}...
                </h1>
                <p className="text-muted-foreground">
                  Ngày đặt:{" "}
                  {new Date(order.orderDate).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            {/* trạng thái + nút xác nhận */}
            <div className="flex items-center gap-4">
              <OrderStatusBadge status={order.status} />

              {order.status === OrderStatus.SHIPPED && (
                <Button onClick={handleConfirmDelivery} disabled={confirmLoading}>
                  {confirmLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Xác nhận đã nhận hàng
                </Button>
              )}
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sản phẩm */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
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
                          <TableCell className="font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell>x{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.priceEach)}
                          </TableCell>
                          <TableCell className="text-right">
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
                  <div className="space-y-2 text-right">
                    <div className="flex justify-end gap-4">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span className="font-medium w-32">
                        {formatCurrency(order.totalAmount - order.shippingFee)}
                      </span>
                    </div>

                    <div className="flex justify-end gap-4">
                      <span className="text-muted-foreground">
                        Phí vận chuyển:
                      </span>
                      <span className="font-medium w-32">
                        {formatCurrency(order.shippingFee)}
                      </span>
                    </div>

                    <div className="flex justify-end gap-4 text-lg font-bold">
                      <span className="text-foreground">Tổng cộng:</span>
                      <span className="text-primary w-32">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Thanh toán */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Thông tin thanh toán
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p>
                    Phương thức:{" "}
                    {order.paymentMethodId === 1
                      ? "Thanh toán khi nhận hàng (COD)"
                      : "Thanh toán qua Ví"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* THEO DÕI ĐƠN */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Theo dõi đơn hàng
                  </CardTitle>
                </CardHeader>

                <CardContent className="h-80 w-full p-0">
                  {mapProps ? (
                    <OrderTrackingMap {...mapProps} />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-muted">
                      <HelpCircle className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-sm">
                        Không có dữ liệu vị trí
                      </p>
                    </div>
                  )}
                </CardContent>

                {address && (
                  <CardContent className="pt-4 space-y-1 text-sm">
                    <p className="font-semibold">
                      {address.recipientFullName}
                    </p>
                    <p className="text-muted-foreground">
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
