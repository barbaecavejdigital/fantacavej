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

const CustomerHistoryModal: React.FC<{user: User, onClose: () => void}> = ({user, onClose}) => {
    const [transactions, setTransactions] = useState<PointTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const userTransactions = await getTransactionsForUser(user.id);
            setTransactions(userTransactions);
            setIsLoading(false);
        };
        fetchHistory();
    }, [user.id]);

    return (
        <div className="dark:text-slate-300">
            <div className="max-h-96 overflow-y-auto border dark:border-slate-700 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                        <tr>
                            <th className="p-2.5 font-semibold">Data</th>
                            <th className="p-2.5 font-semibold">Descrizione</th>
                            <th className="p-2.5 font-semibold text-center">Variazione</th>
                            <th className="p-2.5 font-semibold text-right">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center p-8">Caricamento...</td></tr>
                        ) : transactions.map(tx => (
                            <tr key={tx.id} className="border-b dark:border-slate-700 last:border-b-0">
                                <td className="p-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(tx.date).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="p-2.5 font-medium">{tx.description}</td>
                                <td className={`p-2.5 text-center font-bold ${tx.pointsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.pointsChange > 0 ? `+${tx.pointsChange}` : tx.pointsChange}
                                </td>
                                <td className="p-2.5 text-right font-mono">{tx.balanceAfter}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {transactions.length === 0 && !isLoading && (
                    <p className="text-center text-slate-500 py-8">Nessuna transazione trovata.</p>
                )}
            </div>
            <div className="flex justify-end gap-3 mt-8">
                <Button onClick={onClose} variant="secondary">Chiudi</Button>
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
                setActions(actionsData);
            } catch (error) {
                console.error("Failed to load customer dashboard data:", error);
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
        return <div className="text-center p-12 text-slate-500 dark:text-slate-400">Caricamento dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-4xl font-bold mb-2 text-slate-800 dark:text-white">Ciao, {user.firstName}!</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">Benvenuto nel tuo pannello fedeltà.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                         <h2 className="text-2xl font-bold mb-2 dark:text-white">Premi Disponibili</h2>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 italic">Tutti i premi sono riscattabili esclusivamente in salone.</p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {prizes.map(prize => {
                                const canRedeem = user.points >= prize.pointsRequired;
                                const progress = canRedeem ? 100 : (user.points / prize.pointsRequired) * 100;
                                return (
                                    <div key={prize.id} className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${canRedeem ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'}`}>
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{prize.name}</h3>
                                                {!canRedeem && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400 dark:text-slate-500">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{prize.description}</p>
                                        </div>
                                        <div className="mt-4">
                                            <div className={`text-xl font-bold ${canRedeem ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {prize.pointsRequired} Punti
                                            </div>
                                            {!canRedeem && (
                                                <div className="mt-2">
                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">{user.points} / {prize.pointsRequired}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                <div className="space-y-8">
                     <div className="bg-purple-600 text-white p-8 rounded-2xl shadow-lg text-center">
                        <p className="text-purple-200 text-lg">Il tuo saldo punti</p>
                        <div className="text-6xl font-bold mt-2">
                            <AnimatedCounter endValue={user.points} />
                        </div>
                        <Button variant="secondary" size="sm" className="mt-6 !bg-white/20 !text-white hover:!bg-white/30" onClick={() => setIsHistoryOpen(true)}>Vedi Storico</Button>
                    </div>
                    {nextPrize && (
                        <Card className="bg-purple-50 dark:bg-slate-800 border-purple-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold mb-3 text-purple-800 dark:text-purple-300">Prossimo Obiettivo</h2>
                             <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-purple-700 dark:text-purple-300/80">Ti mancano solo <span className="font-extrabold text-2xl text-purple-800 dark:text-purple-200">{nextPrize.pointsRequired - user.points}</span> punti per riscattare:</p>
                                    <p className="font-bold text-lg mt-1 text-purple-900 dark:text-white">{nextPrize.name}</p>
                                </div>
                             </div>
                        </Card>
                    )}
                    <Card>
                        <h2 className="text-2xl font-bold mb-4 dark:text-white">Regolamento</h2>
                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{regulations}</p>
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-white">Come accumulare punti</h3>
                            <ul className="space-y-3">
                                {actions.map(action => (
                                    <li key={action.id} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex justify-between items-start text-sm">
                                            <div>
                                                <p className="font-medium text-slate-700 dark:text-slate-200">{action.name}</p>
                                                {action.description && (
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{action.description}</p>
                                                )}
                                            </div>
                                            <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0 ml-4">+{action.points} punti</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>
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