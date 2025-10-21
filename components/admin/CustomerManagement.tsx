import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { User, Action, Prize, PointTransaction } from '../../types';
import { getUsers, createCustomer, updateUserPoints, getActions, deleteCustomer, getPrizes, getTransactionsForUser, reverseTransaction } from '../../services/dataService';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

const handlePrint = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>Stampa Credenziali</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-8 font-sans">${printContent.innerHTML}</body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    } else {
        alert("Per favore, abilita i pop-up per poter stampare.");
    }
};

const AssignPointsModal: React.FC<{ user: User, onClose: () => void, onUpdate: (user: User, message: string) => void }> = ({ user, onClose, onUpdate }) => {
    const [actions, setActions] = useState<Action[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchActions = async () => {
            const allActions = await getActions();
            setActions(allActions.filter(a => a.isEnabled));
            setIsLoading(false);
        }
        fetchActions();
    }, []);

    const applyAction = async (action: Action) => {
        setIsLoading(true);
        const description = action.description ? `${action.name} (${action.description})` : action.name;
        const updatedUser = await updateUserPoints(user.id, action.points, description);
        if (updatedUser) {
            onUpdate(updatedUser, `${action.points} punti assegnati per "${action.name}"`);
        }
        onClose();
    }
    
    const filteredActions = actions.filter(action => 
        action.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="text-gray-700">
            <input
                type="search"
                placeholder="Cerca azione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input mb-4"
            />
            
            <div className="space-y-2 h-[50vh] overflow-y-auto pr-1 hide-scrollbar">
                {isLoading ? <p className="text-center p-4">Caricamento...</p> : filteredActions.map(action => (
                    <div key={action.id} className="flex justify-between items-center p-4 rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md hover:border-gray-300 hover:bg-gray-50">
                        <div>
                            <p className="font-bold">{action.name}</p>
                            <p className="text-sm text-gray-500">{action.description || 'Nessuna descrizione'}</p>
                        </div>
                        <Button size="sm" onClick={() => applyAction(action)} disabled={isLoading}>
                           + {action.points} Punti
                        </Button>
                    </div>
                ))}
                 {filteredActions.length === 0 && !isLoading && (
                    <p className="text-center text-gray-500 py-8">Nessuna azione trovata.</p>
                )}
            </div>
        </div>
    );
};

const RedeemPrizeModal: React.FC<{ user: User, onClose: () => void, onUpdate: (user: User, message: string) => void }> = ({ user, onClose, onUpdate }) => {
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrizes = async () => {
            setPrizes(await getPrizes());
            setIsLoading(false);
        }
        fetchPrizes();
    }, []);

    const handleRedeem = async (prize: Prize) => {
        setIsLoading(true);
        const description = `Riscatto: ${prize.name} (${prize.description})`;
        const updatedUser = await updateUserPoints(user.id, -prize.pointsRequired, description);
        if(updatedUser) {
            onUpdate(updatedUser, `Premio "${prize.name}" riscattato con successo!`);
        }
        onClose();
    };

    return (
        <div className="text-gray-700">
            <div className="space-y-2 h-[50vh] overflow-y-auto pr-1 hide-scrollbar">
                {isLoading ? <p className="text-center p-4">Caricamento...</p> : prizes.map(prize => {
                    const canRedeem = user.points >= prize.pointsRequired;
                    return (
                        <div key={prize.id} className={`flex justify-between items-center p-4 rounded-lg border transition-all ${canRedeem ? 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300 hover:bg-gray-50' : 'bg-gray-50 opacity-60 border-gray-200'}`}>
                            <div>
                                <p className="font-bold">{prize.name}</p>
                                <p className="text-sm text-gray-500">{prize.pointsRequired} punti</p>
                            </div>
                            <Button size="sm" onClick={() => handleRedeem(prize)} disabled={!canRedeem || isLoading}>
                                Riscatta
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const parseTransactionDescription = (tx: PointTransaction) => {
    let name = tx.description;
    let description = '-';
    if (tx.type === 'reversal') {
        name = tx.description;
        description = 'Azione correttiva';
    } else if (tx.type === 'redemption' || tx.type === 'assignment') {
        const match = tx.description.match(/^(.*?)\s\((.*)\)$/);
        if (match && match.length === 3) {
            name = match[1];
            description = match[2];
        } else { name = tx.description; }
    } else if (tx.type === 'creation') {
        name = 'Account Creato';
        description = 'Benvenuto/a nel programma!';
    }
    return { name, description };
};

const HistoryModal: React.FC<{ user: User, onClose: () => void, onUpdate: (user: User, message: string) => void }> = ({ user, onClose, onUpdate }) => {
    const [transactions, setTransactions] = useState<PointTransaction[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'redeemed'>('all');
    const [txToReverse, setTxToReverse] = useState<PointTransaction | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        const userTransactions = await getTransactionsForUser(user.id);
        setTransactions(userTransactions);
        setIsLoading(false);
    }, [user.id]);
    
    useEffect(() => { fetchHistory(); }, [fetchHistory]);
    
    const assignedTransactions = transactions.filter(tx => tx.pointsChange >= 0);
    const redeemedTransactions = transactions.filter(tx => tx.pointsChange < 0);

    const handleConfirmReverse = async () => {
        if (txToReverse) {
            setIsLoading(true);
            const updatedUser = await reverseTransaction(txToReverse.id);
            if(updatedUser) onUpdate(updatedUser, 'Transazione stornata con successo.');
            await fetchHistory();
            setTxToReverse(null);
            setIsLoading(false);
        }
    };

    const renderTransactionHistory = (txs: PointTransaction[]) => {
        if (txs.length === 0) return <p className="text-center text-gray-500 py-8">Nessuna transazione in questa categoria.</p>;
        return (
            <div>
                 {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {txs.map(tx => {
                        const { name, description } = parseTransactionDescription(tx);
                        return (
                            <div key={tx.id} className={`p-4 rounded-xl border ${tx.isReversed ? 'bg-gray-100/60 border-gray-200/60 text-gray-400' : 'bg-white border-black/5 shadow-sm'}`}>
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-grow">
                                        <p className={`font-bold ${tx.isReversed ? 'line-through' : 'text-gray-800'}`}>{name}</p>
                                        <p className={`text-xs ${tx.isReversed ? 'line-through' : 'text-gray-500'}`}>{new Date(tx.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`font-bold text-lg ${tx.isReversed ? 'line-through' : (tx.pointsChange >= 0 ? 'text-green-500' : 'text-red-500')}`}>
                                            {tx.pointsChange > 0 ? `+${tx.pointsChange}` : tx.pointsChange}
                                        </p>
                                        <p className={`text-xs font-mono ${tx.isReversed ? 'line-through' : 'text-gray-500'}`}>Saldo: {tx.balanceAfter}</p>
                                    </div>
                                </div>
                                {(description !== '-' || (!tx.isReversed && (tx.type === 'assignment' || tx.type === 'redemption'))) && (
                                    <div className="mt-3 pt-3 border-t border-gray-200/80 flex justify-between items-center gap-3">
                                        <p className={`text-sm text-gray-500 ${tx.isReversed ? 'line-through' : ''}`}>{description}</p>
                                        {!tx.isReversed && (tx.type === 'assignment' || tx.type === 'redemption') && (
                                            <button onClick={() => setTxToReverse(tx)} className="p-1.5 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition-colors" title="Storna Transazione" disabled={isLoading}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left table-auto">
                        <thead className="bg-gray-100 text-gray-600 sticky top-0">
                            <tr>
                                <th className="p-3 font-semibold w-32">Data</th>
                                <th className="p-3 font-semibold">Nome</th>
                                <th className="p-3 font-semibold">Descrizione</th>
                                <th className="p-3 font-semibold w-24 text-center">Variazione</th>
                                <th className="p-3 font-semibold w-24 text-right">Saldo</th>
                                <th className="p-3 font-semibold w-16 text-center">Azione</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {txs.map(tx => {
                                const { name, description } = parseTransactionDescription(tx);
                                return (
                                    <tr key={tx.id} className={`border-b border-gray-200 last:border-b-0 ${tx.isReversed ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}>
                                        <td className={`p-3 whitespace-nowrap ${tx.isReversed ? 'line-through' : ''}`}>{new Date(tx.date).toLocaleDateString('it-IT')}</td>
                                        <td className={`p-3 font-medium break-words ${tx.isReversed ? 'line-through' : ''}`}>{name}</td>
                                        <td className={`p-3 break-words text-gray-500 ${tx.isReversed ? 'line-through' : ''}`}>{description}</td>
                                        <td className={`p-3 text-center font-bold ${tx.isReversed ? 'line-through' : (tx.pointsChange >= 0 ? 'text-green-500' : 'text-red-500')}`}>
                                            {tx.pointsChange > 0 ? `+${tx.pointsChange}` : tx.pointsChange}
                                        </td>
                                        <td className={`p-3 text-right font-mono ${tx.isReversed ? 'line-through' : ''}`}>{tx.balanceAfter}</td>
                                        <td className="p-3 text-center">
                                            {!tx.isReversed && (tx.type === 'assignment' || tx.type === 'redemption') && (
                                                <button onClick={() => setTxToReverse(tx)} className="p-1 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition-colors" title="Storna Transazione" disabled={isLoading}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const renderTabButton = (tabName: 'all' | 'assigned' | 'redeemed', label: string) => {
        const isActive = activeTab === tabName;
        return (
            <button 
                onClick={() => setActiveTab(tabName)} 
                className={`flex-1 text-center transition-colors ${isActive ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'} py-3 px-1 border-b-2 font-medium text-xs sm:text-sm`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="text-gray-700">
            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-2 sm:space-x-4">
                    {renderTabButton('all', 'Lista Movimenti')}
                    {renderTabButton('assigned', 'Punti Assegnati')}
                    {renderTabButton('redeemed', 'Premi Riscattati')}
                </nav>
            </div>
            <div className="h-[60vh] overflow-auto hide-scrollbar">
                {isLoading ? <p className="text-center p-8">Caricamento...</p> : (
                    activeTab === 'all' ? renderTransactionHistory(transactions) :
                    activeTab === 'assigned' ? renderTransactionHistory(assignedTransactions) : 
                    renderTransactionHistory(redeemedTransactions)
                )}
            </div>
            {txToReverse && (<Modal title="Conferma Storno" onClose={() => setTxToReverse(null)}><div className="text-gray-700"><p className="mb-4">Sei sicuro di voler stornare la transazione <span className="font-bold">"{txToReverse.description}"</span>?<br/>Verrà creata una transazione correttiva.</p><div className="flex justify-end gap-3 mt-6"><Button onClick={() => setTxToReverse(null)} variant="secondary" disabled={isLoading}>Annulla</Button><Button onClick={handleConfirmReverse} variant="danger" disabled={isLoading}>Conferma Storno</Button></div></div></Modal>)}
        </div>
    )
}

const SortableHeader: React.FC<{columnKey: string; title: string; sortConfig: { key: string; direction: 'ascending' | 'descending' }; requestSort: (key: string) => void;}> = ({ columnKey, title, sortConfig, requestSort }) => {
    const isSorted = sortConfig.key === columnKey;
    const directionIcon = sortConfig.direction === 'ascending' ? '▲' : '▼';
    return (<th className="p-4 font-semibold text-sm sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10 border-b border-gray-200"><button onClick={() => requestSort(columnKey)} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">{title}{isSorted && <span className="text-xs text-indigo-500">{directionIcon}</span>}</button></th>);
};

const CustomerManagement: React.FC<{onDataChange: () => void; showToast: (message: string, type?: 'success' | 'error') => void;}> = ({ onDataChange, showToast }) => {
    const [customers, setCustomers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalView, setModalView] = useState<'assign' | 'redeem' | 'history' | 'delete' | null>(null);
    const [showNewCredentials, setShowNewCredentials] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'username', direction: 'ascending' });
    const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        const allUsers = await getUsers();
        setCustomers(allUsers.filter(u => u.role === 'customer'));
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    const handleCreateCustomerRequest = () => {
        setIsCreateConfirmOpen(true);
    };
    
    const handleConfirmCreateCustomer = async () => {
        setIsCreating(true);
        try {
            const newUser = await createCustomer();
            setShowNewCredentials(newUser);
            await fetchCustomers();
            onDataChange();
            showToast(`Cliente ${newUser.username} creato!`);
        } catch (error) {
            console.error("Failed to create customer:", error);
            showToast('Errore durante la creazione del cliente.', 'error');
        } finally {
            setIsCreateConfirmOpen(false);
            setIsCreating(false);
        }
    };
    
    const handleUpdateCustomer = (updatedUser: User, message: string) => {
        setCustomers(prev => prev.map(c => c.id === updatedUser.id ? updatedUser : c));
        onDataChange();
        showToast(message);
    };

    const handleDeleteCustomer = async () => {
        if (selectedUser) {
            await deleteCustomer(selectedUser.id);
            await fetchCustomers();
            const deletedName = selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.username;
            showToast(`Cliente ${deletedName} eliminato.`);
            closeModal();
            onDataChange();
        }
    };
    
    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredCustomers = useMemo(() => {
        let filterableCustomers = [...customers];
        if (searchTerm) filterableCustomers = filterableCustomers.filter(c => ((c.firstName + " " + c.lastName).toLowerCase().includes(searchTerm.toLowerCase())) || (c.username.toLowerCase().includes(searchTerm.toLowerCase())));
        if (sortConfig.key) {
            filterableCustomers.sort((a, b) => {
                const key = sortConfig.key as keyof User;
                const aValue = a[key]; const bValue = b[key];
                if (aValue === null || typeof aValue === 'undefined') return 1;
                if (bValue === null || typeof bValue === 'undefined') return -1;
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filterableCustomers;
    }, [customers, searchTerm, sortConfig]);

    const openModal = (user: User, view: 'assign' | 'redeem' | 'history' | 'delete') => { setSelectedUser(user); setModalView(view); };
    const closeModal = () => { setSelectedUser(null); setModalView(null); };

    const handleCopyNewCredentials = async () => {
        if (!showNewCredentials) return;
        const textToCopy = `Username: ${showNewCredentials.username}\nPassword: ${showNewCredentials.password}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast('Credenziali copiate!', 'success');
        } catch (err) {
            console.error("Failed to copy new credentials: ", err);
            showToast("Errore durante la copia.", 'error');
        }
    };

    return (
        <Card className="flex flex-col h-full w-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Elenco Clienti</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <input type="search" placeholder="Cerca cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input w-full sm:w-64 !py-2.5" />
                    <Button onClick={handleCreateCustomerRequest}>Nuovo Cliente</Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
                {isLoading ? (<p className="text-center p-8 text-gray-500">Caricamento clienti...</p>) : (
                <div className="lg:hidden space-y-3">
                    {sortedAndFilteredCustomers.map(customer => (
                        <div key={customer.id} className="bg-white border border-black/5 rounded-xl shadow-md shadow-gray-200/50 p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{customer.firstName || ''} {customer.lastName || ''}</p>
                                    <p className="text-sm text-gray-500 font-mono">{customer.username}</p>
                                </div>
                                <p className="font-bold text-indigo-600 text-lg">{customer.points} <span className="text-sm font-normal">punti</span></p>
                            </div>
                             <div className="text-xs text-gray-500">
                                Cliente dal: {new Date(customer.creationDate).toLocaleDateString('it-IT')}
                            </div>
                            <div className="flex items-center justify-around border-t border-gray-200 -m-4 mt-3 p-2 bg-gray-50/50 rounded-b-xl">
                                <Button size="sm" variant="secondary" className="!px-2 !text-[11px] whitespace-nowrap" onClick={() => openModal(customer, 'assign')}>Assegna</Button>
                                <Button size="sm" variant="secondary" className="!px-2 !text-[11px] whitespace-nowrap" onClick={() => openModal(customer, 'redeem')}>Riscatta</Button>
                                <Button size="sm" variant="secondary" className="!px-2 !text-[11px] whitespace-nowrap" onClick={() => openModal(customer, 'history')}>Storico</Button>
                                <Button size="sm" variant="danger" className="!px-2 !text-[11px] whitespace-nowrap" onClick={() => openModal(customer, 'delete')}>Elimina</Button>
                            </div>
                        </div>
                    ))}
                </div>
                )}
                {!isLoading && (
                 <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <SortableHeader columnKey="username" title="Username" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader columnKey="lastName" title="Cognome" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader columnKey="firstName" title="Nome" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader columnKey="points" title="Punti" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader columnKey="creationDate" title="Data Creazione" sortConfig={sortConfig} requestSort={requestSort} />
                                <th className="p-4 font-semibold text-sm text-right sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10 border-b border-gray-200">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {sortedAndFilteredCustomers.map(customer => (
                                <tr key={customer.id} className="border-b border-gray-200/80 hover:bg-gray-50/70 transition-colors duration-200">
                                    <td className="p-4 font-mono text-sm">{customer.username}</td>
                                    <td className="p-4">{customer.lastName || '-'}</td>
                                    <td className="p-4">{customer.firstName || '-'}</td>
                                    <td className="p-4 font-bold text-indigo-600">{customer.points}</td>
                                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{new Date(customer.creationDate).toLocaleDateString('it-IT')}</td>
                                    <td className="p-4 text-right"><div className="flex justify-end items-center gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => openModal(customer, 'assign')}>Assegna</Button>
                                        <Button size="sm" variant="secondary" onClick={() => openModal(customer, 'redeem')}>Riscatta</Button>
                                        <Button size="sm" variant="secondary" onClick={() => openModal(customer, 'history')}>Storico</Button>
                                        <Button size="sm" variant="danger" onClick={() => openModal(customer, 'delete')}>Elimina</Button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
                 {sortedAndFilteredCustomers.length === 0 && !isLoading && (
                     <div className="text-center text-gray-500 py-12"><svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><p className="mt-4 font-semibold">Nessun cliente trovato</p><p className="text-sm">Prova a modificare i filtri di ricerca.</p></div>
                )}
            </div>
            {selectedUser && modalView === 'assign' && (<Modal title={`Assegna Punti a ${selectedUser.firstName}`} onClose={closeModal}><AssignPointsModal user={selectedUser} onClose={closeModal} onUpdate={handleUpdateCustomer} /></Modal>)}
            {selectedUser && modalView === 'redeem' && (<Modal title={`Riscatta Premio per ${selectedUser.firstName}`} onClose={closeModal}><RedeemPrizeModal user={selectedUser} onClose={closeModal} onUpdate={handleUpdateCustomer} /></Modal>)}
            {selectedUser && modalView === 'history' && (<Modal title={`Storico di ${selectedUser.firstName}`} onClose={closeModal} size="3xl"><HistoryModal user={selectedUser} onClose={closeModal} onUpdate={handleUpdateCustomer} /></Modal>)}
            {selectedUser && modalView === 'delete' && (<Modal title="Conferma Eliminazione" onClose={closeModal}><div className="text-gray-700"><p className="mb-4">Sei sicuro di voler eliminare l'utente <span className="font-bold">{selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.username}</span>?<br/>L'username <strong>{selectedUser.username}</strong> tornerà disponibile.</p><div className="flex justify-end gap-3 mt-6"><Button onClick={closeModal} variant="secondary">Annulla</Button><Button onClick={handleDeleteCustomer} variant="danger">Conferma</Button></div></div></Modal>)}
            
            {isCreateConfirmOpen && (
                <Modal title="Conferma Creazione Cliente" onClose={() => setIsCreateConfirmOpen(false)}>
                    <div className="text-gray-700">
                        <p className="mb-4">Sei sicuro di voler creare un nuovo cliente? Verranno generate delle credenziali temporanee che potranno essere stampate.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button onClick={() => setIsCreateConfirmOpen(false)} variant="secondary" disabled={isCreating}>Annulla</Button>
                            <Button onClick={handleConfirmCreateCustomer} disabled={isCreating}>
                                {isCreating ? 'Creazione...' : 'Conferma e Crea'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {showNewCredentials && (
                <Modal title="Nuovo Cliente Creato" onClose={() => setShowNewCredentials(null)}>
                    <div className="text-gray-700">
                        <h3 className="text-xl font-bold mb-4">Credenziali Nuovo Cliente</h3>
                        <p className="mb-4">Copiare o stampare e consegnare al cliente.</p>
                        <div id="new-credentials-printable-content">
                            <div className="bg-gray-100 p-4 rounded-lg space-y-2 border border-gray-200">
                                <p><strong>Username:</strong> <span className="font-mono p-1 bg-gray-200 rounded">{showNewCredentials.username}</span></p><p><strong>Password:</strong> <span className="font-mono p-1 bg-gray-200 rounded">{showNewCredentials.password}</span></p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button onClick={handleCopyNewCredentials} variant="secondary">Copia</Button>
                            <Button onClick={() => handlePrint('new-credentials-printable-content')} variant="secondary">Stampa</Button>
                            <Button onClick={() => setShowNewCredentials(null)}>Chiudi</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </Card>
    );
};

export default CustomerManagement;