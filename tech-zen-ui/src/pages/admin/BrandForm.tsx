import { useEffect, useState, useCallback, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast';
import { brandService } from '../../services/brandService';
import type { BrandResponse, CreateBrandRequest, UpdateBrandRequest } from '../../types';
import { ArrowLeft, UploadCloud, Loader2 } from 'lucide-react';

const BrandForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [brand, setBrand] = useState<Partial<BrandResponse>>({});
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fetchBrand = useCallback(async (brandId: number) => {
    setLoading(true);
    try {
     
      const res = await brandService.getBrandById(brandId);
      if (res.success && res.data) {
        setBrand(res.data);
        if (res.data.logoUrl) setLogoPreview(res.data.logoUrl);
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message || "Không tìm thấy thương hiệu", variant: "destructive" });
      navigate('/admin/brands');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isEditing && id) {
      fetchBrand(parseInt(id));
    }
  }, [id, isEditing, fetchBrand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.name) {
      toast({ title: "Lỗi", description: "Tên thương hiệu là bắt buộc", variant: "destructive" });
      return;
    }
    setLoading(true);
    
   
    try {
      if (isEditing) {
        const requestData: UpdateBrandRequest = {
          name: brand.name,
          description: brand.description,
        };
        await brandService.updateBrand(parseInt(id!), requestData, logoFile || undefined);
        toast({ title: "Thành công", description: "Đã cập nhật thương hiệu" });
      } else {
        const requestData: CreateBrandRequest = {
          name: brand.name!,
          description: brand.description,
        };
        await brandService.createBrand(requestData, logoFile || undefined);
        toast({ title: "Thành công", description: "Đã tạo thương hiệu mới" });
      }
      navigate('/admin/brands');
    } catch (error) {
      toast({ title: "Lỗi", description: error.message || "Thao tác thất bại", variant: "destructive" });
      setLoading(false);
    }
  };
  
  const handleChange = (field: string, value: string) => {
    setBrand(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/brands')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Chỉnh sửa thương hiệu' : 'Tạo thương hiệu mới'}
            </h1>
            <p className="text-muted-foreground">{isEditing ? brand.name : 'Tạo thương hiệu'}</p>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin thương hiệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên thương hiệu</Label>
            <Input
              id="name"
              value={brand.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={brand.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Mô tả ngắn..."
            />
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <Input id="logo-file" type="file" onChange={handleFileChange} className="mb-4" accept="image/*" />
            {logoPreview && (
              <div className="w-40 h-40 border rounded-md p-2">
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
              </div>
            )}
            {!logoPreview && (
              <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Chưa chọn logo</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default BrandForm;