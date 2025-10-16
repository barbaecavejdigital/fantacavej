import React, { useState, useEffect } from 'react';
import { getRegulations, saveRegulations, getActions, createOrUpdateAction, deleteAction, getPrizes, createOrUpdatePrize, deletePrize } from '../../services/dataService';
import { Action, Prize } from '../../types';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

const EditItemModal: React.FC<{
    item: Action | Prize;
    onClose: () => void;
    onSave: (updatedItem: Action | Prize) => void;
    itemType: 'action' | 'prize';
}> = ({ item, onClose, onSave, itemType }) => {
    const [name, setName] = useState(item.name);
    const [points, setPoints] = useState('points' in item ? item.points.toString() : item.pointsRequired.toString());
    const [description, setDescription] = useState(item.description || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const commonFields = { id: item.id, name: name.trim(), description: description.trim() };
        const updatedItem = itemType === 'action'
            ? { ...commonFields, points: parseInt(points, 10) } as Action
            : { ...commonFields, pointsRequired: parseInt(points, 10) } as Prize;
        onSave(updatedItem);
    };
    
    const inputClasses = "mt-1 block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition";

    return (
        <Modal title={itemType === 'action' ? "Modifica Azione" : "Modifica Premio"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4 dark:text-slate-300">
                <div>
                    <label className="block text-sm font-medium">Nome</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                </div>
                 <div>
                    <label className="block text-sm font-medium">{itemType === 'action' ? 'Punti Assegnati' : 'Punti Richiesti'}</label>
                    <input type="number" value={points} onChange={e => setPoints(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                     <label className="block text-sm font-medium">Descrizione</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses} required={itemType === 'prize'} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
                    <Button type="submit">Salva Modifiche</Button>
                </div>
            </form>
        </Modal>
    );
};

const SettingsManagement: React.FC<{onDataChange: () => void; showToast: (message: string, type?: 'success' | 'error') => void}> = ({ onDataChange, showToast }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [regulations, setRegulations] = useState('');
    const [actions, setActions] = useState<Action[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    
    const [newAction, setNewAction] = useState({ name: '', points: '', description: '' });
    const [newPrize, setNewPrize] = useState({ name: '', pointsRequired: '', description: '' });

    const [editingItem, setEditingItem] = useState<Action | Prize | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{item: Action | Prize, type: 'action' | 'prize'} | null>(null);
    
    const fetchAllData = async () => {
        setIsLoading(true);
        const [regData, actionsData, prizesData] = await Promise.all([ getRegulations(), getActions(), getPrizes() ]);
        setRegulations(regData);
        setActions(actionsData);
        setPrizes(prizesData);
        setIsLoading(false);
    };

    useEffect(() => { fetchAllData(); }, []);

    const handleSaveRegulations = async () => { await saveRegulations(regulations); showToast('Regolamento salvato!'); };

    const handleAddAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newAction.name.trim() && newAction.points) {
            await createOrUpdateAction({ name: newAction.name.trim(), points: parseInt(newAction.points, 10), description: newAction.description.trim() });
            await fetchAllData();
            setNewAction({ name: '', points: '', description: '' });
            showToast('Azione aggiunta!'); onDataChange();
        }
    };
    
    const handleAddPrize = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPrize.name.trim() && newPrize.pointsRequired && newPrize.description.trim()) {
            await createOrUpdatePrize({ name: newPrize.name.trim(), pointsRequired: parseInt(newPrize.pointsRequired, 10), description: newPrize.description.trim() });
            await fetchAllData();
            setNewPrize({ name: '', pointsRequired: '', description: '' });
            showToast('Premio aggiunto!'); onDataChange();
        }
    };
    
    const confirmDeleteItem = async () => {
        if (itemToDelete) {
            if (itemToDelete.type === 'action') await deleteAction(itemToDelete.item.id);
            else await deletePrize(itemToDelete.item.id);
            await fetchAllData();
            showToast('Elemento rimosso.');
            setItemToDelete(null); onDataChange();
        }
    };

    const handleSaveItem = async (updatedItem: Action | Prize) => {
        if ('points' in updatedItem) await createOrUpdateAction(updatedItem);
        else await createOrUpdatePrize(updatedItem);
        await fetchAllData();
        setEditingItem(null);
        showToast('Elemento modificato!'); onDataChange();
    };

    const renderList = <T extends Action | Prize>(items: T[], type: 'action' | 'prize') => (
        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
            {items.map(item => (
                <div key={item.id} className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex justify-between items-start"><div className="flex-grow pr-4">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                    </div><div className="flex items-center gap-1 shrink-0">
                        <span className="font-semibold text-purple-600 dark:text-purple-400 text-sm">{'points' in item ? item.points : item.pointsRequired} pts</span>
                        <button onClick={() => setEditingItem(item)} className="text-slate-500 hover:text-purple-600 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button>
                        <button onClick={() => setItemToDelete({item, type})} className="text-slate-500 hover:text-red-600 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                    </div></div>
                </div>
            ))}
        </div>
    );

    if (isLoading) return <Card className="h-full flex items-center justify-center"><p className="text-slate-500">Caricamento...</p></Card>

    return (
        <Card className="h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 shrink-0 text-slate-800 dark:text-white">Impostazioni Programma</h2>
            <div className="flex-grow overflow-y-auto min-h-0 pr-4 -mr-8 space-y-8">
                <div>
                    <h3 className="text-lg font-bold mb-2 text-slate-700 dark:text-slate-200">Regolamento</h3>
                    <textarea value={regulations} onChange={(e) => setRegulations(e.target.value)} rows={5} className="w-full p-3 bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" />
                    <div className="mt-4 text-right"><Button onClick={handleSaveRegulations} size="sm">Salva Regolamento</Button></div>
                </div>
                <div className="grid grid-cols-1 gap-8">
                    <div>
                        <h3 className="text-lg font-bold mb-2 text-slate-700 dark:text-slate-200">Azioni per Punti</h3>
                        {renderList(actions, 'action')}
                        <form onSubmit={handleAddAction} className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                            <div className="flex gap-2"><input type="text" placeholder="Nome azione" value={newAction.name} onChange={(e) => setNewAction({...newAction, name: e.target.value})} className="flex-grow p-2 text-sm bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg" required /><input type="number" placeholder="Punti" value={newAction.points} onChange={(e) => setNewAction({...newAction, points: e.target.value})} className="w-20 p-2 text-sm bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg" required /></div>
                            <div><input type="text" placeholder="Descrizione (opzionale)" value={newAction.description} onChange={(e) => setNewAction({...newAction, description: e.target.value})} className="w-full p-2 text-sm bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg" /></div>
                            <div className="text-right"><Button type="submit" size="sm">Aggiungi Azione</Button></div>
                        </form>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-2 text-slate-700 dark:text-slate-200">Gestione Premi</h3>
                        {renderList(prizes, 'prize')}
                        <form onSubmit={handleAddPrize} className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                             <div className="flex gap-2"><input type="text" placeholder="Nome premio" value={newPrize.name} onChange={(e) => setNewPrize({...newPrize, name: e.target.value})} className="flex-grow p-2 text-sm bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg" required /><input type="number" placeholder="Punti" value={newPrize.pointsRequired} onChange={(e) => setNewPrize({...newPrize, pointsRequired: e.target.value})} className="w-20 p-2 text-sm bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg" required /></div>
                            <div><input type="text" placeholder="Descrizione" value={newPrize.description} onChange={(e) => setNewPrize({...newPrize, description: e.target.value})} className="w-full p-2 text-sm bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg" required /></div>
                            <div className="text-right"><Button type="submit" size="sm">Aggiungi Premio</Button></div>
                        </form>
                    </div>
                </div>
            </div>
            {editingItem && <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveItem} itemType={'points' in editingItem ? 'action' : 'prize'} />}
            {itemToDelete && (<Modal title={`Conferma Eliminazione`} onClose={() => setItemToDelete(null)}><div className="dark:text-slate-300"><p className="mb-4">Sei sicuro di voler eliminare <span className="font-bold">"{itemToDelete.item.name}"</span>? L'azione è irreversibile.</p><div className="flex justify-end gap-3 mt-6"><Button onClick={() => setItemToDelete(null)} variant="secondary">Annulla</Button><Button onClick={confirmDeleteItem} variant="danger">Conferma</Button></div></div></Modal>)}
        </Card>
    );
};

export default SettingsManagement;