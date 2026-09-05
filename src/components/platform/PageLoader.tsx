type PageLoaderProps = {
  label?: string;
};

export function PageLoader({ label = "Yuklanmoqda..." }: PageLoaderProps) {
  return (
    <div className="platform-loader">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
    </div>
  );
}
