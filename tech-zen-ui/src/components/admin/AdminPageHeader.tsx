import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Nhãn nhỏ phía trên tiêu đề (nhóm menu) */
  eyebrow?: string;
  /** Đường dẫn nút quay lại. Là một Link nên đặt trong <form> cũng không submit form. */
  backTo?: string;
  /** Quay lại bằng hàm (khi form là một chế độ xem trong cùng trang) */
  onBack?: () => void;
  actions?: React.ReactNode;
}

const backClass = cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'mt-1 shrink-0');

/** Đầu trang chung của khu admin: quay lại · nhãn nhóm · tiêu đề · mô tả · thao tác. */
export const AdminPageHeader = ({ title, description, eyebrow, backTo, onBack, actions }: AdminPageHeaderProps) => (
  <div className="flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      {backTo && (
        <Link to={backTo} aria-label="Quay lại" className={backClass}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}
      {!backTo && onBack && (
        <button type="button" aria-label="Quay lại" className={backClass} onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      <div className="min-w-0 space-y-1">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="truncate text-2xl font-bold md:text-3xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
