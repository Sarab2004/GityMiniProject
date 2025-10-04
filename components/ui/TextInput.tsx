import React from 'react'

interface TextInputProps {
    label: string
    placeholder?: string
    required?: boolean
    value?: string
    onChange?: (value: string) => void
    helper?: string
    className?: string
}

export const TextInput: React.FC<TextInputProps> = ({
    label,
    placeholder,
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
                type="text"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className="form-control w-full"
                required={required}
            />
            {helper && (
                <p className="text-xs text-muted">{helper}</p>
            )}
        </div>
    )
}
