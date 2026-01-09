/**
 * Clients Page
 * 
 * Requirements: 8.1, 8.2 - Loading and error states
 */

import { useState, FormEvent } from 'react';
import {
    Search,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    Mail,
    Phone,
    Building2,
    X,
    MapPin,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Client, ClientInput } from '../lib/database.types';

// Loading spinner component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading clients...</p>
        </div>
    </div>
);

// Error display component
const ErrorDisplay = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Failed to load clients
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {message}
                </p>
            </div>
            <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
                <RefreshCw className="h-4 w-4" />
                Try Again
            </button>
        </div>
    </div>
);

export default function Clients() {
    const { clients, invoices, addClient, updateClient, deleteClient, isLoading, error, refreshData, clearError } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [deleteConfirmClient, setDeleteConfirmClient] = useState<Client | null>(null);
    const [clientHasInvoices, setClientHasInvoices] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState<ClientInput>({
        name: '',
        email: '',
        company: '',
        phone: '',
        address: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Filter clients by search
    const filteredClients = clients.filter(client => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            client.name.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query) ||
            (client.company?.toLowerCase().includes(query) ?? false)
        );
    });

    // Check if client has invoices
    const checkClientHasInvoices = (clientId: string): boolean => {
        return invoices.some(inv => inv.clientId === clientId);
    };

    // Reset form to initial state
    const resetForm = () => {
        setFormData({ name: '', email: '', company: '', phone: '', address: '' });
        setFormErrors({});
    };

    // Open add modal
    const openAddModal = () => { resetForm(); setIsAddModalOpen(true); };

    // Open edit modal with client data
    const openEditModal = (client: Client) => {
        setFormData({
            name: client.name, email: client.email, company: client.company || '',
            phone: client.phone || '', address: client.address || '',
        });
        setFormErrors({});
        setEditingClient(client);
        setActiveMenu(null);
    };

    // Close modal
    const closeModal = () => { setIsAddModalOpen(false); setEditingClient(null); resetForm(); };

    // Handle form input changes
    const handleInputChange = (field: keyof ClientInput, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; });
        }
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setFormErrors({});
        
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
        
        if (Object.keys(errors).length > 0) { setFormErrors(errors); setIsSaving(false); return; }
        
        try {
            const result = editingClient 
                ? await updateClient(editingClient.id, formData)
                : await addClient(formData);
            if (result.valid) closeModal();
            else setFormErrors(result.errors);
        } finally { setIsSaving(false); }
    };

    // Handle delete
    const handleDeleteClick = (client: Client) => {
        setActiveMenu(null);
        setClientHasInvoices(checkClientHasInvoices(client.id));
        setDeleteConfirmClient(client);
    };

    const confirmDelete = async () => {
        if (deleteConfirmClient) {
            await deleteClient(deleteConfirmClient.id);
            setDeleteConfirmClient(null);
            setClientHasInvoices(false);
        }
    };

    const cancelDelete = () => { setDeleteConfirmClient(null); setClientHasInvoices(false); };

    const handleRetry = async () => { clearError(); await refreshData(); };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={error} onRetry={handleRetry} />;

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Clients</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your client contacts and information.</p>
                </div>
                <button onClick={openAddModal} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                    <Plus className="h-4 w-4" />Add Client
                </button>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search clients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400" />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => (
                    <div key={client.id} className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="absolute right-3 top-3">
                            <button onClick={() => setActiveMenu(activeMenu === client.id ? null : client.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                            {activeMenu === client.id && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                    <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                        <button onClick={() => openEditModal(client)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"><Pencil className="h-4 w-4" />Edit</button>
                                        <button onClick={() => handleDeleteClick(client)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"><Trash2 className="h-4 w-4" />Delete</button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-semibold text-white">{client.name.split(' ').map((n) => n[0]).join('')}</div>
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate font-semibold text-slate-900 dark:text-white">{client.name}</h3>
                                {client.company && <p className="truncate text-sm text-slate-500 dark:text-slate-400">{client.company}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"><Mail className="h-4 w-4 flex-shrink-0" /><span className="truncate">{client.email}</span></a>
                            {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"><Phone className="h-4 w-4 flex-shrink-0" /><span>{client.phone}</span></a>}
                            {client.address && <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400"><MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" /><span className="line-clamp-2">{client.address}</span></div>}
                        </div>
                    </div>
                ))}
            </div>

            {filteredClients.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">No clients found</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{searchQuery ? 'Try adjusting your search' : 'Add your first client to get started'}</p>
                </div>
            )}

            {(isAddModalOpen || editingClient) && (
                <>
                    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="fixed inset-x-4 top-1/2 z-50 max-h-[90vh] -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-3xl sm:-translate-x-1/2">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-8 py-5 dark:border-slate-700 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                                    <Building2 className="h-5 w-10 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{editingClient ? 'Update client information' : 'Enter client details below'}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Name - Full width */}
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Full Name <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={formData.name} 
                                            onChange={(e) => handleInputChange('name', e.target.value)} 
                                            className={`w-full rounded-xl border ${formErrors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500`} 
                                            placeholder="John Doe" 
                                            disabled={isSaving} 
                                        />
                                    </div>
                                    {formErrors.name && <p className="mt-2 text-sm text-rose-500">{formErrors.name}</p>}
                                </div>
                                
                                {/* Email */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="email" 
                                            value={formData.email} 
                                            onChange={(e) => handleInputChange('email', e.target.value)} 
                                            className={`w-full rounded-xl border ${formErrors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500`} 
                                            placeholder="john@example.com" 
                                            disabled={isSaving} 
                                        />
                                    </div>
                                    {formErrors.email && <p className="mt-2 text-sm text-rose-500">{formErrors.email}</p>}
                                </div>
                                
                                {/* Phone */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="tel" 
                                            value={formData.phone} 
                                            onChange={(e) => handleInputChange('phone', e.target.value)} 
                                            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" 
                                            placeholder="+1 (555) 123-4567" 
                                            disabled={isSaving} 
                                        />
                                    </div>
                                </div>
                                
                                {/* Company */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={formData.company} 
                                            onChange={(e) => handleInputChange('company', e.target.value)} 
                                            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" 
                                            placeholder="Acme Inc" 
                                            disabled={isSaving} 
                                        />
                                    </div>
                                </div>
                                
                                {/* Address - Full width */}
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                                        <textarea 
                                            rows={3} 
                                            value={formData.address} 
                                            onChange={(e) => handleInputChange('address', e.target.value)} 
                                            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" 
                                            placeholder="123 Main Street&#10;Suite 100&#10;San Francisco, CA 94105" 
                                            disabled={isSaving} 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {formErrors.general && (
                                <div className="mt-6 rounded-lg bg-rose-50 p-4 dark:bg-rose-900/20">
                                    <p className="text-sm text-rose-600 dark:text-rose-400">{formErrors.general}</p>
                                </div>
                            )}
                            
                            {/* Footer */}
                            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
                                <button 
                                    type="button" 
                                    onClick={closeModal} 
                                    disabled={isSaving} 
                                    className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving} 
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {editingClient ? 'Save Changes' : 'Add Client'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {deleteConfirmClient && (
                <>
                    <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={cancelDelete} />
                    <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:left-1/2 sm:right-auto sm:max-w-md sm:-translate-x-1/2">
                        <div className="flex items-start gap-4">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${clientHasInvoices ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                                {clientHasInvoices ? <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" /> : <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Client</h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                    Are you sure you want to delete <span className="font-medium">{deleteConfirmClient.name}</span>?
                                    {clientHasInvoices && <span className="mt-2 block text-amber-600 dark:text-amber-400">Warning: This client has existing invoices.</span>}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={cancelDelete} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
                            <button type="button" onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600">Delete</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
