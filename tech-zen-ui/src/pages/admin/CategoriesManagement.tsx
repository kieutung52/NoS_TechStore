import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../components/ui/button'; 
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
import { Plus, Edit, Trash2, ArrowLeft, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
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
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
            <h1 className="text-3xl font-bold">
                {isEditing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </h1>
            <p className="text-muted-foreground">Quản lý thông tin danh mục</p>
            </div>
        </div>

        <form onSubmit={handleSubmit}>
            <Card>
            <CardContent className="p-6 space-y-6">
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
                
                <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
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
      <TableRow>
        <TableCell style={{ paddingLeft: `${level * 24 + 16}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            <span className={cn(level === 0 ? "font-semibold" : "font-normal", !hasChildren ? "ml-10" : "")}>
              {category.name}
            </span>
          </div>
        </TableCell>
        {/* SỬA: Thêm cột Product Count */}
        <TableCell className="w-[100px] text-center">{productCount}</TableCell>
        <TableCell className="text-muted-foreground line-clamp-1">{category.description}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(category)}>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý danh mục</h1>
            <p className="text-muted-foreground">Quản lý cây danh mục sản phẩm</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm danh mục
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {/* SỬA: Thêm cột */}
                <TableRow>
                  <TableHead>Tên danh mục</TableHead>
                  <TableHead className="w-[100px] text-center">Số SP</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center"> {/* Sửa colSpan */}
                      Đang tải...
                    </TableCell>
                  </TableRow>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategoriesManagement;