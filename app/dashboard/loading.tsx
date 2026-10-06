import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="w-full min-h-screen grid place-items-center bg-slate-50 text-slate-900">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Cargando tu aula virtual EDUMIN...
        </p>
      </div>
    </div>
  );
}
