import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Prize, Action, PointTransaction } from '../../types';
import { getPrizes, getRegulations, getActions, getTransactionsForUser } from '../../services/dataService';
import Card from '../shared/Card';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import AnimatedCounter from '../shared/AnimatedCounter';

interface CustomerDashboardProps {
    user: User;
}

const CustomerHistoryModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    const [transactions, setTransactions] = useState<PointTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'awarded' | 'redeemed'>('all');

    useEffect(() => {
        const fetchHistory = async () => {
            const userTransactions = await getTransactionsForUser(user.id);
            setTransactions(userTransactions);
            setIsLoading(false);
        };
        fetchHistory();
    }, [user.id]);
    
    const allTransactions = useMemo(() => 
        transactions.filter(tx => tx.type !== 'creation'),
    [transactions]);

    const awardedTransactions = useMemo(() => 
        transactions.filter(tx => tx.pointsChange >= 0 && tx.type !== 'creation'), 
    [transactions]);

    const redeemedTransactions = useMemo(() => 
        transactions.filter(tx => tx.pointsChange < 0), 
    [transactions]);

    const renderTransactionList = (txs: PointTransaction[]) => {
        if (isLoading) {
            return <div className="text-center p-8 text-gray-500">Caricamento storico...</div>;
        }
        if (txs.length === 0) {
            return <div className="text-center text-gray-500 py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 font-semibold">Nessuna transazione</p>
                <p className="text-sm">Non ci sono movimenti in questa categoria.</p>
            </div>;
        }
        return (
            <ul className="space-y-2">
                {txs.map(tx => (
                    <li key={tx.id} className="p-4 bg-gray-50/80 rounded-xl border border-black/5">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-800 leading-tight">{tx.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(tx.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`font-bold text-lg ${tx.pointsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.pointsChange > 0 ? `+${tx.pointsChange}` : tx.pointsChange}
                                </p>
                                <p className="text-xs text-gray-500 font-mono">Saldo: {tx.balanceAfter}</p>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    const renderTabButton = (tabName: 'all' | 'awarded' | 'redeemed', label: string) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`flex-1 sm:flex-none px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-center transition-colors duration-200 ${isActive ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent'}`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="text-gray-700">
            <div className="flex justify-center border-b border-gray-200/80 mb-4">
                {renderTabButton('all', 'LISTA MOVIMENTI')}
                {renderTabButton('awarded', 'PUNTI ASSEGNATI')}
                {renderTabButton('redeemed', 'PREMI RISCATTATI')}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto hide-scrollbar p-1 -m-1">
                {activeTab === 'all' && renderTransactionList(allTransactions)}
                {activeTab === 'awarded' && renderTransactionList(awardedTransactions)}
                {activeTab === 'redeemed' && renderTransactionList(redeemedTransactions)}
            </div>
        </div>
    )
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user }) => {
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [regulations, setRegulations] = useState('');
    const [actions, setActions] = useState<Action[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'home' | 'premiums' | 'regulations'>('home');


    useEffect(() => {
        const loadData = async () => {
            try {
                const [prizesData, regulationsData, actionsData] = await Promise.all([
                    getPrizes(),
                    getRegulations(),
                    getActions(),
                ]);
                setPrizes(prizesData);
                setRegulations(regulationsData);
                setActions(actionsData.filter(action => action.isEnabled));
            } catch (err) {
                console.error("Failed to load customer dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const nextPrize = useMemo(() => {
        return prizes
            .filter(p => p.pointsRequired > user.points)
            .sort((a,b) => a.pointsRequired - b.pointsRequired)[0];
    }, [prizes, user.points]);

    if (isLoading) {
        return <div className="text-center p-12 text-gray-500">Caricamento dashboard...</div>;
    }

    const renderTabButton = (tabName: 'home' | 'premiums' | 'regulations', label: string) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`${
                    isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                } whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm transition-colors`}
                aria-current={isActive ? 'page' : undefined}
            >
                {label}
            </button>
        );
    };

    const balanceCard = (
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-500/25 text-center">
            <p className="text-indigo-200 text-lg">Il tuo saldo punti</p>
            <div className="text-6xl font-bold my-2 tracking-tight">
                <AnimatedCounter endValue={user.points} />
            </div>
            <Button variant="secondary" size="sm" className="mt-4 !bg-white/10 !text-white hover:!bg-white/20 !border-white/20" onClick={() => setIsHistoryOpen(true)}>Vedi Storico</Button>
        </div>
    );
    
    const nextPrizeCard = nextPrize && (
        <Card>
            <h2 className="text-lg font-bold mb-3 text-gray-800">Prossimo Obiettivo</h2>
             <div className="flex items-center gap-4">
                <div>
                    <p className="text-gray-600">Ti mancano solo <span className="font-extrabold text-2xl text-indigo-600">{nextPrize.pointsRequired - user.points}</span> punti per riscattare:</p>
                    <p className="font-bold text-lg mt-1 text-gray-900">{nextPrize.name}</p>
                </div>
             </div>
        </Card>
    );

    const prizesSection = (
        <Card>
             <h2 className="text-2xl font-bold mb-2">Premi Disponibili</h2>
             <p className="text-sm text-gray-500 mb-6">Tutti i premi sono riscattabili esclusivamente in salone.</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {prizes.map(prize => {
                    const canRedeem = user.points >= prize.pointsRequired;
                    const progress = canRedeem ? 100 : (user.points / prize.pointsRequired) * 100;
                    return (
                        <div key={prize.id} className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative hover:shadow-lg hover:-translate-y-1 ${canRedeem ? 'bg-white border-indigo-200/80 shadow-indigo-500/10' : 'bg-gray-100/60 border-gray-200/60'}`}>
                            {canRedeem && <span className="text-xs font-semibold text-white bg-green-500 px-2 py-0.5 rounded-full absolute -top-2 -right-2 transform rotate-3">Riscattabile</span>}
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-gray-800">{prize.name}</h3>
                                </div>
                                <p className="text-gray-500 mt-2 text-sm">{prize.description}</p>
                            </div>
                            <div className="mt-4">
                                <div className={`text-xl font-bold ${canRedeem ? 'text-indigo-600' : 'text-gray-500'}`}>
                                    {prize.pointsRequired} Punti
                                </div>
                                {!canRedeem && (
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );

    const regulationsSection = (
        <Card>
            <h2 className="text-2xl font-bold mb-4">Regolamento</h2>
            <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{regulations}</p>
            <div className="mt-6 pt-6 border-t border-gray-200/80">
                <h3 className="text-lg font-bold mb-3 text-gray-800">Come accumulare punti</h3>
                <ul className="space-y-1 -mx-3">
                    {actions.map(action => (
                        <li key={action.id} className="p-3 rounded-xl hover:bg-gray-100/70 transition-colors">
                            <div className="flex justify-between items-start text-sm">
                                <div>
                                    <p className="font-medium text-gray-700">{action.name}</p>
                                    {action.description && (
                                        <p className="text-gray-500 text-xs mt-1">{action.description}</p>
                                    )}
                                </div>
                                <span className="font-bold text-indigo-600 shrink-0 ml-4">+{action.points} punti</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold mb-1 text-gray-800 tracking-tight">Ciao, {user.firstName}!</h1>
            <p className="text-gray-600 mb-8">Benvenuto nel tuo pannello fedeltà.</p>
            
             {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {prizesSection}
                </div>

                <div className="space-y-8">
                    {balanceCard}
                    {nextPrizeCard}
                    {regulationsSection}
                </div>
            </div>

            {/* Mobile/Tablet Layout */}
            <div className="lg:hidden">
                <div className="border-b border-gray-200/80">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto hide-scrollbar" aria-label="Tabs">
                        {renderTabButton('home', 'Home')}
                        {renderTabButton('premiums', 'Premi')}
                        {renderTabButton('regulations', 'Regolamento')}
                    </nav>
                </div>

                <div key={activeTab} className="mt-6 animate-tab-content-enter">
                    {activeTab === 'home' && (
                        <div className="space-y-6">
                            {balanceCard}
                            {nextPrizeCard}
                        </div>
                    )}
                    {activeTab === 'premiums' && prizesSection}
                    {activeTab === 'regulations' && regulationsSection}
                </div>
            </div>
            
            {isHistoryOpen && (
                <Modal title="Il Tuo Storico Punti" onClose={() => setIsHistoryOpen(false)} size="2xl">
                    <CustomerHistoryModal user={user} onClose={() => setIsHistoryOpen(false)} />
                </Modal>
            )}
        </div>
    );
};

export default CustomerDashboard;