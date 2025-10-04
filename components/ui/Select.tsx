import React from 'react'

interface SelectOption {
    value: string
    label: string
}

interface SelectProps {
    label: string
    options: SelectOption[]
    required?: boolean
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    helper?: string
    className?: string
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    required = false,
    value = '',
    onChange,
    placeholder = 'انتخاب کنید...',
    helper,
    className = ''
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-text">
                {label}
                {required && <span className="text-danger mr-1">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className="form-control w-full"
                required={required}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {helper && (
                <p className="text-xs text-muted">{helper}</p>
            )}
        </div>
    )
}
