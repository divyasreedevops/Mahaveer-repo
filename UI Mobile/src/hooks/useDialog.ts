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
    setConfig(options);
  }, []);

  const hideDialog = useCallback(() => {
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
