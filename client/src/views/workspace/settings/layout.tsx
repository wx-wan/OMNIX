import CustomizerControls from "@/components/shared/Customizer";
import { SettingsLayout } from "./index";

/**
 * /settings/layout — 用户要求把右下角 Customizer 收进设置模块后新增的布局页。
 * 复用设置页公共外壳；6 个分组与状态写入全部由 CustomizerControls 承载。
 */
export default function SettingsLayoutPage() {
  return (
    <SettingsLayout>
      <CustomizerControls />
    </SettingsLayout>
  );
}
