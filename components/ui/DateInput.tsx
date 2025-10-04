import React from 'react'

interface DateInputProps {
    label: string
    required?: boolean
    value?: string
    onChange?: (value: string) => void
    helper?: string
    className?: string
}

export const DateInput: React.FC<DateInputProps> = ({
    label,
    required = false,
    value = '',
    onChange,
    helper,
    className = ''
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-text">
                {label}
                {required && <span className="text-danger mr-1">*</span>}
            </label>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className="form-control w-full"
                required={required}
            />
            {helper && (
                <p className="text-xs text-muted">{helper}</p>
            )}
        </div>
    )
}
