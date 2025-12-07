import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Separator } from '../../components/ui/separator';
import { Loader2, Plus, CheckCircle, Trash2, UploadCloud } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { productService } from '../../services/productService';
import type { ProductResponse, ProductVariantResponse, UpdateVariantRequest, UploadImageRequest, ProductImageResponse } from '../../types';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';

type PendingImage = {
  id: string; 
  file: File;
  url: string; 
  isThumbnail?: boolean; 
};

const ModalImageUploader = ({ 
  onFileSelected,
  loading,
  setAsThumbnail,
  onSetAsThumbnailChange
}: { 
  onFileSelected: (file: File, isThumbnail: boolean) => void;
  loading: boolean;
  setAsThumbnail: boolean;
  onSetAsThumbnailChange: (checked: boolean) => void;
}) => {

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    onFileSelected(file, setAsThumbnail);
    
    e.target.value = ""; 
  };

  return (
    <div className="space-y-2">
      <div className="relative aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary">
        {loading ? <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" /> : <Plus className="h-6 w-6 text-muted-foreground" />}
        <p className="text-xs text-muted-foreground mt-1">Thêm ảnh</p>
        <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileSelect} disabled={loading} accept="image/*" />
      </div>
      <div className="flex items-center space-x-2 px-1">
        <Checkbox
          id="set-as-thumbnail"
          checked={setAsThumbnail}
          onCheckedChange={(checked) => onSetAsThumbnailChange(checked === true)}
          disabled={loading}
        />
        <label htmlFor="set-as-thumbnail" className="text-xs text-muted-foreground cursor-pointer">
          Đặt làm ảnh bìa
        </label>
      </div>
    </div>
  );
};


interface EditVariantModalProps {
  product: ProductResponse;
  variant: ProductVariantResponse;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const EditVariantModal = ({ product, variant: initialVariant, onClose, onSaveSuccess }: EditVariantModalProps) => {
  
  
  const [variantInput, setVariantInput] = useState({
    sku: initialVariant.sku,
    price: initialVariant.price || 0,
  });

  
  const [images, setImages] = useState<ProductImageResponse[]>(initialVariant.images || []);
  
  
  
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  
  const [thumbToSet, setThumbToSet] = useState<number | null>(
    initialVariant.images.find(img => img.isThumbnail)?.id || null
  );
  
  const [setAsThumbnailOnUpload, setSetAsThumbnailOnUpload] = useState(false);
  
  
  const [loading, setLoading] = useState(false);
  
  
  useEffect(() => {
    return () => {
      pendingImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [pendingImages]);

  
  const handleFileSelected = (file: File, isThumbnail: boolean) => {
    const tempId = `pending-${Math.random()}`;
    const url = URL.createObjectURL(file);
    
    
    if (isThumbnail) {
      
      setPendingImages(prev => 
        prev.map(img => ({ ...img, isThumbnail: false }))
      );
      setThumbToSet(null);
      setImages(prev => 
        prev.map(img => ({ ...img, isThumbnail: false }))
      );
    }
    
    setPendingImages(prev => [...prev, { id: tempId, file, url, isThumbnail }]);
    
    
    if (isThumbnail) {
      setSetAsThumbnailOnUpload(false);
    }
  };

  
  const handleDeletePendingImage = (tempId: string) => {
    const imageToRevoke = pendingImages.find(img => img.id === tempId);
    if (imageToRevoke) {
      URL.revokeObjectURL(imageToRevoke.url);
    }
    setPendingImages(prev => prev.filter(img => img.id !== tempId));
  };

  
  const handleSetPendingThumbnail = (tempId: string) => {
    setPendingImages(prev => 
      prev.map(img => ({
        ...img,
        isThumbnail: img.id === tempId
      }))
    );
    
    if (thumbToSet) {
      setThumbToSet(null);
      setImages(prev => 
        prev.map(img => ({ ...img, isThumbnail: false }))
      );
    }
  };

  
  const handleDeleteImage = (imageId: number) => {
     if(!window.confirm("Bạn chắc chắn muốn xóa ảnh này?")) return;
     
     
     setIdsToDelete(prev => [...prev, imageId]);
     
     
     setImages(prev => prev.filter(img => img.id !== imageId));
  }
  
  
  const handleSetThumbnail = (imageId: number) => {
     
     setThumbToSet(imageId);
     
     
     setImages(prev => 
       prev.map(img => ({ ...img, isThumbnail: img.id === imageId }))
     );
     
     
     setPendingImages(prev => 
       prev.map(img => ({ ...img, isThumbnail: false }))
     );
  }

  
  const handleSave = async () => {
    setLoading(true);
    try {
      
      const updateRequest: UpdateVariantRequest = {
        sku: variantInput.sku,
        price: variantInput.price,
        attributes: initialVariant.attributes,
      };
      
      const deletePromises = idsToDelete.map(id => 
        productService.deleteImage(product.id, id.toString())
      );
      
      await Promise.all([
        productService.updateVariant(product.id, initialVariant.id, updateRequest),
        ...deletePromises
      ]);

      
      const uploadResults = await Promise.all(
        pendingImages.map(async (pending) => {
          const uploadReq: UploadImageRequest = {
            targetId: initialVariant.id,
            isThumbnail: false, 
          };
          const response = await productService.uploadImage(product.id, uploadReq, pending.file);
          return { pending, response };
        })
      );

      
      
      const pendingThumbnail = uploadResults.find(result => result.pending.isThumbnail);
      
      if (pendingThumbnail && pendingThumbnail.response?.data?.id) {
        
        await productService.setThumbnail(product.id, pendingThumbnail.response.data.id.toString());
      } else if (thumbToSet && !idsToDelete.includes(thumbToSet)) {
        
        await productService.setThumbnail(product.id, thumbToSet.toString());
      }
      
      toast({ title: "Thành công", description: "Đã cập nhật biến thể" });
      onSaveSuccess(); 

    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      setLoading(false); 
    }
    
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa biến thể</DialogTitle>
          <DialogDescription>
            Quản lý chi tiết cho SKU: {initialVariant.sku}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Form Chi tiết */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={variantInput.sku} onChange={(e) => setVariantInput(v => ({ ...v, sku: e.target.value }))} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="price">Giá (VND)</Label>
              <Input id="price" type="number" value={variantInput.price} onChange={(e) => setVariantInput(v => ({ ...v, price: Number(e.target.value) }))} />
            </div>
          </div>
          
          <Separator />
          
          {/* Quản lý Hình ảnh */}
          <div className="space-y-4">
            <Label>Hình ảnh ({images.length + pendingImages.length})</Label>
            
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              
              {/* Render ảnh ĐÃ CÓ */}
              {images.map((img) => (
                  <div key={img.id} className={`relative aspect-square rounded-md overflow-hidden border group ${thumbToSet === img.id ? 'ring-2 ring-primary' : ''}`}>
                    {thumbToSet === img.id && (
                      <Badge className="absolute top-1 left-1 z-10 text-xs bg-primary text-primary-foreground">Bìa</Badge>
                    )} 
                    <img src={img.imageUrl} alt={img.altText || "Product image"} className="h-full w-full object-cover" />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => handleDeleteImage(img.id)}
                      >
                         <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      {thumbToSet !== img.id && (
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => handleSetThumbnail(img.id)}
                            title="Đặt làm ảnh bìa"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                      )}
                    </div>
                  </div>
              ))}
              
              {/* Render ảnh CHỜ UPLOAD */}
              {pendingImages.map((img) => (
                  <div key={img.id} className={`relative aspect-square rounded-md overflow-hidden border group ring-2 ${img.isThumbnail ? 'ring-primary' : 'ring-yellow-500'}`}>
                    {img.isThumbnail && (
                      <Badge className="absolute top-1 left-1 z-10 text-xs bg-primary text-primary-foreground">Sẽ đặt làm bìa</Badge>
                    )}
                    {!img.isThumbnail && (
                      <Badge variant="secondary" className="absolute top-1 left-1 z-10 text-xs">Chờ upload</Badge>
                    )}
                    <img src={img.url} alt="Pending upload" className="h-full w-full object-cover" />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => handleDeletePendingImage(img.id)}
                        title="Hủy upload"
                      >
                         <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      {!img.isThumbnail && (
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => handleSetPendingThumbnail(img.id)}
                          title="Đặt làm ảnh bìa"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
              ))}
              
              {/* Component Upload (đã sửa) */}
              <ModalImageUploader 
                onFileSelected={handleFileSelected}
                loading={loading}
                setAsThumbnail={setAsThumbnailOnUpload}
                onSetAsThumbnailChange={setSetAsThumbnailOnUpload}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Hủy</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};