import { FileText } from 'lucide-react';

export default function Logo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500">
                <FileText className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Invoicey
            </span>
        </div>
    );
}
