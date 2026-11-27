import { useEffect, useState, useCallback } from 'react';
import { Button, buttonVariants } from '../../components/ui/button'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input'; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'; 
import { Label } from '../../components/ui/label'; 
import { Textarea } from '../../components/ui/textarea'; 
import { toast } from '../../hooks/use-toast'; 
import { categoryService } from '../../services/categoryService'; 
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../../types'; 
import { Plus, Edit, Trash2, ChevronRight, Loader2, FolderTree } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { TableMessageRow } from '../../components/admin/AdminTable';
import { cn } from '../../lib/utils'; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'; 


const CategoryForm = ({
  category,
  categories, 
  onBack,
  onSaveSuccess,
}: {
  category: Partial<CategoryResponse> | null;
  categories: CategoryResponse[];
  onBack: () => void;
  onSaveSuccess: () => void; 
}) => {
    const [formData, setFormData] = useState(category || {});
    const [loading, setLoading] = useState(false);
    const isEditing = Boolean(category?.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
        toast({ title: "Lỗi", description: "Tên danh mục là bắt buộc", variant: "destructive" });
        return;
        }
        setLoading(true);

        try {
        if (isEditing) {
            const request: UpdateCategoryRequest = {
            name: formData.name!,
            description: formData.description,
            };
            await categoryService.updateCategory(formData.id!, request);
            toast({ title: "Thành công", description: "Đã cập nhật danh mục" });
        } else {
            const request: CreateCategoryRequest = {
            name: formData.name!,
            description: formData.description,
            parentCategoryId: formData.parentCategoryId
            };
            await categoryService.createCategory(request);
            toast({ title: "Thành công", description: "Đã tạo danh mục mới" });
        }
        onSaveSuccess();
        } catch (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
        setLoading(false);
        }
    };
    return (
        <div className="space-y-6">
        <AdminPageHeader
            eyebrow="Hàng hoá · Danh mục"
            title={isEditing ? 'Sửa danh mục' : 'Thêm danh mục'}
            description={isEditing ? category?.name : 'Danh mục con cần chọn danh mục cha.'}
            onBack={onBack}
        />

        <form onSubmit={handleSubmit}>
            <Card className="max-w-2xl">
            <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                <Label htmlFor="name">Tên danh mục</Label>
                <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="parentCategory">Danh mục cha (Tùy chọn)</Label>
                <Select
                    value={formData.parentCategoryId?.toString() || "0"}
                    onValueChange={(value) => setFormData({ 
                    ...formData, 
                    parentCategoryId: value === "0" ? undefined : parseInt(value) 
                    })}
                >
                    <SelectTrigger id="parentCategory">
                    <SelectValue placeholder="Chọn danh mục cha (nếu có)" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="0">Không có (Đây là danh mục cha)</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>

                <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả ngắn về danh mục..."
                />
                </div>
                
                <div className="flex justify-end gap-2 border-t border-border pt-5">
                <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Huỷ</Button>
                <Button type="submit" variant="glow" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Đang lưu...' : 'Lưu danh mục'}
                </Button>
                </div>
            </CardContent>
            </Card>
        </form>
        </div>
    );
};



const CategoryRow = ({
  category,
  level = 0,
  onEdit,
  onDelete
}: {
  category: CategoryResponse;
  level?: number;
  onEdit: (cat: CategoryResponse) => void;
  onDelete: (cat: CategoryResponse) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  
  const productCount = category.products?.length || 0;

  return (
    <>
      <TableRow className={cn(level > 0 && 'bg-field/40')}>
        <TableCell style={{ paddingLeft: `${level * 28 + 16}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-expanded={isOpen}
                aria-label={isOpen ? `Thu gọn ${category.name}` : `Mở danh mục con của ${category.name}`}
                onClick={() => setIsOpen(!isOpen)}
              >
                <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
              </Button>
            ) : (
              // Nhánh cây cho danh mục không có con
              <span aria-hidden="true" className="ml-3 mr-1 h-px w-4 bg-border" />
            )}
            <span className={cn(level === 0 ? 'font-semibold' : 'text-muted-foreground')}>{category.name}</span>
            {hasChildren && (
              <span className="font-mono text-[11px] text-muted-foreground">({category.children.length})</span>
            )}
          </div>
        </TableCell>
        <TableCell className="w-[100px] text-center font-mono text-xs tabular-nums">{productCount}</TableCell>
        <TableCell className="max-w-md">
          <p className="line-clamp-1 text-muted-foreground">{category.description || '—'}</p>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Sửa ${category.name}`} onClick={() => onEdit(category)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" aria-label={`Xoá ${category.name}`} onClick={() => onDelete(category)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      
      {isOpen && hasChildren && category.children.map(child => (
        <CategoryRow
          key={child.id}
          category={child}
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};


const CategoriesManagement = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedCategory, setSelectedCategory] = useState<Partial<CategoryResponse> | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAllCategories(); 
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  
  const handleEdit = (cat: CategoryResponse) => {
    setSelectedCategory(cat);
    setView('form');
  };
  const handleAddNew = () => {
    setSelectedCategory(null);
    setView('form');
  };
  const handleBack = () => {
    setView('list');
    setSelectedCategory(null);
  };
  const handleSaveSuccess = () => {
    fetchData();
    setView('list');
  };
  const openDeleteDialog = (cat: CategoryResponse) => {
    setCategoryToDelete(cat);
    setShowDeleteDialog(true);
  };
  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      toast({ title: "Đã xóa", description: `Đã xóa danh mục ${categoryToDelete.name}` });
      fetchData();
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
    setShowDeleteDialog(false);
    setCategoryToDelete(null);
  };


  if (view === 'form') {
    return (
      <CategoryForm
        category={selectedCategory}
        
        categories={categories.filter(c => !c.parentCategoryId)} 
        onBack={handleBack}
        onSaveSuccess={handleSaveSuccess}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Hàng hoá"
          title="Danh mục"
          description="Cây danh mục hai cấp: danh mục cha và danh mục con."
          actions={
            <Button variant="glow" onClick={handleAddNew}>
              <Plus className="h-4 w-4" />
              Thêm danh mục
            </Button>
          }
        />

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <span className="inline-flex items-center gap-2"><FolderTree className="h-3.5 w-3.5" /> Tên danh mục</span>
                  </TableHead>
                  <TableHead className="w-[100px] text-center">Số SP</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableMessageRow colSpan={4} loading />
                ) : categories.length === 0 ? (
                  <TableMessageRow colSpan={4}>Chưa có danh mục nào.</TableMessageRow>
                ) : (
                  categories.filter(c => !c.parentCategoryId).map((cat) => (
                    <CategoryRow
                      key={cat.id}
                      category={cat}
                      onEdit={handleEdit}
                      onDelete={openDeleteDialog}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* ... (Giữ nguyên Delete Dialog) ... */} 
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa danh mục "{categoryToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive' })}>
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategoriesManagement;