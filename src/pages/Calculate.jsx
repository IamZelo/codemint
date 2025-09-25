import React, { useState, useMemo } from 'react';
import {  Users, Percent, Calculator, IndianRupee, Hash, PlusCircle, XCircle, MinusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Calculate = () => {
    // Shared State
    const [bill, setBill] = useState('');
    const [billInput, setBillInput] = useState('');
    const [tipOption, setTipOption] = useState('15');
    const [customTipInput, setCustomTipInput] = useState('');

    // Main Tab State
    const [activeTab, setActiveTab] = useState('splitter');

    // Bill Splitter State
    const [splitMethod, setSplitMethod] = useState('evenly');
    const [people, setPeople] = useState([
        { id: Date.now(), value: 1, isLocked: false },
        { id: Date.now() + 1, value: 1, isLocked: false }
    ]);

    const billAmount = parseFloat(bill) || 0;
    const tipPercentage = parseFloat(tipOption) || 0;
    const tipAmount = useMemo(() => (billAmount * tipPercentage) / 100, [billAmount, tipPercentage]);
    const totalAmount = useMemo(() => {
        if (activeTab === 'splitter') {
            return billAmount;
        }
        return billAmount + tipAmount;
    }, [billAmount, tipAmount, activeTab]);

    // Handlers for people list in splitter
    const addPerson = () => {
        const defaultValue = splitMethod === 'evenly' || splitMethod === 'shares' ? 1 : 0;
        setPeople([...people, { id: Date.now(), value: defaultValue, isLocked: false }]);
    };

    const removePerson = (id) => {
        if (people.length > 2) {
            setPeople(people.filter(p => p.id !== id));
        }
    };

    const updatePersonValue = (id, newValue) => {
        // 1. Make any input positive
        let value = Math.abs(parseFloat(newValue) || 0);

        if (splitMethod === 'percentage' || splitMethod === 'amount') {
            // Calculate how much has been allocated by OTHER locked people
            const totalOfOtherLockedPeople = people
                .filter(p => p.isLocked && p.id !== id)
                .reduce((sum, p) => sum + p.value, 0);

            // 2. Cap the current input to not exceed the total
            if (splitMethod === 'percentage') {
                const maxAllowed = 100 - totalOfOtherLockedPeople;
                value = Math.min(value, maxAllowed);
            } else { // amount
                const maxAllowed = totalAmount - totalOfOtherLockedPeople;
                value = Math.min(value, maxAllowed);
            }
        }

        // Mark the current person as locked and update their value
        let newPeople = people.map(p =>
            p.id === id ? { ...p, value: value, isLocked: true } : p
        );

        if (splitMethod === 'percentage' || splitMethod === 'amount') {
            const lockedPeople = newPeople.filter(p => p.isLocked);
            const unlockedPeople = newPeople.filter(p => !p.isLocked);

            // If all inputs are locked, no need to auto-adjust
            if (unlockedPeople.length === 0) {
                setPeople(newPeople);
                return;
            }

            const totalLockedValue = lockedPeople.reduce((sum, p) => sum + p.value, 0);

            let remainingValue = 0;
            if (splitMethod === 'percentage') {
                remainingValue = 100 - totalLockedValue;
            } else { // amount
                remainingValue = totalAmount - totalLockedValue;
            }

            // Distribute the remaining value among the unlocked people
            const distributedValue = unlockedPeople.length > 0 ? remainingValue / unlockedPeople.length : 0;

            newPeople = newPeople.map(p =>
                !p.isLocked ? { ...p, value: Math.max(0, distributedValue) } : p // Suggest non-negative values
            );
        }

        setPeople(newPeople);
    };

    // Reset people state on split method change
    const handleSplitMethodChange = (method) => {
        setSplitMethod(method);
        const defaultValue = method === 'evenly' || method === 'shares' ? 1 : 0;
        setPeople([
            { id: Date.now(), value: defaultValue, isLocked: false },
            { id: Date.now() + 1, value: defaultValue, isLocked: false }
        ]);
    };

    // Calculations for Bill Splitter
    const splitResults = useMemo(() => {
        if (totalAmount === 0) return { breakdown: [], summary: null };

        let breakdown = [];
        let summary = null;

        switch (splitMethod) {
            case 'evenly': {
                const amountPerPerson = totalAmount / people.length;
                breakdown = people.map(p => ({ ...p, amount: amountPerPerson, displayValue: `${people.length} People` }));
                summary = { label: "Each Person Pays", value: amountPerPerson.toFixed(2) };
                break;
            }
            case 'percentage': {
                const totalPercentage = people.reduce((sum, p) => sum + p.value, 0);
                breakdown = people.map(p => ({
                    ...p,
                    amount: totalAmount * (p.value / 100),
                    displayValue: `${p.value}%`
                }));
                summary = { label: "Total Percentage", value: `${totalPercentage.toFixed(0)}%`, warning: totalPercentage !== 100 };
                break;
            }
            case 'amount': {
                const totalEntered = people.reduce((sum, p) => sum + p.value, 0);
                const remaining = totalAmount - totalEntered;
                breakdown = people.map(p => ({
                    ...p,
                    amount: p.value,
                    displayValue: `$${p.value.toFixed(2)}`
                }));
                summary = { label: "Remaining Balance", value: `$${remaining.toFixed(2)}`, warning: remaining < -0.001 || remaining > 0.001 };
                break;
            }
            case 'shares': {
                const totalShares = people.reduce((sum, p) => sum + p.value, 0);
                if (totalShares === 0) {
                    breakdown = people.map(p => ({ ...p, amount: 0, displayValue: `${p.value} Shares` }));
                    summary = { label: "Total Shares", value: "0", warning: true };
                    break;
                }
                const amountPerShare = totalAmount / totalShares;
                breakdown = people.map(p => ({
                    ...p,
                    amount: amountPerShare * p.value,
                    displayValue: `${p.value} ${p.value === 1 ? 'Share' : 'Shares'}`
                }));
                summary = { label: "Price Per Share", value: `$${amountPerShare.toFixed(2)}` };
                break;
            }
            default:
                break;
        }

        return { breakdown, summary };
    }, [totalAmount, splitMethod, people]);

    // A component for individual person input rows to manage local state
    const PersonInputRow = ({ person, index, onCommit, getLabel, onRemove, canRemove }) => {
        const [inputValue, setInputValue] = useState(person.value);

        React.useEffect(() => {
            setInputValue(person.value);
        }, [person.value]);

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                onCommit(person.id, e.target.value);
                e.target.blur();
            }
        };

        const handleBlur = (e) => {
            onCommit(person.id, e.target.value);
        };

        return (
            <div className="flex items-center space-x-3">
                <label className="w-20 text-sm text-gray-400">Person {index + 1}</label>
                <input
                    type="number"
                    min="0"
                    placeholder={getLabel()}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className="flex-grow w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white"
                />
                <button onClick={() => onRemove(person.id)} disabled={!canRemove} className="text-gray-500 hover:text-red-500 disabled:opacity-50 disabled:hover:text-gray-500 transition-colors">
                    <XCircle size={20} />
                </button>
            </div>
        );
    };

    const SplitterInputArea = () => {
        const getLabel = () => {
            switch (splitMethod) {
                case 'percentage': return 'Percent (%)';
                case 'amount': return 'Amount ($)';
                case 'shares': return 'Shares';
                default: return null;
            }
        };

        

        if (splitMethod === 'evenly') {
            return (
                <div className="flex flex-col items-center space-y-4 my-4">
                    <label className="text-lg font-medium text-gray-300">Number of People</label>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => people.length > 2 && setPeople(people.slice(0, -1))} className="p-2 rounded-full bg-gray-700 text-blue-400 hover:bg-gray-600 transition-colors">
                            {/* <Minus size={20} /> */}
                            <MinusCircle size={20}/>
                        </button>
                        <span className="text-2xl font-bold text-white w-16 text-center">{people.length}</span>
                        <button onClick={() => setPeople([...people, { id: Date.now(), value: 1 }])} className="p-2 rounded-full bg-gray-700 text-blue-400 hover:bg-gray-600 transition-colors">
                            <PlusCircle size={20} />
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div className="space-y-3 mt-4 max-h-48 overflow-y-auto pr-2">
                {people.map((person, index) => (
                    <PersonInputRow
                        key={person.id}
                        person={person}
                        index={index}
                        onCommit={updatePersonValue}
                        getLabel={getLabel}
                        onRemove={removePerson}
                        canRemove={people.length > 2}
                    />
                ))}
                <div className="pt-2">
                    <button onClick={addPerson} className="w-full flex items-center justify-center space-x-2 py-2 text-blue-300 hover:bg-gray-700 rounded-md transition-colors">
                        <PlusCircle size={18} />
                        <span>Add Person</span>
                    </button>
                </div>
            </div>
        )
    };

    const TabButton = ({ id, label, Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 px-2 text-sm font-medium rounded-t-lg transition-all duration-300 flex items-center justify-center space-x-2 border-b-2 ${activeTab === id ? 'text-blue-400 border-blue-500' : 'text-gray-400 border-transparent hover:bg-gray-800'}`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    const SplitMethodButton = ({ id, label, Icon }) => (
        <button
            onClick={() => handleSplitMethodChange(id)}
            className={`flex-1 p-3 rounded-md text-sm transition-colors flex flex-col items-center space-y-1 ${splitMethod === id ? 'bg-indigo-600 text-white shadow-inner' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    return (
        <motion.div

            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}

            
        >

            <div className="flex flex-col min-h-screen justify-center items-center bg-[#111827] overflow-x-hidden overflow-y-auto">
                <div className="w-full mx-8 md:mx-0 max-w-md bg-[#1F2937] rounded-2xl shadow-2xl overflow-hidden">

                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-center text-white mb-2">Financial Calculator</h1>
                        <p className="text-center text-sm text-gray-400 mb-6">Calculate tips and split bills with ease.</p>

                        {/* Main Tabs */}
                        <div className="flex border-b border-gray-700">
                            <TabButton id="tip" label="Tip Calculator" Icon={Calculator} />
                            <TabButton id="splitter" label="Bill Splitter" Icon={Users} />
                        </div>
                    </div>

                    <div className="p-6 bg-gray-900/50">
                        {/* Bill and Tip Inputs (Shared) */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-300">Bill Amount</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <IndianRupee className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={billInput}
                                        onChange={(e) => setBillInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.target.value;
                                                const positiveValue = Math.abs(parseFloat(val) || 0);
                                                setBill(val === '' ? '' : positiveValue);
                                                setBillInput(val === '' ? '' : positiveValue.toString());
                                                e.target.blur();
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const val = e.target.value;
                                            const positiveValue = Math.abs(parseFloat(val) || 0);
                                            setBill(val === '' ? '' : positiveValue);
                                            setBillInput(val === '' ? '' : positiveValue.toString());
                                        }}
                                        placeholder="0.00"
                                        className="block w-full rounded-md border-gray-600 bg-gray-700 pl-10 pr-4 py-2 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Conditional Content */}
                        {activeTab === 'tip' && (
                            <>
                                <div className="mt-4">
                                    <label className="text-sm font-medium text-gray-300">Select Tip %</label>
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                        {['10', '15', '20', '25'].map(val => (
                                            <button key={val} onClick={() => { setTipOption(val); setCustomTipInput(''); }} className={`px-4 py-2 text-sm rounded-md transition-colors ${tipOption === val ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}>
                                                {val}%
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Custom"
                                            value={customTipInput}
                                            onChange={e => setCustomTipInput(e.target.value)}
                                            onFocus={() => setTipOption('')}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    const val = e.target.value;
                                                    const positiveValue = Math.abs(parseFloat(val) || 0);
                                                    setTipOption(positiveValue.toString());
                                                    setCustomTipInput(val === '' ? '' : positiveValue.toString());
                                                    e.target.blur();
                                                }
                                            }}
                                            onBlur={e => {
                                                const val = e.target.value;
                                                const positiveValue = Math.abs(parseFloat(val) || 0);
                                                setTipOption(positiveValue.toString());
                                                setCustomTipInput(val === '' ? '' : positiveValue.toString());
                                            }}
                                            className="col-span-1 px-3 py-2 text-center bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-lg font-semibold text-white mb-3">Tip Calculation</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Tip Amount</span>
                                            <span className="font-medium text-white">${tipAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-base border-t pt-2 mt-2 border-gray-600">
                                            <span className="text-blue-300">Total Bill</span>
                                            <span className="text-blue-300">${totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'splitter' && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">Split Method</h3>
                                </div>
                                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <SplitMethodButton id="evenly" label="Evenly" Icon={Users} />
                                    <SplitMethodButton id="percentage" label="By %" Icon={Percent} />
                                    <SplitMethodButton id="amount" label="By $" Icon={IndianRupee} />
                                    <SplitMethodButton id="shares" label="By Shares" Icon={Hash} />
                                </div>

                                <SplitterInputArea />

                                {totalAmount > 0 && (
                                    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                                        <h4 className="font-semibold text-white mb-3">Results</h4>
                                        <div className="space-y-2 text-sm max-h-32 overflow-y-auto pr-2">
                                            {splitResults.breakdown.map((res, i) => (
                                                <div key={res.id} className="flex justify-between items-center">
                                                    <span className="text-gray-300">
                                                        Person {i + 1} <span className="text-xs text-gray-500">({res.displayValue})</span>
                                                    </span>
                                                    <span className="font-medium text-white">${res.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {splitResults.summary && (
                                            <div className={`flex justify-between font-bold text-base border-t pt-2 mt-2 ${splitResults.summary.warning ? 'text-red-400' : 'text-blue-300'} border-gray-600`}>
                                                <span>{splitResults.summary.label}</span>
                                                <span>{splitResults.summary.value}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 bg-black/20">
                        <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-inner">
                            <span className="text-lg font-semibold text-gray-300">Total Amount</span>
                            <span className="text-3xl font-bold text-teal-400">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default Calculate




