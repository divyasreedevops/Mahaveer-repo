import { useState, useCallback } from 'react';
import type { DialogAction } from '@/components/ui/AppDialog';

export interface DialogConfig {
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
  actions?: DialogAction[];
}

export const useDialog = () => {
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const showDialog = useCallback((options: DialogConfig) => {
    if (__DEV__) console.log('[useDialog] showDialog called with:', JSON.stringify(options));
    setConfig(options);
  }, []);

  const hideDialog = useCallback(() => {
    if (__DEV__) console.log('[useDialog] hideDialog called');
    setConfig(null);
  }, []);

  return {
    showDialog,
    hideDialog,
    dialogProps: {
      visible: !!config,
      title: config?.title || '',
      message: config?.message,
      icon: config?.icon,
      iconColor: config?.iconColor,
      iconBgColor: config?.iconBgColor,
      actions: config?.actions,
      onDismiss: hideDialog,
    },
  };
};
