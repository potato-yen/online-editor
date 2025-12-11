import React from 'react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName = '這個項目',
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-sm border-status-error/30 shadow-2xl bg-surface-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="text-status-error flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            確認刪除
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-2">
          <p className="text-content-secondary text-sm">
            您確定要刪除 <span className="font-bold text-content-primary">{itemName}</span> 嗎？
          </p>
          <p className="text-xs text-status-error/80 bg-status-error/10 p-2 rounded border border-status-error/20">
            此動作無法復原，檔案將會永久遺失。
          </p>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-2">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isDeleting}
          >
            取消
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            {isDeleting ? '刪除中...' : '確認刪除'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}