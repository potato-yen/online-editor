import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void>; // 支援 async
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'password' | 'email';
  confirmLabel?: string;
  validationMinLength?: number;
}

export default function InputModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  defaultValue = '',
  placeholder = '',
  inputType = 'text',
  confirmLabel = 'Confirm',
  validationMinLength = 0,
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
      setLoading(false);
      // 自動聚焦
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (value.trim().length < validationMinLength) {
      setError(`Minimum length is ${validationMinLength} characters.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(value);
      onClose(); // 成功後關閉
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={onClose} // 點擊背景關閉
    >
      <Card 
        className="w-full max-w-sm border-border-highlight shadow-2xl bg-surface-panel"
        onMouseDown={(e) => e.stopPropagation()} // 阻止冒泡
      >
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {description && (
              <p className="text-sm text-content-secondary">{description}</p>
            )}
            
            {error && (
              <div className="p-2 text-xs text-status-error bg-status-error/10 border border-status-error/20 rounded">
                {error}
              </div>
            )}

            <Input
              ref={inputRef}
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
              className="bg-surface-base"
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-3 pt-2">
            <Button 
              type="button"
              variant="ghost" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary" 
              isLoading={loading}
            >
              {confirmLabel}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}