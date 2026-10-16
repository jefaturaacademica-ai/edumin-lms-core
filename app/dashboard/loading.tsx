export default function DashboardLoading() {
  return (
    <div className="w-full flex-1 min-h-[60vh] flex items-center justify-center p-6" aria-label="Cargando...">
      <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
