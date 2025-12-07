import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { toast } from "../../hooks/use-toast";
import {
    getAllPaymentMethods,
    togglePayment,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
} from "../../services/paymentMethodService";
import type { PaymentMethodResponse, CreatePaymentRequest } from "../../types";

const PaymentMethodsManagement = () => {
    const [methods, setMethods] = useState<PaymentMethodResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editMode, setEditMode] = useState<PaymentMethodResponse | null>(null);
    const [form, setForm] = useState<CreatePaymentRequest>({ methodName: "", description: "" });
    const openAddModal = () => {
        setEditMode(null);
        setForm({ methodName: "", description: "" });
        setModalOpen(true);
    };

    const openEditModal = (pm: PaymentMethodResponse) => {
        setEditMode(pm);
        setForm({ methodName: pm.methodName, description: pm.description || "" });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa phương thức này?")) return;
        setLoading(true);
        try {
            const res = await deletePaymentMethod(id);
            if (res.success) {
                toast({ title: "Thành công", description: "Đã xóa phương thức." });
                fetchMethods();
            } else {
                toast({ title: "Lỗi", description: res.message, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể xóa phương thức", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setForm(prev => ({
            ...prev,
            [id === "methodName" ? "methodName" : id]: value
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let res;
            if (editMode) {
                res = await updatePaymentMethod(editMode.id, form);
            } else {
                res = await createPaymentMethod(form);
            }
            if (res.success) {
                toast({ title: "Thành công", description: editMode ? "Đã cập nhật." : "Đã thêm mới." });
                setModalOpen(false);
                fetchMethods();
            } else {
                toast({ title: "Lỗi", description: res.message, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể lưu phương thức", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchMethods = async () => {
        setLoading(true);
        try {
            const res = await getAllPaymentMethods();
            if (res.success && res.data) setMethods(res.data);
            else toast({ title: "Lỗi", description: res.message, variant: "destructive" });
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể tải phương thức thanh toán", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMethods(); }, []);
    const handleToggle = async (id: number) => {
        setLoading(true);
        try {
            const res = await togglePayment(id);

            if (res.success && res.data) {
                // Map active -> isActive for consistency
                const activeStatus = res.data.isActive ?? res.data.active ?? false;
                const mappedData: PaymentMethodResponse = {
                    ...res.data,
                    isActive: activeStatus
                };

                // Update local state
                setMethods(prev =>
                    prev.map(pm => pm.id === id ? mappedData : pm)
                );
                toast({
                    title: "Thành công",
                    description: activeStatus ? "Đã kích hoạt" : "Đã tắt"
                });
            } else {
                toast({ title: "Lỗi", description: res.message || "Không có dữ liệu", variant: "destructive" });
            }
        } catch (e) {
            console.error("Error in handleToggle:", e);
            toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }; return (
        <Card>
            <CardHeader>
                <CardTitle>Quản lý phương thức thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
                <Button className="mb-4" onClick={openAddModal}>Thêm phương thức mới</Button>
                <Separator className="mb-4" />
                <div className="space-y-4">
                    {methods.map((pm) => (
                        <div key={pm.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-semibold">{pm.methodName}</div>
                                <div className="text-sm text-muted-foreground">{pm.description}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={pm.isActive ? "default" : "secondary"}>
                                    {pm.isActive ? "✓ Hoạt động" : "✗ Tắt"}
                                </Badge>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={loading}
                                    onClick={() => handleToggle(pm.id)}
                                >
                                    {pm.isActive ? "Tắt" : "Bật"}
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => openEditModal(pm)}>
                                    Sửa
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(pm.id)}>
                                    Xóa
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Modal thêm/sửa phương thức */}
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                        <form className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onSubmit={handleFormSubmit}>
                            <h2 className="text-lg font-bold mb-4">{editMode ? "Sửa phương thức" : "Thêm phương thức mới"}</h2>
                            <div className="mb-4">
                                <label htmlFor="methodName" className="block font-medium mb-1">Tên phương thức</label>
                                <input id="methodName" value={form.methodName} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="description" className="block font-medium mb-1">Mô tả</label>
                                <input id="description" value={form.description} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
                                <Button type="submit" disabled={loading}>{editMode ? "Lưu" : "Thêm mới"}</Button>
                            </div>
                        </form>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PaymentMethodsManagement;
