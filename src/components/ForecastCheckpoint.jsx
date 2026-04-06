import { formatDate } from '@/utils/helper';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useEffect, useMemo, useCallback } from 'react';

export default function ForecastCheckpoint({ formData, setFormData, paramStatus, readOnly = false }) {
    const items = formData.checkpoint || [];
    const currentMode = useMemo(() => {
        if (items.length === 0) return null;
        const firstItem = items[0];

        if (firstItem.mode) {
            return firstItem.mode;
        }

        if ((firstItem.termint_payment > 0) && (!firstItem.persentase || firstItem.persentase === 0)) {
            return 'nominal';
        }

        if (firstItem.persentase > 0) {
            return 'percentage';
        }

        return 'percentage';
    }, [items]);

    const projectValues = useMemo(() => ({
        nominal: parseFloat(formData.project_nominal) || 0,
        discount: parseFloat(formData.discount) || 0
    }), [formData.project_nominal, formData.discount]);

    useEffect(() => {
        if (items.length === 0) return;

        let needsUpdate = false;
        const updatedItems = items.map(item => {
            const formattedItem = { ...item };

            if (item.duedate && item.duedate.includes('T')) {
                formattedItem.duedate = item.duedate.split('T')[0].slice(0, 7);
                needsUpdate = true;
            }

            if (!formattedItem.mode) {
                if ((item.termint_payment > 0) && (!item.persentase || item.persentase === 0)) {
                    formattedItem.mode = 'nominal';
                } else if (item.persentase > 0) {
                    formattedItem.mode = 'percentage';
                } else {
                    formattedItem.mode = 'percentage';
                }
                needsUpdate = true;
            }

            return formattedItem;
        });

        if (needsUpdate) {
            setFormData(prev => ({ ...prev, checkpoint: updatedItems }));
        }
    }, []);

    const handleChange = useCallback((id, field, value) => {
        if (readOnly) return;
        setFormData(prev => ({
            ...prev,
            checkpoint: prev.checkpoint.map(item =>
                item.position === id ? { ...item, [field]: value } : item
            )
        }));
    }, [setFormData, readOnly]);

    const addItem = useCallback(() => {
        if (readOnly) return;
        const finalMode = currentMode || 'percentage';
        const newId = items.length > 0
            ? Math.max(...items.map(item => item.position || 0), 0) + 1
            : 1;

        setFormData(prev => ({
            ...prev,
            checkpoint: [
                ...prev.checkpoint,
                {
                    position: newId,
                    description: '',
                    duedate: '',
                    persentase: finalMode === 'percentage' ? 0 : 0,
                    termint_payment: finalMode === 'nominal' ? 0 : 0,
                    status_payment: '',
                    mode: finalMode
                }
            ]
        }));
    }, [currentMode, items.length, setFormData, readOnly]);

    const initializeMode = useCallback((mode) => {
        if (readOnly) return;
        setFormData(prev => ({
            ...prev,
            checkpoint: [
                {
                    position: 1,
                    description: '',
                    duedate: '',
                    persentase: 0,
                    termint_payment: 0,
                    status_payment: '',
                    mode: mode
                }
            ]
        }));
    }, [setFormData, readOnly]);

    const removeItem = useCallback((id) => {
        if (readOnly) return;
        setFormData(prev => ({
            ...prev,
            checkpoint: prev.checkpoint.filter(item => item.position !== id)
        }));
    }, [setFormData, readOnly]);

    const formatIDR = useCallback((number) => {
        const validNumber = parseFloat(number) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(validNumber);
    }, []);

    const parseIDR = useCallback((value) => {
        if (!value) return '';
        return value.toString().replace(/\./g, '').replace(/[^0-9,]/g, '').replace(',', '.');
    }, []);

    const pembulatanBIAtas = useCallback((nominal) => {
        return Math.ceil(nominal);
    }, []);

    const processedItems = useMemo(() => {
        return items.map((item, index) => {
            const itemMode = item.mode || 'percentage';
            const rawCalculatedPayment = itemMode === 'percentage'
                ? (parseFloat(item.persentase) || 0) / 100 * projectValues.nominal - (projectValues.nominal * projectValues.discount / 100 * (parseFloat(item.persentase) || 0) / 100)
                : (parseFloat(item.termint_payment) || 0);

            const calculatedPayment = itemMode === 'percentage'
                ? pembulatanBIAtas(rawCalculatedPayment)
                : rawCalculatedPayment;

            const formattedDuedate = formatDate(item.duedate, false, false, true);

            return {
                ...item,
                index,
                itemMode,
                calculatedPayment,
                formattedDuedate
            };
        });
    }, [items, projectValues, pembulatanBIAtas]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'not_yet':
                return 'bg-gray-100 text-gray-700 border-gray-300';
            case 'on_progress':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'invoice':
                return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'done':
                return 'bg-green-100 text-green-700 border-green-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                <h2 className="text-sm font-semibold text-gray-700">Termin Payment</h2>

                {!readOnly && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => items.length === 0 ? initializeMode('percentage') : addItem()}
                            disabled={items.length > 0 && currentMode !== 'percentage'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 transition-colors ${items.length > 0 && currentMode !== 'percentage'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500'
                                }`}
                        >
                            <PlusIcon className="h-3.5 w-3.5" />
                            Add (%)
                        </button>

                        <button
                            onClick={() => items.length === 0 ? initializeMode('nominal') : addItem()}
                            disabled={items.length > 0 && currentMode !== 'nominal'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 transition-colors ${items.length > 0 && currentMode !== 'nominal'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
                                }`}
                        >
                            <PlusIcon className="h-3.5 w-3.5" />
                            Add (IDR)
                        </button>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {items.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-500 mb-2">No checkpoints yet</p>
                    {!readOnly && (
                        <p className="text-xs text-gray-400">Click "Add (%)" for percentage mode or "Add (IDR)" for direct nominal</p>
                    )}
                </div>
            )}

            {/* Table Header */}
            {items.length > 0 && (
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-t-lg border border-gray-200 text-xs font-semibold text-gray-600">
                    <div className="col-span-1">#</div>
                    <div className="col-span-2">Description</div>
                    <div className="col-span-2">Persentase (%)</div>
                    <div className="col-span-2">Month/Year</div>
                    <div className="col-span-2">Payment (IDR)</div>
                    <div className="col-span-2">Status Payment</div>
                    {!readOnly && <div className="col-span-1 text-center">Action</div>}
                </div>
            )}

            {/* Table Body */}
            <div className="space-y-2 sm:space-y-0">
                {processedItems.map((item) => (
                    <div
                        key={item.position}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-white border border-gray-200 sm:border-t-0 sm:rounded-none rounded-lg items-center hover:bg-gray-50 transition-colors"
                    >
                        {/* Number */}
                        <div className="hidden sm:block col-span-1">
                            <span className="text-xs font-semibold text-gray-500">#{item.index + 1}</span>
                        </div>

                        {/* Mobile Number */}
                        <div className="sm:hidden flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500">Checkpoint #{item.index + 1}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.itemMode === 'percentage'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                    {item.itemMode === 'percentage' ? '%' : 'IDR'}
                                </span>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={() => removeItem(item.position)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    aria-label="Remove checkpoint"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Description */}
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block sm:hidden text-xs font-medium text-gray-600 mb-1">Description</label>
                            <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleChange(item.position, 'description', e.target.value)}
                                disabled={readOnly}
                                className={`w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                                placeholder="Enter description"
                            />
                        </div>

                        {/* Persentase */}
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block sm:hidden text-xs font-medium text-gray-600 mb-1">Persentase (%)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={item.itemMode === 'percentage' ? (item.persentase || '') : '0'}
                                    onChange={(e) => {
                                        if (item.itemMode === 'percentage' && !readOnly) {
                                            let value = e.target.value.replace(/[^0-9.]/g, '');
                                            const parts = value.split('.');
                                            if (parts.length > 2) return;

                                            if (value === '') {
                                                handleChange(item.position, 'persentase', '');
                                                return;
                                            }

                                            if (value.endsWith('.')) {
                                                handleChange(item.position, 'persentase', value);
                                                return;
                                            }

                                            const numValue = parseFloat(value);
                                            if (!isNaN(numValue) && numValue <= 100) {
                                                handleChange(item.position, 'persentase', value);
                                            } else if (!isNaN(numValue) && numValue > 100) {
                                                handleChange(item.position, 'persentase', '100');
                                            }
                                        }
                                    }}
                                    disabled={item.itemMode === 'nominal' || readOnly}
                                    className={`w-full px-2 py-1.5 pr-7 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${item.itemMode === 'nominal' || readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                                        }`}
                                    placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                            </div>
                        </div>

                        {/* Month/Year */}
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block sm:hidden text-xs font-medium text-gray-600 mb-1">Month/Year</label>
                            <input
                                type="month"
                                value={item.formattedDuedate}
                                onChange={(e) => handleChange(item.position, 'duedate', e.target.value)}
                                disabled={readOnly}
                                className={`w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[12px] ${readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                            />
                        </div>

                        {/* Payment Term */}
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block sm:hidden text-xs font-medium text-gray-600 mb-1">Payment (IDR)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={item.itemMode === 'percentage'
                                        ? formatIDR(item.calculatedPayment)
                                        : formatIDR(item.termint_payment || 0)
                                    }
                                    onChange={(e) => {
                                        if (item.itemMode === 'nominal' && !readOnly) {
                                            const cleanValue = parseIDR(e.target.value);
                                            handleChange(item.position, 'termint_payment', cleanValue);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (item.itemMode === 'nominal' && !readOnly) {
                                            const cleanValue = parseIDR(e.target.value);
                                            const rounded = pembulatanBIAtas(parseFloat(cleanValue) || 0);
                                            handleChange(item.position, 'termint_payment', rounded);
                                        }
                                    }}
                                    disabled={item.itemMode === 'percentage' || readOnly}
                                    className={`w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none text-sm ${item.itemMode === 'percentage' || readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                                        }`}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Status Payment */}
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block sm:hidden text-xs font-medium text-gray-600 mb-1">Status Payment</label>
                            <select
                                value={item.status_payment || ''}
                                onChange={(e) => handleChange(item.position, 'status_payment', e.target.value)}
                                disabled={readOnly}
                                className={`w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${getStatusColor(item.status_payment)} ${readOnly ? 'cursor-not-allowed opacity-75' : ''
                                    }`}
                            >
                                <option value="">Select Status</option>
                                {paramStatus && paramStatus.map((status) => (
                                    <option key={status.data} value={status.data}>
                                        {status.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Action - Desktop */}
                        {!readOnly && (
                            <div className="hidden sm:flex col-span-1 justify-center">
                                <button
                                    onClick={() => removeItem(item.position)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    aria-label="Remove checkpoint"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Table Footer */}
            {items.length > 0 && (
                <div className="hidden sm:block h-px bg-gray-200 rounded-b-lg"></div>
            )}
        </div>
    );
}