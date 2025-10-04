import React from 'react'

interface RadioOption {
    value: string
    label: string
}

interface RadioGroupProps {
    label: string
    options: RadioOption[]
    required?: boolean
    value?: string
    onChange?: (value: string) => void
    helper?: string
    className?: string
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
    label,
    options,
    required = false,
    value = '',
    onChange,
    helper,
    className = ''
}) => {
    return (
        <div className={`space-y-3 ${className}`}>
            <label className="block text-sm font-medium text-text">
                {label}
                {required && <span className="text-danger mr-1">*</span>}
            </label>
            <div className="space-y-2">
                {options.map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                        <input
                            type="radio"
                            name={label}
                            value={option.value}
                            checked={value === option.value}
                            onChange={(e) => onChange?.(e.target.value)}
                            className="h-4 w-4 text-accent border-border focus:ring-focus"
                            required={required}
                        />
                        <span className="text-sm text-text">{option.label}</span>
                    </label>
                ))}
            </div>
            {helper && (
                <p className="text-xs text-muted">{helper}</p>
            )}
        </div>
    )
}
