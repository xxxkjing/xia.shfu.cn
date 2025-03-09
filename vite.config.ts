// vite.config.ts
import { defineConfig } from "vite";
import path from "path"; // 确保已安装 @types/node

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 确保路径指向正确
    },
  },
})；
export default defineConfig({ base: './' });
