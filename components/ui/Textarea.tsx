import React from 'react'

interface TextareaProps {
    label: string
    placeholder?: string
    required?: boolean
    value?: string
    onChange?: (value: string) => void
    rows?: number
    helper?: string
    className?: string
}

export const Textarea: React.FC<TextareaProps> = ({
    label,
    placeholder,
    required = false,
    value = '',
    onChange,
    rows = 4,
    helper,
    className = ''
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-text">
                {label}
                {required && <span className="text-danger mr-1">*</span>}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="form-control w-full resize-none"
                required={required}
            />
            {helper && (
                <p className="text-xs text-muted">{helper}</p>
            )}
        </div>
    )
}
