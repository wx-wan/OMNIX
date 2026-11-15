import { useTranslation } from "react-i18next";

export default function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t(title)}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">内容建设中…</p>
      </div>
    </div>
  );
}
