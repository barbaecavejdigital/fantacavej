import React, { useState, useEffect } from 'react';
import { getUsers, getRecentTransactions, getAllTransactions } from '../../services/dataService';
import { PointTransaction, User } from '../../types';
import Card from '../shared/Card';
import Modal from '../shared/Modal';

interface AdminOverviewProps {
    refreshKey: number;
    show?: 'stats-desktop' | 'stats-mobile' | 'recent';
    isStickyFooter?: boolean;
}

const StatCardDesktopRect: React.FC<{ icon: React.ReactNode, label: string, value: number | string, isLoading: boolean }> = ({ icon, label, value, isLoading }) => (
    <Card>
        <div className="flex items-center gap-4 p-2">
            <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-500">{icon}</div>
            <div>
                <p className="text-base font-medium text-gray-500">{label}</p>
                {isLoading ? (
                    <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                ) : (
                    <p className="text-4xl font-bold text-gray-800">{value}</p>
                )}
            </div>
        </div>
    </Card>
);


const StatCardDesktop: React.FC<{ icon: React.ReactNode, label: string, value: number | string, isLoading: boolean, iconBg?: boolean }> = ({ icon, label, value, isLoading, iconBg = true }) => (
    <Card className="aspect-square">
        <div className="flex flex-col items-center justify-center h-full text-center">
            {iconBg ? (
                <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-500 mb-3">{icon}</div>
            ) : (
                <div className="mb-3">{icon}</div>
            )}
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                {isLoading ? (
                    <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse mt-1 mx-auto"></div>
                ) : (
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                )}
            </div>
        </div>
    </Card>
);

const StatCardMobile: React.FC<{ icon: React.ReactNode, value: number | string, label: string, isLoading: boolean, iconBg?: boolean }> = ({ icon, value, label, isLoading, iconBg = true }) => (
    <div className="bg-white p-3 rounded-2xl shadow-lg shadow-gray-200/50 border border-black/5 flex flex-col items-center justify-center text-center">
        {iconBg ? (
            <div className="p-2 bg-indigo-100 text-indigo-500 rounded-lg mb-2">
                {icon}
            </div>
        ) : (
            <div className="mb-2">{icon}</div>
        )}
        {isLoading ? (
            <div className="h-6 w-12 bg-gray-200 rounded-md animate-pulse"></div>
        ) : (
             <p className="text-xl font-bold text-gray-800">{value}</p>
        )}
        <p className="text-[10px] font-semibold text-gray-500 leading-tight mt-0.5">{label}</p>
    </div>
);

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


const AdminOverview: React.FC<AdminOverviewProps> = ({ refreshKey, show = 'stats-desktop', isStickyFooter = false }) => {
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [totalRedeemed, setTotalRedeemed] = useState(0);
    const [totalPointsEarned, setTotalPointsEarned] = useState(0);
    const [totalActionsCompleted, setTotalActionsCompleted] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState<(PointTransaction & { userName: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const formatMobileDescription = (tx: PointTransaction) => {
        if(tx.type === 'assignment') return `Punti per ${tx.description.split('(')[0]}`;
        if(tx.type === 'redemption') return `Riscatto: ${tx.description.replace('Riscatto: ', '').split('(')[0]}`;
        return tx.description;
    }

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [allUsers, allTransactions, recentTxData] = await Promise.all([
                    getUsers(),
                    getAllTransactions(),
                    getRecentTransactions(50)
                ]);
                
                const customers = allUsers.filter((u: User) => u.role === 'customer');
                setTotalCustomers(customers.length);
                setRecentTransactions(recentTxData);

                const customerTransactions = allTransactions.filter(tx => 
                    customers.some(c => c.id === tx.userId)
                );

                const redeemedCount = customerTransactions.filter(tx => tx.type === 'redemption').length;
                const pointsEarnedSum = customerTransactions.filter(tx => tx.pointsChange > 0).reduce((sum, tx) => sum + tx.pointsChange, 0);
                const actionsCount = customerTransactions.filter(tx => tx.type === 'assignment').length;

                setTotalRedeemed(redeemedCount);
                setTotalPointsEarned(pointsEarnedSum);
                setTotalActionsCompleted(actionsCount);

            } catch (error) {
                console.error("Failed to fetch overview data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [refreshKey]);
    
    useEffect(() => {
        let timer: number;
        if (show === 'recent' && isStickyFooter && recentTransactions.length > 1) {
            timer = window.setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % recentTransactions.length);
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [currentIndex, recentTransactions, show, isStickyFooter]);

    const usersIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962A3.75 3.75 0 1 0 9.75 6.25a3.75 3.75 0 0 0-3.75 3.75M10.5 1.5a9 9 0 0 0-9 9v3.75a9 9 0 0 0 9 9h3.75a9 9 0 0 0 9-9V7.5a9 9 0 0 0-9-9h-3.75Z" /></svg> );
    const redeemedIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg> );
    const pointsEarnedIcon = ( <img src="https://i.imgur.com/dlViohg.png" alt="Punti Totali Assegnati" className="w-16 h-16 object-contain" /> );
    const actionsCompletedIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> );

    const mobileUsersIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-4.663M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" /></svg> );
    const mobileRedeemedIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg> );
    const mobilePointsEarnedIcon = ( <img src="https://i.imgur.com/dlViohg.png" alt="Punti Totali Assegnati" className="w-12 h-12 object-contain" /> );
    const mobileActionsCompletedIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> );

    if (show === 'stats-mobile') {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCardMobile icon={mobileUsersIcon} value={totalCustomers} label="Clienti" isLoading={isLoading} />
                <StatCardMobile icon={mobileRedeemedIcon} value={totalRedeemed} label="Premi" isLoading={isLoading} />
                <StatCardMobile icon={mobilePointsEarnedIcon} value={totalPointsEarned} label="Punti" isLoading={isLoading} iconBg={false} />
                <StatCardMobile icon={mobileActionsCompletedIcon} value={totalActionsCompleted} label="Azioni" isLoading={isLoading} />
            </div>
        );
    }
    
    if (show === 'stats-desktop') {
        return (
             <div className="flex flex-col gap-4 h-full">
                <StatCardDesktopRect icon={usersIcon} label="Clienti Totali" value={totalCustomers} isLoading={isLoading} />
                <div className="grid grid-cols-3 gap-4">
                    <StatCardDesktop icon={redeemedIcon} label="Premi Riscattati" value={totalRedeemed} isLoading={isLoading} />
                    <StatCardDesktop icon={pointsEarnedIcon} label="Punti Totali Assegnati" value={totalPointsEarned} isLoading={isLoading} iconBg={false} />
                    <StatCardDesktop icon={actionsCompletedIcon} label="Azioni Completate" value={totalActionsCompleted} isLoading={isLoading} />
                </div>
                <Card className="flex-grow flex flex-col min-h-0">
                    <h3 className="text-lg font-bold mb-4 text-gray-700 shrink-0">Attività Recente</h3>
                    {recentTransactions.length > 0 ? (
                        <div className="overflow-y-auto pr-2 -mr-4 flex-grow">
                            <ul className="space-y-2">
                                {recentTransactions.map(tx => {
                                    const { name, description } = parseTransactionDescription(tx);
                                    return (
                                        <li key={tx.id} className="flex items-center justify-between p-2.5 bg-white border border-black/5 rounded-xl text-sm transition-all hover:bg-gray-50 hover:border-gray-300">
                                            <div>
                                                <p className="font-semibold text-gray-700">{tx.userName}</p>
                                                <p className="text-xs text-gray-600 font-medium">{name}</p>
                                                {description !== '-' && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <p className={`font-bold ${tx.pointsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {tx.pointsChange > 0 ? `+${tx.pointsChange}` : tx.pointsChange}
                                                </p>
                                                <p className="text-xs text-gray-400 font-mono">
                                                    {new Date(tx.date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-sm text-gray-500 py-4"><p>Nessuna attività recente.</p></div>
                    )}
                </Card>
            </div>
        );
    }

    if (show === 'recent' && isStickyFooter) {
        if (isLoading) return null;
        const currentTx = recentTransactions.length > 0 ? recentTransactions[currentIndex] : null;
        return (
            <>
                <div className="bg-gray-800/80 backdrop-blur-xl text-gray-200 p-3 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] border-t border-white/10">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex-grow min-w-0">
                            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Attività Recente</p>
                            {currentTx ? (
                                <div key={currentIndex} className="flex items-center justify-between mt-1 animate-fade-in-slide-up">
                                    <div className="truncate">
                                        <p className="font-semibold text-white truncate">{currentTx.userName}</p>
                                        <p className="text-xs text-gray-300 truncate">{formatMobileDescription(currentTx)}</p>
                                    </div>
                                    <div className={`font-bold text-lg shrink-0 ml-4 ${currentTx.pointsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {currentTx.pointsChange > 0 ? `+${currentTx.pointsChange}` : currentTx.pointsChange}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 mt-1">Nessuna transazione recente.</p>
                            )}
                        </div>
                        {recentTransactions.length > 0 && (
                             <button 
                                onClick={() => setIsFullScreen(true)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                                title="Visualizza tutto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                {isFullScreen && (
                    <Modal title="Attività Recente Completa" onClose={() => setIsFullScreen(false)} size="2xl">
                        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 hide-scrollbar">
                            {recentTransactions.map(tx => {
                                 const { name, description } = parseTransactionDescription(tx);
                                return (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-xl text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800">{tx.userName}</p>
                                        <p className="text-xs text-gray-600 font-medium">{name}</p>
                                        {description !== '-' && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
                                        <p className="text-xs text-gray-400 mt-1">{new Date(tx.date).toLocaleString('it-IT')}</p>
                                    </div>
                                    <div className={`font-bold shrink-0 ml-2 text-base ${tx.pointsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>{tx.pointsChange > 0 ? `+${tx.pointsChange}` : tx.pointsChange}</div>
                                </div>
                            )})}
                        </div>
                    </Modal>
                )}
            </>
        );
    }

    return null;
};

export default AdminOverview;