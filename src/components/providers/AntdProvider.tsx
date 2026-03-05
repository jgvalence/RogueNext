"use client";

import type { ReactNode } from "react";
import { App as AntdApp, ConfigProvider } from "antd";
import { rogueAntdTheme } from "@/lib/design-system/antd-theme";

interface AntdProviderProps {
  children: ReactNode;
}

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider theme={rogueAntdTheme}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
