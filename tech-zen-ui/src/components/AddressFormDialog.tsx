import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressSearch } from '@/components/AddressSearch';
import { toast } from '@/hooks/use-toast';
import { addressService } from '@/services/addressService';
import type { AddressResponse, CreateAddressRequest } from '@/types';
import type { NominatimResult } from '@/services/mapService';

const emptyForm = (fullName = ''): CreateAddressRequest => ({
  recipientFullName: fullName,
  recipientPhone: '',
  district: '',
  city: 'Hà Nội',
  country: 'Việt Nam',
  note: '',
});

interface AddressFormDialogProps {
  open: boolean;
  /** Địa chỉ đang sửa; null = thêm mới */
  address: AddressResponse | null;
  /** Họ tên điền sẵn khi thêm mới */
  defaultFullName?: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/** Hộp thoại thêm / sửa địa chỉ giao hàng (trang Hồ sơ). */
export const AddressFormDialog = ({ open, address, defaultFullName, onOpenChange, onSaved }: AddressFormDialogProps) => {
  const [form, setForm] = useState<CreateAddressRequest>(emptyForm(defaultFullName));
  const [saving, setSaving] = useState(false);
  const isEdit = !!address;

  // Mỗi lần mở: nạp địa chỉ đang sửa, hoặc form trống
  useEffect(() => {
    if (!open) return;
    setForm(
      address
        ? {
            recipientFullName: address.recipientFullName,
            recipientPhone: address.recipientPhone,
            district: address.district,
            city: address.city,
            country: address.country,
            latitude: address.latitude,
            longitude: address.longitude,
            note: address.note ?? '',
          }
        : emptyForm(defaultFullName)
    );
  }, [open, address, defaultFullName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id.replace('addr-', '')]: value }));
  };

  // Chọn địa danh: điền quận, thành phố, toạ độ (dùng cho bản đồ theo dõi đơn)
  const handlePlaceSelect = (result: NominatimResult) => {
    setForm((prev) => ({
      ...prev,
      district: result.address.city_district || result.address.suburb || prev.district,
      city: result.address.city || prev.city,
      country: result.address.country || prev.country,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      note: result.display_name.split(',').slice(0, 2).join(', '),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = isEdit
        ? await addressService.updateAddress(address.id, form)
        : await addressService.createAddress(form);
      if (!res.success) throw new Error(res.message);
      toast({ title: isEdit ? 'Đã lưu địa chỉ' : 'Đã thêm địa chỉ' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Không lưu được địa chỉ', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
          <DialogDescription>Tìm địa danh để điền nhanh quận, thành phố và vị trí trên bản đồ.</DialogDescription>
        </DialogHeader>

        <form id="address-form" onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-2">
            <Label>Tìm địa danh</Label>
            <AddressSearch onAddressSelect={handlePlaceSelect} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addr-recipientFullName">Họ và tên</Label>
              <Input id="addr-recipientFullName" value={form.recipientFullName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-recipientPhone">Số điện thoại</Label>
              <Input
                id="addr-recipientPhone"
                type="tel"
                inputMode="tel"
                value={form.recipientPhone}
                onChange={handleChange}
                className="font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addr-district">Quận/Huyện</Label>
              <Input id="addr-district" value={form.district} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-city">Tỉnh/Thành phố</Label>
              <Input id="addr-city" value={form.city} onChange={handleChange} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addr-note">Địa chỉ cụ thể / Ghi chú</Label>
            <Input id="addr-note" value={form.note} onChange={handleChange} placeholder="Số nhà, ngõ, toà nhà..." />
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" form="address-form" variant="glow" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {isEdit ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
