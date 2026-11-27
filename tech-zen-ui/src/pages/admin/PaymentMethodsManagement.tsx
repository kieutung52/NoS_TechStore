import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button, buttonVariants } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { CreditCard, Edit, Loader2, Plus, Trash2, Wallet } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { cn } from "../../lib/utils";
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
    const [methodToDelete, setMethodToDelete] = useState<PaymentMethodResponse | null>(null);
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
        setMethodToDelete(null);
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
            // BE trả "active" (Lombok bỏ tiền tố "is"); UI đọc isActive như handleToggle
            if (res.success && res.data) setMethods(res.data.map(pm => ({ ...pm, isActive: pm.isActive ?? pm.active ?? false })));
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
    };

    // OrderService nhận diện thanh toán bằng ví qua tên "Wallet" — đổi tên là hỏng luồng trả bằng ví
    const isWalletMethod = (name?: string) => name?.trim().toLowerCase() === "wallet";

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Bán hàng"
                title="Phương thức thanh toán"
                description="Bật/tắt phương thức khách được chọn khi thanh toán."
                actions={
                    <Button variant="glow" onClick={openAddModal}>
                        <Plus className="h-4 w-4" />
                        Thêm phương thức
                    </Button>
                }
            />

            <Card className="overflow-hidden">
                {methods.length === 0 ? (
                    <p className="p-10 text-center text-sm text-muted-foreground">
                        {loading ? "Đang tải…" : "Chưa có phương thức thanh toán nào."}
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {methods.map((pm) => {
                            const Icon = isWalletMethod(pm.methodName) ? Wallet : CreditCard;
                            return (
                                <li key={pm.id} className="flex flex-wrap items-center gap-4 p-4 sm:px-6">
                                    <span
                                        className={cn(
                                            "grid h-10 w-10 shrink-0 place-items-center rounded-lg border",
                                            pm.isActive ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-field text-muted-foreground"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold">{pm.methodName}</span>
                                            <span className="font-mono text-[11px] text-muted-foreground">#{pm.id}</span>
                                            <Badge variant={pm.isActive ? "success" : "secondary"}>{pm.isActive ? "Đang bật" : "Đã tắt"}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{pm.description || "—"}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Switch
                                            checked={pm.isActive}
                                            disabled={loading}
                                            onCheckedChange={() => handleToggle(pm.id)}
                                            aria-label={pm.isActive ? `Tắt ${pm.methodName}` : `Bật ${pm.methodName}`}
                                            className="mr-2"
                                        />
                                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Sửa ${pm.methodName}`} onClick={() => openEditModal(pm)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" aria-label={`Xoá ${pm.methodName}`} onClick={() => setMethodToDelete(pm)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>

            {/* Thêm / sửa phương thức */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>{editMode ? "Sửa phương thức" : "Thêm phương thức"}</DialogTitle>
                        <DialogDescription>Tên và mô tả khách thấy ở bước thanh toán.</DialogDescription>
                    </DialogHeader>
                    <form id="payment-method-form" onSubmit={handleFormSubmit} className="space-y-4 py-1">
                        <div className="space-y-2">
                            <Label htmlFor="methodName">Tên phương thức</Label>
                            <Input id="methodName" value={form.methodName} onChange={handleFormChange} required />
                            {editMode && isWalletMethod(editMode.methodName) && (
                                <p className="text-xs text-warning">Giữ nguyên tên "Wallet": hệ thống dùng tên này để trừ tiền ví khi đặt hàng.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Input id="description" value={form.description} onChange={handleFormChange} />
                        </div>
                    </form>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Huỷ</Button>
                        <Button type="submit" form="payment-method-form" variant="glow" disabled={loading}>
                            {loading && <Loader2 className="animate-spin" />}
                            {editMode ? "Lưu" : "Thêm mới"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!methodToDelete} onOpenChange={(open) => !open && setMethodToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xoá phương thức "{methodToDelete?.methodName}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Khách sẽ không chọn được phương thức này nữa. Muốn tạm ngưng thì nên tắt thay vì xoá.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={() => methodToDelete && handleDelete(methodToDelete.id)}
                        >
                            Xoá
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PaymentMethodsManagement;
