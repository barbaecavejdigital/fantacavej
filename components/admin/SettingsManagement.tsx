import React, { useState, useEffect, useCallback } from 'react';
import { Action, Prize } from '../../types';
import {
    getActions,
    createOrUpdateAction,
    deleteAction,
    getPrizes,
    createOrUpdatePrize,
    deletePrize,
    getRegulations,
    saveRegulations,
} from '../../services/dataService';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

interface SettingsManagementProps {
    onDataChange: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
    view?: 'actions' | 'prizes' | 'regulations' | 'all';
}

const ToggleSwitch: React.FC<{ isEnabled: boolean; onToggle: () => void }> = ({ isEnabled, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        className={`${
            isEnabled ? 'bg-indigo-600' : 'bg-gray-300'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={isEnabled}
    >
        <span
            aria-hidden="true"
            className={`${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

const ActionFormModal: React.FC<{
    action: Action | null;
    onClose: () => void;
    onSave: (action: Partial<Action>) => void;
}> = ({ action, onClose, onSave }) => {
    const [name, setName] = useState(action?.name || '');
    const [points, setPoints] = useState(action?.points?.toString() || '');
    const [description, setDescription] = useState(action?.description || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: action?.id, name, points: Number(points) || 0, description });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="actionName" className="block text-sm font-medium text-gray-700 mb-2">Nome Azione</label>
                <input id="actionName" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" />
            </div>
            <div>
                <label htmlFor="actionPoints" className="block text-sm font-medium text-gray-700 mb-2">Punti Assegnati</label>
                <input id="actionPoints" type="text" inputMode="numeric" value={points} onChange={e => setPoints(e.target.value.replace(/\D/g, ''))} required className="form-input" />
            </div>
            <div>
                <label htmlFor="actionDescription" className="block text-sm font-medium text-gray-700 mb-2">Descrizione (opzionale)</label>
                <input id="actionDescription" type="text" value={description} onChange={e => setDescription(e.target.value)} className="form-input" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
                <Button type="submit">Salva</Button>
            </div>
        </form>
    );
};

const PrizeFormModal: React.FC<{
    prize: Prize | null;
    onClose: () => void;
    onSave: (prize: Omit<Prize, 'id'> & { id?: string }) => void;
}> = ({ prize, onClose, onSave }) => {
    const [name, setName] = useState(prize?.name || '');
    const [pointsRequired, setPointsRequired] = useState(prize?.pointsRequired?.toString() || '');
    const [description, setDescription] = useState(prize?.description || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: prize?.id, name, pointsRequired: Number(pointsRequired) || 0, description });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="prizeName" className="block text-sm font-medium text-gray-700 mb-2">Nome Premio</label>
                <input id="prizeName" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" />
            </div>
            <div>
                <label htmlFor="prizePoints" className="block text-sm font-medium text-gray-700 mb-2">Punti Richiesti</label>
                <input id="prizePoints" type="text" inputMode="numeric" value={pointsRequired} onChange={e => setPointsRequired(e.target.value.replace(/\D/g, ''))} required className="form-input" />
            </div>
            <div>
                <label htmlFor="prizeDescription" className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                <input id="prizeDescription" type="text" value={description} onChange={e => setDescription(e.target.value)} required className="form-input" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
                <Button type="submit">Salva</Button>
            </div>
        </form>
    );
};

const SettingsManagement: React.FC<SettingsManagementProps> = ({ onDataChange, showToast, view = 'all' }) => {
    const [actions, setActions] = useState<Action[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [regulations, setRegulations] = useState('');
    const [originalRegulations, setOriginalRegulations] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const [modalView, setModalView] = useState<'editAction' | 'newAction' | 'editPrize' | 'newPrize' | null>(null);
    const [selectedItem, setSelectedItem] = useState<Action | Prize | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'action' | 'prize', id: string, name: string } | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [actionsData, prizesData, regulationsData] = await Promise.all([
                getActions(), getPrizes(), getRegulations()
            ]);
            setActions(actionsData);
            setPrizes(prizesData);
            setRegulations(regulationsData);
            setOriginalRegulations(regulationsData);
        } catch (error) {
            console.error("Failed to load settings data:", error);
            showToast("Errore nel caricamento delle impostazioni.", 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveAction = async (actionData: Partial<Action>) => {
        try {
            await createOrUpdateAction(actionData);
            showToast('Azione salvata con successo.');
            onDataChange();
            fetchData();
        } catch (error) {
            showToast('Errore nel salvataggio dell\'azione.', 'error');
        }
    };

    const handleToggleAction = async (action: Action) => {
        const updatedAction = { ...action, isEnabled: !action.isEnabled };
        try {
            await createOrUpdateAction(updatedAction);
            showToast(`Azione "${action.name}" ${updatedAction.isEnabled ? 'abilitata' : 'disabilitata'}.`);
            setActions(prevActions => 
                prevActions.map(a => a.id === action.id ? updatedAction : a)
            );
            onDataChange();
        } catch (error) {
            showToast('Errore durante l\'aggiornamento dell\'azione.', 'error');
            console.error("Failed to toggle action:", error);
        }
    };

    const handleSavePrize = async (prizeData: Omit<Prize, 'id'> & { id?: string }) => {
        try {
            await createOrUpdatePrize(prizeData);
            showToast('Premio salvato con successo.');
            onDataChange();
            fetchData();
        } catch (error) {
            showToast('Errore nel salvataggio del premio.', 'error');
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (itemToDelete.type === 'action') {
                await deleteAction(itemToDelete.id);
                showToast('Azione eliminata con successo.');
            } else {
                await deletePrize(itemToDelete.id);
                showToast('Premio eliminato con successo.');
            }
            onDataChange();
            fetchData();
        } catch (error) {
            showToast('Errore durante l\'eliminazione.', 'error');
        } finally {
            setItemToDelete(null);
        }
    };

    const handleSaveRegulations = async () => {
        try {
            await saveRegulations(regulations);
            setOriginalRegulations(regulations);
            showToast('Regolamento salvato con successo.');
        } catch (error) {
            showToast('Errore nel salvataggio del regolamento.', 'error');
        }
    };

    const openModal = (view: 'editAction' | 'newAction' | 'editPrize' | 'newPrize', item: Action | Prize | null = null) => {
        setSelectedItem(item);
        setModalView(view);
    };
    const closeModal = () => {
        setModalView(null);
        setSelectedItem(null);
    };

    if(isLoading) {
        return <Card className="flex items-center justify-center"><p className="text-gray-500">Caricamento impostazioni...</p></Card>
    }

    const actionsSection = (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700">Azioni che assegnano punti</h3>
                <Button size="sm" onClick={() => openModal('newAction')}>Aggiungi Azione</Button>
            </div>
            <div className="space-y-2">
                {actions.map(action => (
                    <div key={action.id} className={`p-3 bg-white border border-black/5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors duration-200 ${!action.isEnabled ? 'bg-gray-100/50' : ''}`}>
    
                        {/* Left side: Name and Description */}
                        <div className={`flex-grow ${!action.isEnabled ? 'opacity-50' : ''}`}>
                            <p className="font-semibold text-gray-800">{action.name}</p>
                            <p className="text-sm text-gray-500">{action.description || 'Nessuna descrizione'}</p>
                        </div>
                        
                        {/* Right side: Points, Toggle, Buttons */}
                        <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-gray-200/70 mt-3 sm:mt-0">
                            <div className="text-right flex-grow sm:flex-grow-0">
                                <p className={`font-bold text-lg ${!action.isEnabled ? 'text-gray-400' : 'text-indigo-600'}`}>+{action.points}</p>
                                <p className="text-xs text-gray-500 -mt-1">punti</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ToggleSwitch isEnabled={action.isEnabled} onToggle={() => handleToggleAction(action)} />
                                <Button size="sm" variant="secondary" onClick={() => openModal('editAction', action)}>Modifica</Button>
                                <Button size="sm" variant="danger" onClick={() => setItemToDelete({type: 'action', id: action.id, name: action.name})}>Elimina</Button>
                            </div>
                        </div>
                    </div>
                ))}
                    {actions.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">Nessuna azione definita.</p>
                )}
            </div>
        </section>
    );

    const prizesSection = (
         <section>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700">Premi Riscattabili</h3>
                <Button size="sm" onClick={() => openModal('newPrize')}>Aggiungi Premio</Button>
            </div>
            <div className="space-y-2">
                {prizes.map(prize => (
                    <div key={prize.id} className="p-3 bg-white border border-black/5 rounded-lg flex justify-between items-center transition-all hover:bg-gray-50 hover:border-gray-300">
                        <div className="flex-grow mr-4">
                            <p className="font-semibold text-gray-800">{prize.name}</p>
                            <p className="text-sm text-gray-500">{prize.description}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                                <p className="font-bold text-lg text-indigo-600">{prize.pointsRequired}</p>
                                <p className="text-xs text-gray-500 -mt-1">punti</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => openModal('editPrize', prize)}>Modifica</Button>
                                <Button size="sm" variant="danger" onClick={() => setItemToDelete({type: 'prize', id: prize.id, name: prize.name})}>Elimina</Button>
                            </div>
                        </div>
                    </div>
                ))}
                {prizes.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">Nessun premio definito.</p>
                )}
            </div>
        </section>
    );

    const regulationsSection = (
         <section>
            <h3 className="text-lg font-bold text-gray-700 mb-4">Regolamento Programma</h3>
            <textarea
                value={regulations}
                onChange={(e) => setRegulations(e.target.value)}
                rows={8}
                className="form-input w-full"
            />
            <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveRegulations} disabled={regulations === originalRegulations}>Salva Regolamento</Button>
            </div>
        </section>
    );
    
    const modals = (
        <>
            {(modalView === 'newAction' || modalView === 'editAction') && (
                <Modal title={modalView === 'newAction' ? 'Nuova Azione' : 'Modifica Azione'} onClose={closeModal}>
                    <ActionFormModal action={selectedItem as Action | null} onClose={closeModal} onSave={handleSaveAction} />
                </Modal>
            )}

            {(modalView === 'newPrize' || modalView === 'editPrize') && (
                <Modal title={modalView === 'newPrize' ? 'Nuovo Premio' : 'Modifica Premio'} onClose={closeModal}>
                    <PrizeFormModal prize={selectedItem as Prize | null} onClose={closeModal} onSave={handleSavePrize} />
                </Modal>
            )}

            {itemToDelete && (
                <Modal title="Conferma Eliminazione" onClose={() => setItemToDelete(null)}>
                    <div className="text-gray-700">
                        <p>Sei sicuro di voler eliminare "{itemToDelete.name}"? Questa azione non può essere annullata.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setItemToDelete(null)}>Annulla</Button>
                            <Button variant="danger" onClick={handleConfirmDelete}>Conferma Elimina</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );

    if (view === 'actions') {
        return <Card>{actionsSection}{modals}</Card>
    }
    if (view === 'prizes') {
        return <Card>{prizesSection}{modals}</Card>
    }
    if (view === 'regulations') {
        return <Card>{regulationsSection}{modals}</Card>
    }

    return (
        <Card className="flex flex-col flex-1 min-h-0">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 shrink-0">Impostazioni</h2>

            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="space-y-8">
                    {actionsSection}
                    <div className="border-b border-gray-200/80"></div>
                    {prizesSection}
                    <div className="border-b border-gray-200/80"></div>
                    {regulationsSection}
                </div>
            </div>
            
            {modals}

        </Card>
    );
};

export default SettingsManagement;