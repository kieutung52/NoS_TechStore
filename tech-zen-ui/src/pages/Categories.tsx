import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Card, CardContent } from '../components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { categoryService } from '../services/categoryService';
import type { CategoryResponse } from '../types';
import { ChevronRight, Package } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

const Categories = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
     
      const response = await categoryService.getAllCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };
  
 
  const parentCategories = categories.filter(c => !c.parentCategoryId);
  
  const handleTriggerClick = (category: CategoryResponse) => {
    if (!category.children || category.children.length === 0) {
      navigate(`/products?category=${category.id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Danh mục sản phẩm</h1>
          <p className="text-muted-foreground">Khám phá sản phẩm theo danh mục</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-4">
            {parentCategories.map((parent) => (
              <AccordionItem key={parent.id} value={`item-${parent.id}`} className="border-b-0">
                <Card>
                  <AccordionTrigger 
                    className="p-6 text-lg font-semibold hover:no-underline"
                    onClick={() => handleTriggerClick(parent)}
                    hideChevron={!parent.children || parent.children.length === 0}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      {parent.name}
                    </div>
                  </AccordionTrigger>
                  
                  {parent.children && parent.children.length > 0 && (
                    <AccordionContent className="p-6 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {parent.children.map((child) => (
                          <Link to={`/products?category=${child.id}`} key={child.id}>
                            <Card className="group hover:shadow-md hover:border-primary transition-all">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium text-foreground">{child.name}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {child.description}
                                  </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  )}
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categories;