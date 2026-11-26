import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { reviewService } from '@/services/reviewService';
import type { OrderDetailResponse, ReviewResponse } from '@/types';
import { cn } from '@/lib/utils';

const ratingLabels = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'];

interface ReviewDialogProps {
  /** Món trong đơn đã giao đang được đánh giá; null = đóng hộp thoại */
  item: OrderDetailResponse | null;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (orderDetailId: number, review: ReviewResponse) => void;
}

/** Hộp thoại viết đánh giá cho một món trong đơn đã giao (mỗi món một lần). */
export const ReviewDialog = ({ item, onOpenChange, onSubmitted }: ReviewDialogProps) => {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const shown = hovered || rating;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRating(5);
      setComment('');
    }
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    if (!item) return;
    setSubmitting(true);
    try {
      const res = await reviewService.createReview(item.productId, {
        rating,
        comment: comment.trim() || undefined,
        orderDetailId: item.id,
      });
      if (!res.success || !res.data) throw new Error(res.message);
      toast({ title: 'Đã gửi đánh giá', description: `Cảm ơn bạn đã đánh giá ${item.productName}.` });
      onSubmitted(item.id, res.data);
      handleOpenChange(false);
    } catch (error) {
      toast({
        title: 'Không gửi được đánh giá',
        description: 'Món này có thể đã được đánh giá rồi. Tải lại trang rồi thử lại.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Đánh giá sản phẩm</DialogTitle>
          <DialogDescription className="line-clamp-2">{item?.productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label id="review-rating-label">Chấm điểm</Label>
            <div className="flex items-center gap-3">
              <div
                role="radiogroup"
                aria-labelledby="review-rating-label"
                className="flex items-center gap-1"
                onMouseLeave={() => setHovered(0)}
              >
                {ratingLabels.map((label, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} sao — ${label}`}
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHovered(value)}
                      className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star
                        className={cn(
                          'h-7 w-7 transition-colors',
                          value <= shown ? 'fill-warning text-warning' : 'text-muted-foreground/40'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
                {ratingLabels[shown - 1]}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Nhận xét (không bắt buộc)</Label>
            <Textarea
              id="review-comment"
              rows={4}
              maxLength={1000}
              placeholder="Sản phẩm dùng thế nào, đóng gói và giao hàng ra sao..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Huỷ
          </Button>
          <Button variant="glow" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Gửi đánh giá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
