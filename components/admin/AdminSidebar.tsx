import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../types';
import { APP_TITLE } from '../../constants';
import { getUsers } from '../../services/dataService';
import Modal from '../shared/Modal';

interface AdminSidebarProps {
    user: User;
    onLogout: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const handlePrint = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>Stampa Credenziali</title><style>body{font-family:sans-serif;padding:1rem} h3{margin-bottom:1rem;} p{margin:0.5rem 0;}</style></head><body>${printContent.innerHTML}</body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    } else {
        alert("Per favore, abilita i pop-up per poter stampare.");
    }
};

const SortableHeader: React.FC<{
    columnKey: keyof User;
    title: string;
    sortConfig: { key: keyof User; direction: 'ascending' | 'descending' };
    requestSort: (key: keyof User) => void;
    className?: string;
}> = ({ columnKey, title, sortConfig, requestSort, className = '' }) => {
    const isSorted = sortConfig.key === columnKey;
    const directionIcon = sortConfig.direction === 'ascending' ? '▲' : '▼';
    return (
        <th className={`p-3 font-semibold text-gray-600 ${className}`}>
            <button onClick={() => requestSort(columnKey)} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                {title}
                {isSorted && <span className="text-xs">{directionIcon}</span>}
            </button>
        </th>
    );
};


const CredentialsModal: React.FC<{
    onClose: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}> = ({ onClose, showToast }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'ascending' | 'descending' }>({
        key: 'username',
        direction: 'ascending',
    });

    useEffect(() => {
        const fetchUsers = async () => {
            const allUsers = await getUsers();
            setUsers(allUsers.filter(u => u.role === 'customer'));
            setIsLoading(false);
        };
        fetchUsers();
    }, []);

    const requestSort = (key: keyof User) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredUsers = useMemo(() => {
        let filteredUsers = users.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig.key) {
            filteredUsers.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || typeof aValue === 'undefined') return 1;
                if (bValue === null || typeof bValue === 'undefined') return -1;

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredUsers;
    }, [users, searchTerm, sortConfig]);

    const handleCopyCredentials = async (user: User) => {
        if(!user.password) {
            showToast("Password non disponibile per la copia.", 'error');
            return;
        }
        const textToCopy = `Username: ${user.username}\nPassword: ${user.password}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast('Credenziali copiate!', 'success');
        } catch (err) {
            console.error("Failed to copy credentials: ", err);
            showToast("Errore durante la copia.", 'error');
        }
    };

    const copyIcon = (
        <img src="https://i.imgur.com/fm35sfJ.png" alt="Copia" className="w-5 h-5" />
    );
    
    const printIcon = <img src="https://i.imgur.com/RVrYSWe.png" alt="Stampa" className="w-5 h-5" />;

    return (
        <Modal title="Cassaforte Credenziali" onClose={onClose} size="3xl">
            <div className="space-y-4">
                <input
                    type="search"
                    placeholder="Cerca per nome o username..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="form-input w-full"
                />
                <div className="max-h-[60vh] overflow-y-auto hide-scrollbar">
                   {isLoading ? (
                        <div className="text-center p-8 text-gray-500">Caricamento...</div>
                   ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {sortedAndFilteredUsers.map(user => (
                                <div key={user.id} className="bg-white p-4 rounded-lg border border-black/10 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-800">{user.firstName} {user.lastName}</p>
                                            <p className="text-sm text-gray-500">Creato il: {new Date(user.creationDate).toLocaleDateString('it-IT')}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleCopyCredentials(user)} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-indigo-600" title="Copia">{copyIcon}</button>
                                            <button onClick={() => handlePrint(`printable-creds-${user.id}`)} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-indigo-600" title="Stampa">{printIcon}</button>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-200/80 space-y-1 text-sm">
                                        <p><span className="font-medium text-gray-500 w-20 inline-block">Username:</span> <span className="font-mono text-indigo-600">{user.username}</span></p>
                                        <p><span className="font-medium text-gray-500 w-20 inline-block">Password:</span> <span className="font-mono text-gray-700">{user.password}</span></p>
                                    </div>
                                    <div id={`printable-creds-${user.id}`} className="hidden">
                                        <h3>Credenziali per {user.firstName || ''} {user.lastName || ''} ({user.username})</h3>
                                        <p><strong>Username:</strong> {user.username}</p>
                                        <p><strong>Password:</strong> {user.password}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block border border-black/10 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100/80">
                                    <tr>
                                        <SortableHeader columnKey="username" title="Username" sortConfig={sortConfig} requestSort={requestSort} />
                                        <th className="p-3 font-semibold text-gray-600">Nome Cliente</th>
                                        <th className="p-3 font-semibold text-gray-600">Password</th>
                                        <SortableHeader columnKey="creationDate" title="Data Creazione" sortConfig={sortConfig} requestSort={requestSort} />
                                        <th className="w-24 text-gray-600 text-center">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedAndFilteredUsers.map(user => (
                                        <tr key={user.id} className="border-b border-black/5 last:border-b-0 hover:bg-gray-100/60">
                                            <td className="p-3 font-mono text-indigo-600">{user.username}</td>
                                            <td className="p-3">{user.firstName} {user.lastName}</td>
                                            <td className="p-3 font-mono text-gray-700">{user.password}</td>
                                            <td className="p-3 text-gray-500 whitespace-nowrap">
                                                {new Date(user.creationDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleCopyCredentials(user)} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-indigo-600" title="Copia credenziali">{copyIcon}</button>
                                                    <button onClick={() => handlePrint(`printable-creds-${user.id}`)} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-indigo-600" title="Stampa credenziali">{printIcon}</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {sortedAndFilteredUsers.length === 0 && (
                            <p className="text-center text-gray-500 py-8">Nessun utente trovato.</p>
                        )}
                    </>
                   )}
                </div>
            </div>
        </Modal>
    );
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, onLogout, showToast }) => {
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    
    const safeIcon = (
        <svg fill="currentColor" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
            <path d="M769.17857956 772.8394846H299.6675073c-32.94814542 0-60.40493329-27.45678784-60.40493329-60.40493328V242.92347905c0-32.94814542 27.45678784-60.40493329 60.40493329-60.40493327h469.51107226c32.94814542 0 60.40493329 27.45678784 60.40493325 60.40493327v469.51107227c0 32.94814542-26.54156159 60.40493329-60.40493325 60.40493328zM299.6675073 218.21236998c-13.72839391 0-24.71110907 10.98271516-24.71110906 24.71110907v469.51107227c0 13.72839391 10.98271516 24.71110907 24.71110906 24.71110905h469.51107226c13.72839391 0 24.71110907-10.98271516 24.71110906-24.71110905V242.92347905c0-13.72839391-10.98271516-24.71110907-24.71110906-24.71110907H299.6675073z"  />
            <path d="M534.88065653 641.04690289c-90.60739991 0-164.74072711-74.1333272-164.7407271-164.74072709s74.1333272-164.74072711 164.7407271-164.74072712 164.74072711 74.1333272 164.74072712 164.74072712-73.21810095 164.74072711-164.74072712 164.74072709z m0-294.70285627c-71.38764842 0-129.04690289 57.6592545-129.0469029 129.04690292s57.6592545 129.04690289 129.0469029 129.0469029 129.04690289-57.6592545 129.04690293-129.0469029-57.6592545-129.04690289-129.04690293-129.04690292z"  />
            <path d="M682.23208468 579.72674338c-2.74567878 0-6.40658382-0.91522626-9.15226261-2.74567879l-147.35142816-86.03126861c-5.49135757-2.74567878-9.15226261-9.15226261-9.15226261-15.55884644V306.98931737c0-10.06748889 8.23703635-17.38929897 17.38929897-17.38929896 10.06748889 0 17.38929897 8.23703635 17.38929897 17.38929896v158.33414329l138.19916553 80.539911c8.23703635 4.5761313 10.98271516 15.55884645 6.40658383 24.7111091-1.83045253 6.40658382-7.3218101 9.15226261-13.72839392 9.15226262z"  />
            <path d="M388.44445468 579.72674338c-6.40658382 0-11.8979414-2.74567878-15.55884645-9.15226262-4.5761313-8.23703635-1.83045253-19.21975149 6.40658383-24.7111091l147.35142811-86.03126859c8.23703635-4.5761313 19.21975149-1.83045253 24.71110907 6.40658385 4.5761313 8.23703635 1.83045253 19.21975149-6.40658382 24.71110906l-147.35142814 86.03126861c-3.66090506 1.83045253-6.40658382 2.74567878-9.1522626 2.74567879z"  />
            <path d="M864.36211077 868.93824208h-658.96290844c-34.77859794 0-62.2353858-28.37201411-62.23538579-62.23538582v-658.96290843c0-34.77859794 28.37201411-62.2353858 62.23538579-62.23538579h658.96290844c34.77859794 0 62.2353858 28.37201411 62.2353858 62.23538579v658.96290843c0 34.77859794-28.37201411 62.2353858-62.2353858 62.23538582z m-658.96290844-747.73985584c-14.64362017 0-26.54156159 11.8979414-26.5415616 26.54156159v658.96290843c0 14.64362017 11.8979414 26.54156159 26.5415616 26.5415616h658.96290844c14.64362017 0 26.54156159-11.8979414 26.54156157-26.5415616v-658.96290843c0-14.64362017-11.8979414-26.54156159-26.54156157-26.54156159h-658.96290844z"  />
            <path d="M387.52922842 938.49543796H252.07574167c-10.06748889 0-17.38929897-8.23703635-17.38929897-17.38929898v-67.72674336c0-10.06748889 8.23703635-17.38929897 17.38929897-17.38929899h136.36871301c10.06748889 0 17.38929897 8.23703635 17.38929895 17.38929899v67.72674336c0 9.15226261-8.23703635 17.38929897-18.30452521 17.38929898z m-118.06418777-35.6938242h100.67488878v-32.03291917h-100.67488878v32.03291917zM818.60079767 938.49543796h-136.36871299c-10.06748889 0-17.38929897-8.23703635-17.38929896-17.38929898v-67.72674336c0-10.06748889 8.23703635-17.38929897 17.38929896-17.38929899h136.36871299c10.06748889 0 17.38929897 8.23703635 17.38929896 17.38929899v67.72674336c0.91522626 9.15226261-7.3218101 17.38929897-17.38929896 17.38929898z m-118.06418774-35.6938242h100.67488876v-32.03291917h-100.67488876v32.03291917z"  />
            <path d="M864.36211077 868.93824208h-658.96290844c-34.77859794 0-62.2353858-28.37201411-62.23538579-62.23538582v-658.96290843c0-34.77859794 28.37201411-62.2353858 62.23538579-62.23538579h658.96290844c34.77859794 0 62.2353858 28.37201411 62.2353858 62.23538579v658.96290843c0 34.77859794-28.37201411 62.2353858-62.2353858 62.23538582z m-658.96290844-747.73985584c-14.64362017 0-26.54156159 11.8979414-26.5415616 26.54156159v658.96290843c0 14.64362017 11.8979414 26.54156159 26.5415616 26.5415616h658.96290844c14.64362017 0 26.54156159-11.8979414 26.54156157-26.5415616v-658.96290843c0-14.64362017-11.8979414-26.54156159-26.54156157-26.54156159h-658.96290844zM115.70702868 348.17449915c-10.06748889 0-17.38929897-8.23703635-17.38929896-17.38929897V217.29714374c0-10.06748889 8.23703635-17.38929897 17.38929896-17.38929898 10.06748889 0 17.38929897 8.23703635 17.38929898 17.38929898v113.48805644c0 9.15226261-7.3218101 17.38929897-17.38929898 17.38929897zM115.70702868 756.36541187c-10.06748889 0-17.38929897-8.23703635-17.38929896-17.38929898v-113.48805644c0-10.06748889 8.23703635-17.38929897 17.38929896-17.38929897 10.06748889 0 17.38929897 8.23703635 17.38929898 17.38929897v113.48805644c0 10.06748889-7.3218101 17.38929897-17.38929898 17.38929898z"  />
            <path d="M534.88065653 531.21975149c-30.20246662 0-54.91357571-24.71110907-54.91357569-54.91357569s24.71110907-54.91357571 54.91357569-54.91357571 54.91357571 24.71110907 54.91357573 54.91357571c0.91522626 30.20246662-23.79588279 54.91357571-54.91357573 54.91357569z m0-75.04855347c-10.98271516 0-19.21975149 9.15226261-19.21975147 20.13497778s9.15226261 20.13497775 19.21975147 20.13497775c10.98271516 0 20.13497775-9.15226261 20.13497776-20.13497775s-9.15226261-20.13497775-20.13497776-20.13497778z"  />
        </svg>
    );

    return (
        <>
            <header className="bg-gray-800/95 backdrop-blur-xl text-gray-300 flex-shrink-0 shadow-lg shadow-black/10 z-40 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-7 h-7 text-indigo-400 stroke-current">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.se-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-white hidden sm:block">{APP_TITLE}</h1>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <button 
                                onClick={() => setIsCredentialsModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 bg-white/10 hover:bg-white/20 transition-colors"
                                title="Apri cassaforte credenziali"
                            >
                                {safeIcon}
                                <span className="hidden md:inline">Cassaforte</span>
                            </button>
                            
                            <div className="text-sm text-right hidden sm:block">
                                <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
                                <p className="text-gray-400 capitalize text-xs">{user.role}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 bg-white/10 hover:bg-white/20 hover:text-white transition-colors"
                                title="Logout"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            {isCredentialsModalOpen && <CredentialsModal onClose={() => setIsCredentialsModalOpen(false)} showToast={showToast} />}
        </>
    );
};

export default AdminSidebar;