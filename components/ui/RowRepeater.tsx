import React from 'react'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface RowRepeaterProps {
    label: string
    columns: {
        key: string
        label: string
        type: 'text' | 'number' | 'date'
        placeholder?: string
    }[]
    value?: Record<string, any>[]
    onChange?: (value: Record<string, any>[]) => void
    helper?: string
    className?: string
}

export const RowRepeater: React.FC<RowRepeaterProps> = ({
    label,
    columns,
    value = [],
    onChange,
    helper,
    className = ''
}) => {
    const addRow = () => {
        const newRow: Record<string, any> = {}
        columns.forEach(col => {
            newRow[col.key] = col.type === 'number' ? '' : ''
        })
        onChange?.([...value, newRow])
    }

    const removeRow = (index: number) => {
        const newValue = value.filter((_, i) => i !== index)
        onChange?.(newValue)
    }

    const updateRow = (index: number, key: string, newValue: any) => {
        const updatedValue = [...value]
        updatedValue[index] = { ...updatedValue[index], [key]: newValue }
        onChange?.(updatedValue)
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text">{label}</label>
                <button
                    type="button"
                    onClick={addRow}
                    className="btn-secondary flex items-center space-x-2 space-x-reverse text-sm"
                >
                    <PlusIcon className="h-4 w-4" />
                    <span>افزودن ردیف</span>
                </button>
            </div>

            {value.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full border border-border rounded-xl">
                        <thead className="bg-divider">
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} className="px-4 py-3 text-right text-sm font-medium text-text border-l border-border last:border-l-0">
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-sm font-medium text-text border-l border-border">
                                    عملیات
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {value.map((row, index) => (
                                <tr key={index} className="border-t border-border">
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3 border-l border-border last:border-l-0">
                                            {col.type === 'date' ? (
                                                <input
                                                    type="date"
                                                    value={row[col.key] || ''}
                                                    onChange={(e) => updateRow(index, col.key, e.target.value)}
                                                    className="form-control w-full text-sm"
                                                />
                                            ) : col.type === 'number' ? (
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    value={row[col.key] || ''}
                                                    onChange={(e) => {
                                                        const inputValue = e.target.value
                                                        if (inputValue === '' || !isNaN(Number(inputValue))) {
                                                            updateRow(index, col.key, inputValue)
                                                        }
                                                    }}
                                                    placeholder={col.placeholder}
                                                    className="form-control w-full text-sm"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={row[col.key] || ''}
                                                    onChange={(e) => updateRow(index, col.key, e.target.value)}
                                                    placeholder={col.placeholder}
                                                    className="form-control w-full text-sm"
                                                />
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center border-l border-border">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(index)}
                                            className="text-danger hover:text-red-700 p-1"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {value.length === 0 && (
                <div className="text-center py-8 text-muted">
                    <p>هیچ ردیفی اضافه نشده است. برای شروع روی "افزودن ردیف" کلیک کنید.</p>
                </div>
            )}

            {helper && (
                <p className="text-xs text-muted">{helper}</p>
            )}
        </div>
    )
}
