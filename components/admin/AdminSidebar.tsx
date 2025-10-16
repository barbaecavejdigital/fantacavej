import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../types';
import { APP_TITLE } from '../../constants';
import { getUsers } from '../../services/dataService';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import ThemeToggle from '../shared/ThemeToggle';

const handleSinglePrint = (customer: User) => {
    const printContentHtml = `<div style="font-family: sans-serif; padding: 1rem; page-break-inside: avoid;"><div style="background-color: #f1f5f9; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0;"><p><strong>Username:</strong> <span style="font-family: monospace; padding: 0.25rem; background-color: #e2e8f0; border-radius: 0.25rem;">${customer.username}</span></p><p style="margin-top: 0.5rem;"><strong>Password:</strong> <span style="font-family: monospace; padding: 0.25rem; background-color: #e2e8f0; border-radius: 0.25rem;">${customer.password}</span></p></div></div>`;
    const printWindow = window.open('', '_blank', 'height=400,width=600');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Stampa Credenziali</title></head><body>' + printContentHtml + '</body></html>');
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    } else { alert("Per favore, abilita i pop-up per poter stampare."); }
};

const PrintCredentialsContent: React.FC<{onClose: () => void}> = ({onClose}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allCustomers, setAllCustomers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            const users = await getUsers();
            setAllCustomers(users.filter(u => u.role === 'customer'));
            setIsLoading(false);
        };
        fetchCustomers();
    }, []);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return allCustomers;
        return allCustomers.filter(c => c.username.toLowerCase().includes(searchTerm.toLowerCase()) || c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastName?.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allCustomers, searchTerm]);

    return (
      <div className="dark:text-slate-300">
        <input type="search" placeholder="Cerca per nome o username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition mb-4" />
        <div className="max-h-96 overflow-y-auto border dark:border-slate-700 rounded-lg">
            {isLoading ? (<p className="text-center p-8 text-slate-500">Caricamento...</p>) : (
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-200 dark:bg-slate-700"><tr className="text-sm"><th className="p-2 font-semibold border-b dark:border-slate-600">Username</th><th className="p-2 font-semibold border-b dark:border-slate-600">Password</th><th className="p-2 font-semibold border-b dark:border-slate-600">Nome</th><th className="p-2 font-semibold border-b dark:border-slate-600"></th></tr></thead>
                <tbody>
                    {filteredCustomers.map(c => (
                        <tr key={c.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="p-2 font-mono text-xs">{c.username}</td><td className="p-2 font-mono text-xs">{c.password}</td><td className="p-2 text-sm">{c.firstName ? `${c.firstName} ${c.lastName}` : '-'}</td>
                            <td className="p-2 text-center">
                                <button onClick={() => handleSinglePrint(c)} className="p-1.5 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full" title={`Stampa ${c.username}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredCustomers.length === 0 && !isLoading && (<tr><td colSpan={4} className="text-center p-8 text-slate-500">Nessun cliente trovato.</td></tr>)}
                </tbody>
            </table>
            )}
        </div>
        <div className="mt-6 flex justify-end"><Button onClick={onClose} variant="secondary">Chiudi</Button></div>
      </div>
    );
}

interface AdminSidebarProps { user: User; onLogout: () => void; }

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, onLogout }) => {
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    return (
        <>
            <div className="w-64 bg-white dark:bg-slate-800 h-full flex flex-col shadow-lg shrink-0">
                <div onClick={() => setIsPrintModalOpen(true)} className="flex items-center justify-center h-24 border-b border-slate-200 dark:border-slate-700 cursor-pointer" title="Visualizza/Stampa credenziali">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-600 dark:text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white ml-2">{APP_TITLE}</h1>
                </div>

                <nav className="flex-grow p-4"><ul className="space-y-2">
                    <li><a href="#" className="flex items-center px-4 py-3 text-slate-700 dark:text-slate-200 bg-purple-100 dark:bg-purple-500/20 rounded-lg font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>Dashboard
                    </a></li>
                </ul></nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200" title={`${user.firstName} ${user.lastName}`}>{user.firstName} {user.lastName}</p>
                        <ThemeToggle />
                    </div>
                    <Button onClick={onLogout} fullWidth variant="secondary" size="sm">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                        Logout
                    </Button>
                </div>
            </div>
             {isPrintModalOpen && (<Modal title="Credenziali Clienti" onClose={() => setIsPrintModalOpen(false)} size="2xl"><PrintCredentialsContent onClose={() => setIsPrintModalOpen(false)} /></Modal>)}
        </>
    );
};

export default AdminSidebar;