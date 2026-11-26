import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Card } from '../components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { categoryService } from '../services/categoryService';
import type { CategoryResponse } from '../types';
import { ChevronRight } from 'lucide-react';
import { categoryIconFor } from '../lib/categoryIcon';
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
      navigate(`/products?categoryId=${category.id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Danh mục sản phẩm</h1>
          <p className="text-muted-foreground">Khám phá sản phẩm theo danh mục</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-3">
            {parentCategories.map((parent, i) => {
              const Icon = categoryIconFor(parent.name);
              const hasChildren = parent.children && parent.children.length > 0;
              return (
                <AccordionItem
                  key={parent.id}
                  value={`item-${parent.id}`}
                  className="group/item animate-rise border-b-0"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Card className="overflow-hidden transition-colors duration-200 hover:border-input group-data-[state=open]/item:border-primary/40">
                    <AccordionTrigger
                      className="group px-5 py-4 hover:no-underline"
                      onClick={() => handleTriggerClick(parent)}
                      hideChevron={!hasChildren}
                    >
                      <div className="flex items-center gap-4">
                        <span className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-field text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:text-primary group-data-[state=open]:border-primary/40 group-data-[state=open]:text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="text-left">
                          <span className="block text-base font-semibold text-foreground">{parent.name}</span>
                          <span className="block font-mono text-[11px] font-normal text-muted-foreground">
                            {hasChildren ? `${parent.children.length} danh mục con` : "Xem sản phẩm"}
                          </span>
                        </div>
                      </div>
                      {!hasChildren && (
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      )}
                    </AccordionTrigger>

                    {hasChildren && (
                      <AccordionContent className="px-5 pb-5 pt-0">
                        <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
                          {parent.children.map((child) => (
                            <Link
                              to={`/products?categoryId=${child.id}`}
                              key={child.id}
                              className="group/child flex items-center justify-between gap-3 rounded-lg border border-border bg-field/60 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
                            >
                              <div className="min-w-0">
                                <h3 className="font-sans font-medium text-foreground">{child.name}</h3>
                                {child.description && (
                                  <p className="line-clamp-1 text-sm text-muted-foreground">{child.description}</p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover/child:translate-x-1 group-hover/child:text-primary" />
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    )}
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categories;
