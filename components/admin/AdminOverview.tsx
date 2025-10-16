import React, { useState, useEffect } from 'react';
import { getUsers, getRecentTransactions } from '../../services/dataService';
import { PointTransaction, User } from '../../types';
import Card from '../shared/Card';

const AdminOverview: React.FC<{refreshKey: number}> = ({ refreshKey }) => {
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState<(PointTransaction & { userName: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allUsers = await getUsers();
                const customers = allUsers.filter((u: User) => u.role === 'customer');
                setTotalCustomers(customers.length);
                setRecentTransactions(await getRecentTransactions(5));
            } catch (error) {
                console.error("Failed to fetch overview data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [refreshKey]);

    const usersIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962A3.75 3.75 0 1 0 9.75 6.25a3.75 3.75 0 0 0-3.75 3.75M10.5 1.5a9 9 0 0 0-9 9v3.75a9 9 0 0 0 9 9h3.75a9 9 0 0 0 9-9V7.5a9 9 0 0 0-9-9h-3.75Z" /></svg> );

    const formatDescription = (tx: PointTransaction) => {
        if(tx.type === 'assignment') return `Punti per ${tx.description.split('(')[0]}`;
        if(tx.type === 'redemption') return `Riscatto: ${tx.description.replace('Riscatto: ', '').split('(')[0]}`;
        return tx.description;
    }
    
    if(isLoading) {
        return <Card><p className="text-center text-sm text-slate-500 dark:text-slate-400">Caricamento...</p></Card>
    }

    return (
        <div className="flex flex-col gap-4">
             <Card>
                <div className="flex items-center">
                    <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 mr-4">{usersIcon}</div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Clienti Totali</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalCustomers}</p>
                    </div>
                </div>
            </Card>
            <Card className="flex-grow flex flex-col">
                <h3 className="text-lg font-bold mb-2 text-slate-700 dark:text-slate-200 shrink-0">Attività Recente</h3>
                {recentTransactions.length > 0 ? (
                    <div className="overflow-y-auto max-h-48 pr-2 -mr-4 flex-grow">
                        <ul className="space-y-3">
                            {recentTransactions.map(tx => (
                                <li key={tx.id} className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-sm">
                                    <div>
                                        <p className="font-semibold text-slate-700 dark:text-slate-300">{tx.userName}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDescription(tx)}</p>
                                    </div>
                                    <div className={`font-bold shrink-0 ml-2 ${tx.pointsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>{tx.pointsChange > 0 ? `+${tx.pointsChange}` : tx.pointsChange}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-sm text-slate-500 py-4"><p>Nessuna attività recente.</p></div>
                )}
            </Card>
        </div>
    );
};

export default AdminOverview;